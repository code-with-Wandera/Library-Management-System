// src/routes/books.routes.js
import express from "express";
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  toggleBorrowBook,
} from "../controllers/books.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js"; // protects routes

const router = express.Router();

router.get("/", verifyToken, getBooks);
router.post("/", verifyToken, addBook);
router.put("/:id", verifyToken, updateBook);
router.delete("/:id", verifyToken, deleteBook);
router.put("/:id/toggle-borrow", verifyToken, toggleBorrowBook);

export default router;
