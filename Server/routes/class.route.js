// src/routes/class.routes.js
import express from "express";
import { 
  getClasses, 
  getClassById, // Added for detail view
  createClass, 
  updateClass, 
  deleteClass 
} from "../controllers/class.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * PUBLIC/MEMBER ROUTES
 * Generally, members should be able to see class lists or their own class details
 */
router.get("/", protect, getClasses);
router.get("/:id", protect, getClassById);

/**
 * ADMIN ONLY ROUTES
 * Management of the school structure (Adding/Removing classes)
 */
router.post("/", protect, adminOnly, createClass);
router.patch("/:id", protect, adminOnly, updateClass);
router.delete("/:id", protect, adminOnly, deleteClass);

export default router;