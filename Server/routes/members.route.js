import express from "express";
import multer from "multer";
import {
  getMembers,
  getMemberById,
  addMember,
  deleteMember,
  importMembers,
  exportMembers,
  getMemberGrowth,
} from "../controllers/members.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// All routes require authentication
router.use(protect);

// CRUD
router.get("/", getMembers);
router.get("/:id", getMemberById);
router.post("/", adminOnly, addMember);
router.delete("/:id", adminOnly, deleteMember);

// CSV
router.post("/import", adminOnly, upload.single("file"), importMembers);
router.get("/export", adminOnly, exportMembers);

// Analytics
router.get("/analytics/growth", adminOnly, getMemberGrowth);

export default router;
