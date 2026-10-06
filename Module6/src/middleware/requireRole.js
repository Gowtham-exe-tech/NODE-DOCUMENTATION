import { AppError } from "../utils/AppError.js";
// Usage: requireRole("admin"). It must run AFTER authenticateToken because it reads req.user.
export const requireRole = (...allowedRoles) => (req, res, next) => {
  // No req.user means authenticateToken did not run, which is a 401 situation.
  if (!req.user) return next(new AppError("Authentication required", 401));
  // Logged in but wrong role = 403.
  if (!allowedRoles.includes(req.user.role)) return next(new AppError("You do not have permission to perform this action", 403));
  next();
};
