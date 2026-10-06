import { Router } from "express";
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from "../controllers/product.controller.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { createProductSchema, updateProductSchema, productIdSchema } from "../schemas/product.schema.js";
const router = Router();
// Any logged in user can read products.
router.get("/", authenticateToken, getProducts);
router.get("/:id", authenticateToken, validate(productIdSchema, "params"), getProductById);
// Admin only. Order matters: who are you? -> are you allowed? -> is the data valid? -> do the work.
// A normal user should get 403 before we waste time validating their body.
router.post("/", authenticateToken, requireRole("admin"), validate(createProductSchema), createProduct);
router.patch("/:id", authenticateToken, requireRole("admin"), validate(productIdSchema, "params"), validate(updateProductSchema), updateProduct);
router.delete("/:id", authenticateToken, requireRole("admin"), validate(productIdSchema, "params"), deleteProduct);
export default router;
