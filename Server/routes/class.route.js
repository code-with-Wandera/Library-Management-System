import express from "express";
import { getClasses, createClass, updateClass, deleteClass } from "../controllers/class.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route
router.get("/classes", getClasses);

// Admin-only routes
router.post("/classes", protect, adminOnly, createClass);
router.patch("/classes/:id", protect, adminOnly, updateClass);
router.delete("/classes/:id", protect, adminOnly, deleteClass);

export default router;
