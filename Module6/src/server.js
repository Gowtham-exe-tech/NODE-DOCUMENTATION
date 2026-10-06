import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import app from "./app.js";
async function startServer() {
  try {
    // Wait for MongoDB first, so the API never accepts requests it can't answer.
    await connectDatabase();
    const server = app.listen(env.port, () => console.log(`ShieldCart running at http://localhost:${env.port} (${env.nodeEnv})`));
    // Ctrl+C: stop taking requests, close the database, then exit.
    process.on("SIGINT", () => server.close(async () => { await mongoose.connection.close(); process.exit(0); }));
  } catch (error) {
    console.error("Could not start the server:", error.message);
    process.exit(1);
  }
}
startServer();
