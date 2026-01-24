import express from "express";
import Class from "../models/Class.js";

const router = express.Router();

// Get all classes
router.get("/", async (req, res) => {
  const classes = await Class.find().sort({ name: 1 });
  res.json(classes);
});

// Create class
router.post("/", async (req, res) => {
  const newClass = new Class({ name: req.body.name });
  await newClass.save();
  res.json(newClass);
});

// Delete class
router.delete("/:id", async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.json({ message: "Class deleted" });
});

export default router;
