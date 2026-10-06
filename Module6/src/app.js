import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import { AppError } from "./utils/AppError.js";
import { errorHandler } from "./middleware/errorHandler.js";
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(currentDir, "..", "public");
const app = express();
// Helmet sets security headers. In development I drop upgrade-insecure-requests because
// Safari would try to load localhost over https and break the page.
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: env.isProduction ? {} : { "upgrade-insecure-requests": null } } }));
// One exact origin from .env. A wildcard "*" can't be combined with credentials.
app.use(cors({ origin: env.clientOrigin, credentials: true }));
// Small body limit, auth and product requests never need more than a few KB.
app.use(express.json({ limit: "10kb" }));
// Registered for future cookie based tokens. This POC sends tokens in headers/body, so nothing reads cookies yet.
app.use(cookieParser());
app.use(express.static(publicDir));
// Loose limit for the whole API, only meant to stop obvious abuse.
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { message: "Too many requests, please slow down" } });
// Strict limit for credential endpoints. skipSuccessfulRequests means only failed attempts count,
// so normal users aren't blocked but password guessing is.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true, message: { message: "Too many failed attempts, try again in 15 minutes" } });
app.use("/api", apiLimiter);
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", message: "Auth and RBAC API is running" });
});
app.use(["/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh"], authLimiter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
// Nothing matched above, so this is a 404.
app.use((req, res, next) => next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404)));
// Must be the LAST app.use so it catches errors from everything above.
app.use(errorHandler);
export default app;
