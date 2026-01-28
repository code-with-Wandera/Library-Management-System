
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.config.js";
import bookRoutes from "./routes/books.route.js";
import memberRoutes from "./routes/members.route.js";
import authRoutes from "./routes/auth.route.js";
import classRoutes from "./routes/class.route.js";
import adminRoutes from "./routes/admin.route.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/members", memberRoutes)
app.use("/api", classRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
