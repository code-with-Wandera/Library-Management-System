import Member from "../models/members.model.js";
import fs from "fs/promises"; // Use promises for non-blocking I/O
import mongoose from "mongoose";
import Papa from "papaparse";

/** ADD / CREATE MEMBER */
export const addMember = async (req, res) => {
  try {
    const { firstName, lastName, email, classId } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "First name and last name are required." });
    }

    const newMember = new Member({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim().toLowerCase() || undefined,
      classId: classId || null
    });

    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists." });
    }
    console.error("Member Creation Error:", err);
    res.status(500).json({ error: "Failed to create member." });
  }
};

/** GET all members with pagination, search, and sort */
export const getMembers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", unassigned = "false" } = req.query;
    
    // Ensure numeric values for pagination
    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};

    // 1. Handle search with basic regex escaping to prevent injection
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { firstName: { $regex: safeSearch, $options: "i" } },
        { lastName: { $regex: safeSearch, $options: "i" } }
      ];
    }

    // 2. Handle Unassigned filter
    if (unassigned === "true") {
      query.classId = null;
    }

    const [members, count] = await Promise.all([
      Member.find(query)
        .populate("classId")
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 }) // Newest first
        .lean(), // Better performance for read-only
      Member.countDocuments(query)
    ]);

    res.json({
      members,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalMembers: count
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

/** UPDATE Member */
export const updateMember = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid Member ID format" });
  }

  try {
    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("classId");

    if (!updatedMember) return res.status(404).json({ error: "Member not found" });

    res.json(updatedMember);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Email already in use" });
    res.status(500).json({ error: "Failed to update member" });
  }
};

/** GET Member by ID */
export const getMemberById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid Member ID format" });
  }

  try {
    const member = await Member.findById(id).populate('classId');
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/** DELETE Member */
export const deleteMember = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const member = await Member.findByIdAndDelete(id);
    if (!member) return res.status(404).json({ error: "Member not found." });
    res.json({ message: "Member deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete member." });
  }
};

/** CSV Import */
export const importMembers = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "CSV file is required." });

  try {
    const csvBuffer = await fs.readFile(req.file.path, "utf8");

    Papa.parse(csvBuffer, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const errors = [];
        const validRows = [];

        results.data.forEach((row, i) => {
          const firstName = row.firstName?.trim();
          const lastName = row.lastName?.trim();
          const email = row.email?.trim()?.toLowerCase();

          if (!firstName || !lastName) {
            errors.push(`Row ${i + 1}: Missing required names`);
          } else {
            validRows.push({ firstName, lastName, email });
          }
        });

        let insertedCount = 0;
        if (validRows.length > 0) {
          try {
            const result = await Member.insertMany(validRows, { ordered: false });
            insertedCount = result.length;
          } catch (err) {
            insertedCount = err.result?.nInserted || 0;
            if (err.writeErrors) {
              err.writeErrors.forEach(e => {
                const email = e.err?.keyValue?.email || "unknown";
                errors.push(`Duplicate email skipped: ${email}`);
              });
            }
          }
        }

        await fs.unlink(req.file.path); // Non-blocking cleanup
        res.json({ message: `Import complete. ${insertedCount} members added.`, errors });
      },
    });
  } catch (err) {
    if (req.file) await fs.unlink(req.file.path);
    res.status(500).json({ error: "Failed to process CSV file" });
  }
};

/** CSV Export */
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find({}).sort({ lastName: 1 }).lean();

    const csvData = members.map(m => ({
      FirstName: m.firstName,
      LastName: m.lastName,
      Email: m.email || "N/A",
      Status: m.status || "active"
    }));

    const csv = Papa.unparse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment("library_members_export.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate export" });
  }
};

/** Growth Analytics */
export const getMemberGrowth = async (req, res) => {
  try {
    const growthData = await Member.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);
    res.json(growthData);
  } catch (err) {
    res.status(500).json({ error: "Analytics unavailable" });
  }
};