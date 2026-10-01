// our own error class, extends the normal Error
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message); // sets error.message
    this.statusCode = statusCode; // like 404 or 401
    this.details = details; // extra info, used for validation errors
    this.isOperational = true; // true = expected error, not a bug
    Error.captureStackTrace(this, this.constructor); // keeps the stack trace clean
  }
}
module.exports = AppError;
