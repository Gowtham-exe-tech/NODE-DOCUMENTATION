import { AppError } from "../utils/AppError.js";
// validate(schema) checks req.body by default. For URL params I call validate(schema, "params").
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
    return next(new AppError("Validation failed", 400, details));
  }
  // Replace the raw input with the parsed version (trimmed, lowercased) so controllers only see clean data.
  req[source] = result.data;
  next();
};
