import express from "express";
import { 
  getStats, 
  getRecentBorrows, 
  getTopBorrowers, 
  getMostBorrowedBooks, 
  getDashboardData
} from "../controllers/admin.controller.js";
import { verifyToken, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

/** * SECURITY MIDDLEWARE
 * Applies to all routes in this file. 
 * verifyToken ensures they are logged in.
 * adminOnly ensures they have the correct permissions.
 */
router.use(verifyToken);
router.use(adminOnly);

// Real-time Dashboard Endpoints
router.get("/stats", getStats);
router.get("/recent-borrows", getRecentBorrows);
router.get("/top-borrowers", getTopBorrowers);
router.get("/most-borrowed-books", getMostBorrowedBooks);
router.get("/dashboard-data", getDashboardData);
export default router;