import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { AppError } from "../utils/AppError.js";
import { createAccessToken, createRefreshToken, verifyRefreshToken, hashToken } from "../utils/jwt.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
// A fake hash that is compared when the email does not exist. Without it, "unknown email" would answer
// much faster than "wrong password" (no bcrypt work) and an attacker could use the timing to find real emails.
const dummyPasswordHash = await User.hashPassword("notARealPassword123");
// Creates the access + refresh pair and saves ONLY the refresh token hash in MongoDB.
async function issueTokens(user) {
  const accessToken = createAccessToken(user);
  const { token: refreshToken, expiresAt } = createRefreshToken(user._id);
  await RefreshToken.create({ user: user._id, tokenHash: hashToken(refreshToken), expiresAt });
  return { accessToken, refreshToken };
}
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email is already registered", 409);
  const passwordHash = await User.hashPassword(password);
  // role is never read from the request body, new accounts are always "user".
  // If two requests race past the check above, the unique index throws and errorHandler returns 409.
  const user = await User.create({ name, email, passwordHash });
  const tokens = await issueTokens(user);
  res.status(201).json({ user: user.toSafeObject(), ...tokens });
});
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  const passwordMatches = await User.comparePassword(password, user ? user.passwordHash : dummyPasswordHash);
  // Same message for "no such email" and "wrong password" so the API doesn't reveal which emails exist.
  if (!user || !passwordMatches) throw new AppError("Invalid email or password", 401);
  // Checked after the password so only the real owner learns the account is disabled.
  if (!user.isActive) throw new AppError("This account has been disabled", 403);
  const tokens = await issueTokens(user);
  res.json({ user: user.toSafeObject(), ...tokens });
});
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  // Steps 2 and 3: signature, expiry and type are checked inside verifyRefreshToken.
  const payload = verifyRefreshToken(refreshToken);
  // Steps 4 and 5: the token is only trusted if its hash exists in the database.
  const storedToken = await RefreshToken.findOne({ tokenHash: hashToken(refreshToken) });
  if (!storedToken || storedToken.user.toString() !== payload.sub) throw new AppError("Refresh token not recognised", 401);
  // Steps 6 and 7: revoked means it was already used (rotated) or the user logged out.
  if (storedToken.revokedAt) throw new AppError("Refresh token has been revoked", 401);
  if (storedToken.expiresAt <= new Date()) throw new AppError("Refresh token expired", 401);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError("User is not allowed to refresh", 401);
  // Step 8: the update only matches while revokedAt is still null. If two requests send the same token at the
  // same time, only one of them wins this update, so one refresh token can never create two new pairs.
  const revokedToken = await RefreshToken.findOneAndUpdate({ _id: storedToken._id, revokedAt: null }, { revokedAt: new Date() });
  if (!revokedToken) throw new AppError("Refresh token has been revoked", 401);
  // Steps 9 to 12: brand new pair, new refresh token hash saved.
  const tokens = await issueTokens(user);
  res.json({ user: user.toSafeObject(), ...tokens });
});
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  // Filtering by req.user.id means a user can only revoke their own tokens.
  // Logging out twice is fine, the second time simply matches nothing.
  await RefreshToken.updateOne({ tokenHash: hashToken(refreshToken), user: req.user.id, revokedAt: null }, { revokedAt: new Date() });
  res.json({ message: "Logged out successfully" });
});
export const getMe = asyncHandler(async (req, res) => {
  // req.user was already loaded from the database by authenticateToken.
  res.json({ user: req.user });
});
