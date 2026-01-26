// routes/admin.routes.js
import express from "express";
import { adminOnly, verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", verifyToken, adminOnly, (req, res) => {
  res.json({ totalBooks: 100, totalMembers: 50 });
});

router.get("/recent-borrows", verifyToken, adminOnly, (req, res) => {
  res.json([{ member: "John Doe", book: "Maths 101" }]);
});

router.get("/top-borrowers", verifyToken, adminOnly, (req, res) => {
  res.json([{ member: "Jane Doe", borrows: 5 }]);
});

router.get("/most-borrowed-books", verifyToken, adminOnly, (req, res) => {
  res.json([{ book: "English 101", borrows: 10 }]);
});

export default router;
