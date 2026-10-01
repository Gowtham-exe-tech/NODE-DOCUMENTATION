const AppError = require("../errors/AppError");
// authorize("admin") returns a middleware, so we can reuse it with any role
// must run AFTER authenticate because it reads res.locals.user
const authorize = (...allowedRoles) => (req, res, next) => {
  const user = res.locals.user;
  if (!user || !allowedRoles.includes(user.role)) return next(new AppError("Forbidden", 403)); // logged in but not allowed
  next();
};
module.exports = authorize;
