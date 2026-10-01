const AppError = require("../errors/AppError");
// fake users, in real life this would come from a database or jwt
const fakeUsers = { "user-1": { id: "user-1", name: "Gowtham", role: "user" }, "user-2": { id: "user-2", name: "Arun", role: "user" }, "admin-1": { id: "admin-1", name: "Admin", role: "admin" } };
// checks "Authorization: Bearer user-1" and saves the user in res.locals
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(new AppError("Authentication required", 401)); // no header at all
  const [scheme, token] = authHeader.split(" ");
  const foundUser = fakeUsers[token];
  if (scheme !== "Bearer" || !foundUser) return next(new AppError("Invalid authentication token", 401)); // wrong format or unknown token
  res.locals.user = foundUser; // request-scoped, only lives for this request
  next();
};
module.exports = authenticate;
