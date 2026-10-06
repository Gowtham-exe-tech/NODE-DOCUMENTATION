import { Router } from "express";
import { register, login, refresh, logout, getMe } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/authenticateToken.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, refreshSchema } from "../schemas/auth.schema.js";
const router = Router();
// Public routes. The rate limiter for register/login/refresh is attached in app.js.
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
// Protected routes: authenticate first, then validate, then the controller.
router.post("/logout", authenticateToken, validate(refreshSchema), logout);
router.get("/me", authenticateToken, getMe);
export default router;
