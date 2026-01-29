// routes/members.route.js
import express from "express";
import {
  getMembers,
  getMemberById,
  addMember,          // <-- import the new controller function
  deleteMember,
  importMembers,
  exportMembers,
  getMemberGrowth,
} from "../controllers/members.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Protect all routes
router.use(protect);

// GET all members
router.get("/", getMembers);

// GET single member
router.get("/:id", getMemberById);

// POST add member (admin/librarian) with optional email
router.post("/", adminOnly, addMember);

// DELETE member
router.delete("/:id", adminOnly, deleteMember);

// CSV import/export
router.post("/import", adminOnly, upload.single("file"), importMembers);
router.get("/export", adminOnly, exportMembers);

// Analytics
router.get("/analytics/growth", adminOnly, getMemberGrowth);

export default router;
