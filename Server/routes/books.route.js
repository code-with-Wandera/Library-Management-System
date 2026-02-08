// src/routes/books.routes.js
import express from "express";
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  issueBook,   // Controller must have: export const issueBook = ...
  returnBook,  // Controller must have: export const returnBook = ...
} from "../controllers/books.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * STANDARD CRUD
 */
router.get("/", verifyToken, getBooks);
router.post("/", verifyToken, addBook);
router.put("/:id", verifyToken, updateBook);
router.delete("/:id", verifyToken, deleteBook);

/**
 * LIBRARY TRANSACTIONS
 * Using POST because these actions modify sub-resources (loans/fines)
 */
router.post("/:id/issue", verifyToken, issueBook);
router.post("/:id/return", verifyToken, returnBook);

export default router;