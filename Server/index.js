// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.config.js";

// Routes
import authRoutes from "./routes/auth.route.js";
import bookRoutes from "./routes/books.route.js";
import memberRoutes from "./routes/members.route.js";
import classRoutes from "./routes/class.route.js";
import adminRoutes from "./routes/admin.route.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// MIDDLEWARE
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin
app.use(express.json({ limit: "10mb" })); // JSON parser
app.use(express.urlencoded({ extended: true })); // Form data parser
app.use(morgan("combined")); // HTTP request logging

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/admin", adminRoutes);

// HEALTH CHECK
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// 404 HANDLER
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
