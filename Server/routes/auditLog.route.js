import express from "express";
// FIX: Ensure this filename matches EXACTLY what is in your controllers folder
import { getSystemLogs } from "../controllers/auditLog.controller.js"; 
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getSystemLogs);

export default router;