import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    description: { type: String, required: [true, "Description is required"], trim: true },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    category: { type: String, required: [true, "Category is required"], trim: true },
    // Number type allows decimals, so I add a validator to force whole numbers for stock.
    stock: { type: Number, default: 0, min: [0, "Stock cannot be negative"], validate: { validator: Number.isInteger, message: "Stock must be a whole number" } },
    // Soft delete flag: admins "delete" a product by setting this to false.
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false, transform: (doc, ret) => { delete ret._id; return ret; } }
  }
);
// The product list filters on isActive and often category, so this compound index lets MongoDB
// jump straight to matching products instead of scanning the whole collection.
productSchema.index({ category: 1, isActive: 1 });
export const Product = mongoose.model("Product", productSchema);
