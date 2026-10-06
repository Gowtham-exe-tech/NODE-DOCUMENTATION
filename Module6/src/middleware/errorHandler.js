import { env } from "../config/env.js";
// Every error in the app ends up here, so the client always gets the same { message } shape.
// Express knows this is an error handler because it has 4 parameters, so keep `next` even if unused.
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details = null;
  if (err.isOperational) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation failed";
    details = err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
  } else if (err.name === "ValidationError") {
    // Mongoose schema validation failed
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    // MongoDB duplicate key (unique index), for example registering the same email twice at the same moment.
    statusCode = 409;
    message = `${Object.keys(err.keyValue || {}).join(", ") || "Value"} already exists`;
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  } else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Request body is not valid JSON";
  } else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }
  if (statusCode === 500) {
    // Unexpected bug: log everything on the server, but only show a generic message to the client in production.
    console.error("Unexpected error:", err);
    if (!env.isProduction) message = err.message || message;
  }
  const body = { message };
  if (details) body.errors = details;
  if (statusCode === 500 && !env.isProduction) body.stack = err.stack;
  res.status(statusCode).json(body);
};
