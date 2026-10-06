import { Router } from "express";
import { createUser, getUsers, getUserOrders } from "../controllers/userController.js";

const router = Router();

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:userId/orders", getUserOrders);

export default router;
