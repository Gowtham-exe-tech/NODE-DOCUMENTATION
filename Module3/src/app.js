const express = require("express");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const asyncHandler = require("./middleware/asyncHandler");
const taskRoutes = require("./routes/task.routes");
const AppError = require("./errors/AppError");
const app = express();
// application-level middleware, runs on every request in this order
app.use(requestLogger);
app.use(express.json()); // fills req.body from json
app.use("/api/tasks", taskRoutes);
// demo route to see an unexpected error (500), delete it later
app.get("/api/debug/crash", asyncHandler(async () => { throw new Error("Database exploded"); }));
// nothing matched above, so make a 404
app.use((req, res, next) => { next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404)); });
// error handler must be the LAST middleware
app.use(errorHandler);
module.exports = app;
