import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./AppError.js";
const accessTokenExpiresIn = "15m";
const refreshTokenExpiresIn = "7d";
// Pin the algorithm on sign AND verify so a token can't pick a weaker one.
const signOptions = { algorithm: "HS256" };
const verifyOptions = { algorithms: ["HS256"] };
export function createAccessToken(user) {
  // Short lived on purpose: if it leaks, it stops working after 15 minutes.
  return jwt.sign({ sub: user._id.toString(), role: user.role, type: "access" }, env.jwtAccessSecret, { ...signOptions, expiresIn: accessTokenExpiresIn });
}
export function verifyAccessToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtAccessSecret, verifyOptions);
  } catch (error) {
    if (error.name === "TokenExpiredError") throw new AppError("Access token expired", 401);
    throw new AppError("Invalid access token", 401);
  }
  // Both token types are signed by me, so I still check type to stop one being used as the other.
  if (payload.type !== "access") throw new AppError("Wrong token type", 401);
  return payload;
}
export function createRefreshToken(userId) {
  // jti makes every refresh token unique, otherwise two tokens created in the same second would be identical
  // and the unique tokenHash index in MongoDB would reject the second one.
  const token = jwt.sign({ sub: userId.toString(), type: "refresh", jti: crypto.randomUUID() }, env.jwtRefreshSecret, { ...signOptions, expiresIn: refreshTokenExpiresIn });
  // I read exp back from the token so the database expiresAt always matches the JWT expiry.
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  return { token, expiresAt };
}
export function verifyRefreshToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, env.jwtRefreshSecret, verifyOptions);
  } catch (error) {
    if (error.name === "TokenExpiredError") throw new AppError("Refresh token expired", 401);
    throw new AppError("Invalid refresh token", 401);
  }
  if (payload.type !== "refresh") throw new AppError("Wrong token type", 401);
  return payload;
}
// Only this hash goes into MongoDB. If the database leaks, the hashes can't be used to call /refresh.
// SHA-256 is fine here (no bcrypt) because the token is long and random, not a guessable password.
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
