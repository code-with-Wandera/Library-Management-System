import Class from "../models/class.model.js";

// GET /classes?search=S1&page=1&limit=5
export const getClasses = async (req, res) => {
  try {
    let { search = "", page = 1, limit = 5 } = req.query;

    // Convert to numbers
    page = Number(page);
    limit = Number(limit);

    // Validation
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 5;
    if (limit > 50) limit = 50; // maximum 50 items per page

    const query = search
      ? { name: { $regex: search, $options: "i" } } // case-insensitive search
      : {};

    const skip = (page - 1) * limit;

    // Fetch classes and total count in parallel
    const [classes, total] = await Promise.all([
      Class.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Class.countDocuments(query),
    ]);

    res.status(200).json({
      data: classes,
      total,            // total matching documents
      page,             // current page
      pages: Math.ceil(total / limit), // total pages
    });
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

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Class name is required" });
  }

  try {
    const existing = await Class.findOne({ name: name.trim() });
    if (existing && existing._id.toString() !== id) {
      return res
        .status(409)
        .json({ message: "Class name already exists" });
    }

    const updated = await Class.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Class not found" });
    }

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
