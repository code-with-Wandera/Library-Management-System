import express from "express";
import multer from "multer";
import {
  getMembers,
  addMember,
  importMembersFromCSV,
} from "../controllers/members.controller.js";
 
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Multer setup for CSV uploads
const upload = multer({ dest: "uploads/" });

// ROUTES

// GET all members (any logged-in user)
router.get("/", protect, getMembers);

// ADD single member (admin only)
router.post("/", protect, adminOnly, addMember);

// IMPORT members from CSV (admin only)
router.post(
  "/import-csv",
  protect,
  adminOnly,
  upload.single("file"),
  importMembersFromCSV
);

export default router;
