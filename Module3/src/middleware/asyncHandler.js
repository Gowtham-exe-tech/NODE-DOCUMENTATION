// wraps an async function so a rejected promise goes to next(error)
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next); // .catch(next) sends the error to errorHandler
};
module.exports = asyncHandler;
