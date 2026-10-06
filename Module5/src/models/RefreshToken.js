import mongoose from "mongoose";
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // SHA-256 hash of the refresh token, never the token itself. unique gives a fast lookup too.
    tokenHash: { type: String, required: true, unique: true },
    // TTL index (below) lets MongoDB delete the document by itself after this date.
    expiresAt: { type: Date, required: true },
    // null = still usable. A date = revoked (logout or already rotated).
    revokedAt: { type: Date, default: null }
  },
  { timestamps: true }
);
// expireAfterSeconds 0 means "delete when expiresAt is reached". Revoked tokens are kept until then
// so a reused old token is still found and rejected instead of looking like an unknown token.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
