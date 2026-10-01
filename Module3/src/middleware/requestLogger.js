// application-level middleware, logs every request
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${req.method} ${req.originalUrl} ${timestamp}`);
  next(); // pass to the next middleware, if I forget this the request hangs
};
module.exports = requestLogger;
