// src/routes/books.routes.js
import express from "express";
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  issueBook,   // Updated logic
  returnBook,  // Updated logic
} from "../controllers/books.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// --- Standard CRUD ---
router.get("/", verifyToken, getBooks);
router.post("/", verifyToken, addBook);
router.put("/:id", verifyToken, updateBook);
router.delete("/:id", verifyToken, deleteBook);

// --- Library Logic Endpoints ---
/** * We use POST for these actions because they represent a 
 * "transaction" (creating a loan or a return record) 
 */
router.post("/:id/issue", verifyToken, issueBook);
router.post("/:id/return", verifyToken, returnBook);

export default router;