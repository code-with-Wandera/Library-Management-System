import express from "express";
import { 
  borrowBook, 
  returnBook, 
  getActiveLoans 
} from "../controllers/borrow.controller.js";
import { protect, adminOnly } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @route   ALL /api/borrow/*
 * @access  Protected (Any logged-in user/staff)
 */
router.use(protect); 

// 1. Issue a book
// POST /api/borrow/
router.post("/", borrowBook);

// 2. Get list of all books currently out
// GET /api/borrow/active
router.get("/active", getActiveLoans);

/**
 * @route   PATCH /api/borrow/return/:borrowId
 * @access  Admin/Librarian Only
 * @note    We use adminOnly here to ensure members can't "return" 
 * their own books via API tools like Postman to avoid fines.
 */
router.patch("/return/:borrowId", adminOnly, returnBook);

export default router;