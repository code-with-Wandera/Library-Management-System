import express from "express";
import { borrowBook, returnBook } from "../controllers/borrow.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.put("/borrow/:id", protect, borrowBook);
router.put("/return/:id", protect, returnBook);

export default router;
