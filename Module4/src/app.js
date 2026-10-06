import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());

app.use(express.static(path.join(currentDirectory, "../public")));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);

app.get("/api/v1/health", (req, res) =>
  res.json({ status: "ok", message: "E-commerce API is running" }),
);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));

app.use((error, req, res, next) => {
  console.error("Unexpected error:", error);
  res.status(500).json({ message: "Something went wrong on the server" });
});

export default app;
