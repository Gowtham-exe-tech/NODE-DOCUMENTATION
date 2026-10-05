const { z } = require("zod");
// small rules first, then join them into the schemas
const titleRule = z
  .string()
  .min(3, "Title must be at least 3 characters")
  .max(100, "Title must be at most 100 characters");
const descriptionRule = z
  .string()
  .max(500, "Description must be at most 500 characters");
const priorityRule = z.enum(["low", "medium", "high"]);
const statusRule = z.enum(["pending", "in_progress", "completed"]);
const dueDateRule = z
  .string()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "dueDate must be a valid date like 2026-12-31",
  );
const tagsRule = z
  .array(z.string().min(1, "Tag cannot be empty").max(20, "Tag is too long"))
  .max(5, "Maximum 5 tags"); // array validation
// create: title and priority are required, rest optional
const createTaskSchema = z.object({
  title: titleRule,
  description: descriptionRule.optional(),
  priority: priorityRule,
  status: statusRule.optional(),
  dueDate: dueDateRule.optional(),
  tags: tagsRule.optional(),
});
// update: everything optional, but body cannot be empty
const updateTaskSchema = z
  .object({
    title: titleRule.optional(),
    description: descriptionRule.optional(),
    priority: priorityRule.optional(),
    status: statusRule.optional(),
    dueDate: dueDateRule.optional(),
    tags: tagsRule.optional(),
  })
  .refine(
    (body) => Object.keys(body).length > 0,
    "Send at least one field to update",
  );
module.exports = { createTaskSchema, updateTaskSchema };
