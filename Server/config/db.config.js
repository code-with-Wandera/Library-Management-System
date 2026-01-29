// config/db.config.js
import mongoose from "mongoose";

/**
 * Connect to MongoDB
 * Reads the connection URI from process.env.MONGO_URI
 * Exits the process on failure
 */
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not defined in environment variables");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI); // Mongoose 7+ doesn't need options
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Stop server if DB connection fails
  }

  // Optional: graceful shutdown on process termination
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log(" MongoDB connection closed due to app termination");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
  });
};

export default connectDB;
