import mongoose from "mongoose";
import { env } from "./env.js";
// Mongoose connections emit "connected" (not a generic "connect") once the first socket is ready,
// and "disconnected" / "error" later, so these three events are enough to watch the connection.
mongoose.connection.on("connected", () => console.log("MongoDB connection established"));
mongoose.connection.on("error", (error) => console.error("MongoDB connection error:", error.message));
mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
export async function connectDatabase() {
  // Awaiting this means server.js can wait for a real connection before it listens.
  await mongoose.connect(env.mongodbUri, {
    // The pool keeps sockets open and reuses them so every request does not open a new connection.
    maxPoolSize: 10,
    minPoolSize: 2,
    // Give up after 5s instead of the 30s default when Atlas is unreachable (wrong IP whitelist, etc).
    serverSelectionTimeoutMS: 5000
  });
}
export async function disconnectDatabase() {
  await mongoose.disconnect();
}
