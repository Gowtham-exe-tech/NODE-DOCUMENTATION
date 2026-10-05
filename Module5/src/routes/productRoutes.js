import { Router } from "express";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { getProducts } from "../controllers/productController.js";

const router = Router();

router.get("/", authenticateToken, getProducts);

/*
  Next part:
  DELETE /api/v1/products/:id
  authenticateToken
  requireRole("admin")
  deleteProduct
*/

export default router;
