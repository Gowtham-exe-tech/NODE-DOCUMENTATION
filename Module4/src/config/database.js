import mongoose from "mongoose";


const databaseConnection = mongoose.connection;

databaseConnection.on("connected", () =>
  console.log("MongoDB connection established"),
);

databaseConnection.on("error", (error) =>
  console.error("MongoDB connection error:", error.message),
);

databaseConnection.on("disconnected", () =>
  console.log("MongoDB connection closed"),
);

async function connectDatabase() {

  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is missing in .env");

  // Mongoose keeps a pool of reusable connections instead of opening one for every request.
  await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
  });
}


export default connectDatabase;
