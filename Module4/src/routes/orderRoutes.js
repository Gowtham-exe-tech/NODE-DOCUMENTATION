import { Router } from "express";
import { createOrder, getOrders, getOrderById } from "../controllers/orderController.js";

const router = Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:orderId", getOrderById);

export default router;
