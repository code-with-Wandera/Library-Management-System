// routes/members.routes.js
import express from "express";
import {
  getMembers,
  addMember,
  importMembersFromCSV,
} from "../controllers/members.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// GET all members (protected)
router.get("/", protect, getMembers);

// ADD single member (protected)
router.post("/", protect, addMember);

// IMPORT members from CSV (protected)
router.post("/import", protect, upload.single("file"), importMembersFromCSV);

export default router;
