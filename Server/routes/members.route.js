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
} from "../controllers/members.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 1. Authentication Middleware (Applies to all routes below)
router.use(protect);

// 2. Static / Specific Routes (Must come BEFORE dynamic /:id)
router.get("/analytics/growth", adminOnly, getMemberGrowth);
router.get("/export", adminOnly, exportMembers);
router.post("/import", adminOnly, upload.single("file"), importMembers);

// 3. Collection Routes
router.get("/", getMembers);
router.post("/", adminOnly, addMember);

// 4. Dynamic ID Routes (Place at the end)
router.get("/:id", getMemberById);
router.patch("/:id", adminOnly, updateMember); // Handles class assignments & edits
router.delete("/:id", adminOnly, deleteMember);

export default router;