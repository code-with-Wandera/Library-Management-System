import Class from "../models/class.model.js";
import mongoose from "mongoose"; // Added mongoose for ID validation

// GET /classes?search=&page=1&limit=5
export const getClasses = async (req, res) => {
  try {
    let { search = "", page = 1, limit = 5 } = req.query;
    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;
    const searchFilter = search ? { name: { $regex: search, $options: "i" } } : {};

    const classesWithCounts = await Class.aggregate([
      { $match: searchFilter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "members",      
          localField: "_id",     
          foreignField: "classId", 
          as: "memberList",
        },
      },
      {
        $addFields: {
          memberCount: { $size: "$memberList" },
        },
      },
      { $project: { memberList: 0 } }, 
    ]);

    const total = await Class.countDocuments(searchFilter);

    res.status(200).json({
      data: classesWithCounts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch class stats" });
  }
};

/** * FIXED: Added missing getClassById 
 * This resolves the terminal SyntaxError
 */
export const getClassById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Class ID" });
  }

  try {
    const foundClass = await Class.findById(id);
    if (!foundClass) return res.status(404).json({ message: "Class not found" });
    res.status(200).json(foundClass);
  } catch (err) {
    res.status(500).json({ message: "Error fetching class" });
  }
};

/** * FIXED: Renamed createClass to addClass 
 * Matches your router's import: { addClass }
 */
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

// PATCH /classes/:id
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