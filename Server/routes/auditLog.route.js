import express from "express";
import { getSystemLogs } from "../controllers/audit.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// This maps to GET /api/auditLog
router.get("/", protect, getSystemLogs);

export default router;