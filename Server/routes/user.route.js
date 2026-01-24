import express from "express";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// Any logged-in user
router.get("/profile", protect, (req, res) => {
  res.json(req.user);
});

// Admin-only route
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin 👑" });
});

export default router;
