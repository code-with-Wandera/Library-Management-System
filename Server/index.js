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

dotenv.config();
connectDB();

const app = express();

// --- 1. SECURITY & LOGGING ---
app.use(helmet()); 
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173", // Specify your Vite/React port
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// Adjusted Rate Limiter: 
// 100 requests per 15 mins is tight for a dashboard app.
// Let's increase this to 500 per 15 mins for development/standard use.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, 
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests, please try again after 15 minutes." }
});

// Apply limiter to all routes
app.use("/api/", limiter);

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
  // Don't log expected 404s as errors in production
  if (statusCode !== 404) console.error(`[Error] ${err.message}`);
  
  res.status(statusCode).json({
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// --- 5. START SERVER ---
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 LIB-SYS Server: Port ${PORT} (${process.env.NODE_ENV || 'dev'})`);
});

// GRACEFUL SHUTDOWN
const gracefulShutdown = (signal) => {
  console.info(`${signal} received. Cleaning up...`);
  server.close(() => {
    console.log("HTTP server closed. Process terminated.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});