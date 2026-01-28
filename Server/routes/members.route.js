import express from "express";
import {
  getMembers,
  getMemberById,
  addMember,
  deleteMember,
  importMembers,
  exportMembers,
  getMemberAnalytics,
  getMemberGrowth,
} from "../controllers/members.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import multer from "multer";
import { logAudit } from "../utils/auditLog.utils.js";
// Setup multer for CSV upload
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// All routes protected
router.use(protect);

// ============================
// CRUD Routes
// ============================

// Get all members (paginated)
router.get("/", getMembers);

// Get single member by ID
router.get("/:id", getMemberById);

// Add member (admin only)
router.post("/", adminOnly, addMember);

// Delete member (admin only)
router.delete("/:id", adminOnly, deleteMember);

// CSV Import/Export
// Import members from CSV (admin only)
router.post("/import", adminOnly, upload.single("file"), importMembers);

// Export members to CSV (admin only)
router.get("/export", adminOnly, exportMembers);

// Member analytics
router.get("/analytics/data", adminOnly, getMemberAnalytics);

// Member growth over time
router.get("/analytics/growth", adminOnly, getMemberGrowth);

export default router;
