import express from "express";
import { getDashboardData } from "../controllers/admin.controller.js";
import { verifyToken, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

/** * SECURITY MIDDLEWARE
 * Standard security gate: Must be logged in AND be an admin.
 */
router.use(verifyToken);
router.use(adminOnly);

/**
 * COMBINED DASHBOARD ENDPOINT
 * Replaces: /stats, /recent-borrows, /top-borrowers, and /most-borrowed-books
 * This prevents 429 Too Many Requests errors by reducing 5 calls down to 1.
 */
router.get("/dashboard-data", getDashboardData);

export default router;