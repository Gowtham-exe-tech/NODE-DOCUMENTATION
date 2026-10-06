import mongoose from "mongoose";
import bcrypt from "bcrypt";
// Cost 12 means 2^12 rounds: slow enough to make brute force expensive, still fast enough for a login.
const bcryptCost = 12;
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, minlength: [2, "Name must be at least 2 characters"] },
    // unique creates an index, so duplicate emails are blocked by MongoDB even if two requests race each other.
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    // Extra safety net: even if I forget and send a user document, passwordHash is stripped.
    toJSON: { virtuals: true, versionKey: false, transform: (doc, ret) => { delete ret._id; delete ret.passwordHash; return ret; } }
  }
);
// Hashing lives on the model so controllers never touch bcrypt directly.
userSchema.statics.hashPassword = function (plainPassword) {
  return bcrypt.hash(plainPassword, bcryptCost);
};
userSchema.statics.comparePassword = function (plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
};
// The only shape of a user that is allowed to leave the server.
userSchema.methods.toSafeObject = function () {
  return { id: this._id.toString(), name: this.name, email: this.email, role: this.role, isActive: this.isActive };
};
export const User = mongoose.model("User", userSchema);
