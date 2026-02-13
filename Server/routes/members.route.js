import express from "express";
import {
  getMembers,
  getMemberById,
  addMember,
  updateMember,      
  deleteMember,
  importMembers,
  exportMembers,
  getMemberGrowth,
  payFine,
} from "../controllers/members.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
import multer from "multer";

const router = express.Router();

/**
 * MULTER CONFIGURATION
 * Using disk storage with a size limit (5MB) to prevent Disk Space attacks
 */
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 } 
});

/**
 * MIDDLEWARE: Validate MongoDB ID
 * Prevents the controller from executing if the ID is malformed, 
 * saving database resources.
 */
const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid Member ID format" });
  }
  next();
};

// 1. Authentication Middleware (Global for this router)
router.use(protect);

// 2. Analytics & Data Routes (Admin Only)
router.get("/analytics/growth", adminOnly, getMemberGrowth);
router.get("/export", adminOnly, exportMembers);
router.post("/import", adminOnly, upload.single("file"), importMembers);
router.patch("/:id/pay-fine", payFine);

// 3. Collection Management
router.get("/", getMembers); // Librarians/Staff can view list
router.post("/", adminOnly, addMember);

// 4. Individual Resource Routes
// We add validateId here to catch bad requests early
router.get("/:id", validateId, getMemberById);
router.patch("/:id", adminOnly, validateId, updateMember);
router.delete("/:id", adminOnly, validateId, deleteMember);

export default router;