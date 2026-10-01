const AppError = require("../errors/AppError");
// error middleware has 4 params, express knows it is an error handler because of that
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err); // response already started, let express handle it
  if (err.type === "entity.parse.failed") err = new AppError("Invalid JSON body", 400); // broken json from express.json()
  const isOperational = err.isOperational === true; // true only for our AppError
  const statusCode = isOperational ? err.statusCode : 500;
  const message = isOperational ? err.message : "Internal server error"; // hide real message of bugs
  if (!isOperational) console.error("UNEXPECTED ERROR:", err); // bugs are logged on the server only
  const body = { success: false, message };
  if (isOperational && err.details) body.details = err.details; // validation details
  res.status(statusCode).json(body);
};
module.exports = errorHandler;
