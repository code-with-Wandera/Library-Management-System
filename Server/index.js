import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
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

// --- 1. SECURITY & LOGGING ---
app.use(helmet()); 
app.use(cors({
  origin: process.env.CLIENT_URL || "*", // Best practice: restrict to your frontend domain
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// Rate Limiting: Prevent abuse (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use("/api/", limiter);

// Log level: 'dev' for readable logs in dev, 'combined' for standard logs in production
const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(logFormat));

// --- 2. PARSERS ---
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --- 3. ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/admin", adminRoutes);

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString() 
  });
});

// --- 4. ERROR HANDLING ---
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${err.message}`);
  
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// --- 5. START SERVER & GRACEFUL SHUTDOWN ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Graceful shutdown for SIGTERM (e.g., during a deployment update)
process.on("SIGTERM", () => {
  console.info("SIGTERM signal received. Closing HTTP server...");
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
});