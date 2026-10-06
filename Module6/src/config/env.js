import dotenv from "dotenv";
// Load the .env file into process.env before anything else reads it.
dotenv.config();
const requiredVars = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "CLIENT_ORIGIN"];
// Fail fast so a missing secret is noticed at startup, not in the middle of a login request.
for (const name of requiredVars) {
  if (!process.env[name]) throw new Error(`Missing environment variable: ${name}. Check your .env file.`);
}
// Using the same secret for both token types would let a refresh token pass as an access token.
if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.");
export const env = {
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production"
};
