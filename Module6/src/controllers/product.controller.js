import { Product } from "../models/Product.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
export const getProducts = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  // Only accept a plain string. Express can parse ?category[$ne]=x into an object, which would
  // become a MongoDB operator (NoSQL injection), so anything that is not a string is ignored.
  if (typeof req.query.category === "string" && req.query.category.trim()) filter.category = req.query.category.trim();
  const products = await Product.find(filter).sort({ name: 1 });
  res.json({ count: products.length, products });
});
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ product });
});
export const createProduct = asyncHandler(async (req, res) => {
  // req.body was already cleaned by validate(createProductSchema).
  const product = await Product.create(req.body);
  res.status(201).json({ product });
});
export const updateProduct = asyncHandler(async (req, res) => {
  // new: true returns the updated document. runValidators makes the model rules run on updates too.
  const product = await Product.findOneAndUpdate({ _id: req.params.id, isActive: true }, req.body, { new: true, runValidators: true });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ product });
});
export const deleteProduct = asyncHandler(async (req, res) => {
  // Soft delete: the document stays in MongoDB, it is just hidden from the shop.
  const product = await Product.findOneAndUpdate({ _id: req.params.id, isActive: true }, { isActive: false }, { new: true });
  if (!product) throw new AppError("Product not found", 404);
  res.json({ message: "Product deactivated", product });
});
