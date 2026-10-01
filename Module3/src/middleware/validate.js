const AppError = require("../errors/AppError");
// takes a zod schema and returns a middleware that checks req.body
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body); // safeParse does not throw
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join(".") || "body", message: issue.message })); // make errors easy to read
    return next(new AppError("Validation failed", 400, details));
  }
  res.locals.validatedBody = result.data; // clean data, unknown fields are removed by zod
  next();
};
module.exports = validate;
