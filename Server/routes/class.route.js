import express from "express";
import { getClasses, createClass, updateClass, deleteClass } from "../controllers/class.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// The path should be "/" because the prefix is already defined in your main server file
router.get("/", getClasses);

// Admin-only routes
router.post("/", protect, adminOnly, createClass);
router.patch("/:id", protect, adminOnly, updateClass);
router.delete("/:id", protect, adminOnly, deleteClass);

export default router;