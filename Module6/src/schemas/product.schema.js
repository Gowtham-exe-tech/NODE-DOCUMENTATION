import { z } from "zod";
const productFields = {
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  description: z.string().trim().min(1, "Description is required").max(1000, "Description is too long"),
  price: z.number({ invalid_type_error: "Price must be a number" }).min(0, "Price cannot be negative"),
  category: z.string().trim().min(1, "Category is required").max(60, "Category is too long"),
  stock: z.number({ invalid_type_error: "Stock must be a number" }).int("Stock must be a whole number").min(0, "Stock cannot be negative")
};
// stock is optional on create, the model defaults it to 0.
export const createProductSchema = z.object({ ...productFields, stock: productFields.stock.optional() }).strict();
// Update = same fields but all optional, and at least one must be sent.
export const updateProductSchema = z.object(productFields).partial().strict().refine((data) => Object.keys(data).length > 0, { message: "Send at least one field to update" });
// Checks the :id param looks like a MongoDB ObjectId before it reaches the database.
export const productIdSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product id") });
