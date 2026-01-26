// routes/class.routes.js
import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Dummy in-memory classes array
let classes = [
  { _id: "1", name: "S1A" },
  { _id: "2", name: "S2B" },
];

// Get all classes
router.get("/", verifyToken, (req, res) => {
  res.json(classes);
});

// Add a class
router.post("/", verifyToken, (req, res) => {
  const { name } = req.body;
  const newClass = { _id: (classes.length + 1).toString(), name };
  classes.push(newClass);
  res.json(newClass);
});

// Update a class
router.put("/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  classes = classes.map((c) => (c._id === id ? { ...c, name } : c));
  res.json(classes.find((c) => c._id === id));
});

// Delete a class
router.delete("/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  classes = classes.filter((c) => c._id !== id);
  res.json({ message: "Class deleted" });
});

export default router;
