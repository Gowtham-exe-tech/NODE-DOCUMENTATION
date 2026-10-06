// Express 4 does not catch errors from rejected promises in async functions,
// so without this the request would hang. This forwards the error to errorHandler with next(error).
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
