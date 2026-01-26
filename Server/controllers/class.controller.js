import Class from "../models/class.model.js";

// GET /classes
export const getClasses = async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.status(200).json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
};

// POST /classes
export const createClass = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Class name is required" });

  try {
    const existing = await Class.findOne({ name });
    if (existing) return res.status(400).json({ message: "Class already exists" });

    const newClass = new Class({ name });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create class" });
  }
};

// PUT /classes/:id
export const updateClass = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) return res.status(400).json({ message: "Class name is required" });

  try {
    const updated = await Class.findByIdAndUpdate(id, { name }, { new: true });
    if (!updated) return res.status(404).json({ message: "Class not found" });

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update class" });
  }
};

// DELETE /classes/:id
export const deleteClass = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Class.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Class not found" });

    res.status(200).json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete class" });
  }
};
