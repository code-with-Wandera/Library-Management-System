// routes/members.route.js
import express from "express";
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
import multer from "multer";

// Setup multer for CSV upload
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Protect all routes
router.use(protect);

// ---------------------------
// CRUD
// ---------------------------

// GET all members (paginated, searchable, sortable)
router.get("/", getMembers);

// GET single member
router.get("/:id", getMemberById);

// POST add member (admin/librarian)
router.post("/", adminOnly, addMember);

// DELETE member (admin only)
router.delete("/:id", adminOnly, deleteMember);

// ---------------------------
// CSV
// ---------------------------

// Import members from CSV (admin/librarian)
router.post("/import", adminOnly, upload.single("file"), importMembers);

// Export members to CSV (admin/librarian)
router.get("/export", adminOnly, exportMembers);

// ---------------------------
// Analytics
// ---------------------------

// Member growth over time
router.get("/analytics/growth", adminOnly, getMemberGrowth);

export default router;
