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
  getMemberTransactions,
  payFine,
  getFineReportData,
} from "../controllers/members.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";
import mongoose from "mongoose";
import multer from "multer";

const router = express.Router();

/**
 * MULTER CONFIG
 * Destination: uploads/ folder
 * Limit: 5MB
 */
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 } 
});

/**
 * VALIDATE MONGODB ID
 * Catches malformed IDs before they hit the database
 */
const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid Member ID format" });
  }
  next();
};

// --- GLOBAL MIDDLEWARE ---
router.use(protect); // All member routes require a valid token

// --- ANALYTICS & REPORTS (Static paths first) ---
router.get("/analytics/growth", adminOnly, getMemberGrowth);
router.get("/export", adminOnly, exportMembers);
router.get("/reports/fines", adminOnly, getFineReportData); 
router.post("/import", adminOnly, upload.single("file"), importMembers);

// --- COLLECTION MANAGEMENT ---
router.get("/", getMembers); 
router.post("/", adminOnly, addMember);

// --- RESOURCE SPECIFIC ROUTES (ID-based paths last) ---
router.get("/:id", validateId, getMemberById);
router.patch("/:id", adminOnly, validateId, updateMember);
router.delete("/:id", adminOnly, validateId, deleteMember);

// --- FINANCIAL & TRANSACTION ROUTES ---
router.patch("/:id/pay-fine", adminOnly, validateId, payFine);
router.get("/:id/transactions", adminOnly, validateId, getMemberTransactions);

export default router;