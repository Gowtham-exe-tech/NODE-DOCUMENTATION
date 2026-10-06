import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { asyncHandler } from "./asyncHandler.js";
export const authenticateToken = asyncHandler(async (req, res, next) => {
  // Protected routes expect the client to send the access token as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) throw new AppError("Authentication required", 401);
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new AppError("Authentication required", 401);
  const payload = verifyAccessToken(token);
  // I load the user again instead of trusting the token. A JWT can't be taken back, so if an admin
  // was demoted or a user was disabled, the old token would still say "admin" for up to 15 minutes.
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError("User no longer exists", 401);
  if (!user.isActive) throw new AppError("Account is disabled", 401);
  // From here on every handler uses req.user, and its role comes from the database.
  req.user = user.toSafeObject();
  next();
});
