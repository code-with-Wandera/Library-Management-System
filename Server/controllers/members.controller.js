// controllers/members.controller.js
import Member from "../models/members.model.js";
import fs from "fs";
import Papa from "papaparse";

// ADD / CREATE MEMBER
export const addMember = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;

    // Ensure required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First name and last name are required." });
    }

    const newMember = new Member({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ...(email?.trim() && { email: email.trim() }) // optional email
    });

    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (err) {
    console.error("Error creating member:", err);
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Failed to create member." });
  }
};

// GET all members with pagination, search, and sort
export const getMembers = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = "", unassigned = "false" } = req.query;
    
    // Build the query object
    let query = {};

    // 1. Handle search
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
    }

    // 2. Handle Unassigned filter
    if (unassigned === "true") {
      query.classId = { $exists: false }; // or query.classId = null
    }

    const members = await Member.find(query)
      .populate("classId") // So we see the class name
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Member.countDocuments(query);

    res.json({
      members,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalMembers: count
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Updated getMemberById to show class details
export const getMemberById = async (req, res) => {
  try {
    // .populate('classId') joins the Class data automatically
    const member = await Member.findById(req.params.id).populate('classId');
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch member." });
  }
};

// New function to assign the class
export const assignClass = async (req, res) => {
  try {
    const { memberId, classId } = req.body;
    const member = await Member.findByIdAndUpdate(
      memberId,
      { classId: classId || null }, // Allow unassigning by passing null
      { new: true }
    ).populate('classId');
    
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Assignment failed" });
  }
};

// DELETE member
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found." });
    res.json({ message: "Member deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete member." });
  }
};

// CSV import members (robust)
export const importMembers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "CSV file is required." });

    const csvData = fs.readFileSync(req.file.path, "utf8");

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const errors = [];
        const validRows = [];

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];
          const firstName = row.firstName?.trim();
          const lastName = row.lastName?.trim();
          const email = row.email?.trim() || undefined;

          // Skip rows missing required fields
          if (!firstName || !lastName) {
            errors.push(`Row ${i + 1}: Missing firstName or lastName`);
            continue;
          }

          validRows.push({ firstName, lastName, email });
        }

        let insertedCount = 0;

        if (validRows.length > 0) {
          try {
            // Use ordered: false to continue on duplicates
            const result = await Member.insertMany(validRows, { ordered: false });
            insertedCount = result.length;
          } catch (err) {
            // If duplicates exist, still insert the rest
            if (err.name === "BulkWriteError") {
              insertedCount = err.result?.nInserted || 0;

              // Collect duplicate email errors
              err.writeErrors.forEach(e => {
                if (e.code === 11000) {
                  const email = e.err?.keyValue?.email || "unknown";
                  errors.push(`Duplicate email skipped: ${email}`);
                }
              });
            } else {
              throw err; // other errors
            }
          }
        }

        fs.unlinkSync(req.file.path); // remove temp file
        res.json({ message: `CSV imported successfully. ${insertedCount} rows added.`, errors });
      },
    });
  } catch (err) {
    console.error("CSV import error:", err);
    res.status(500).json({ error: "Failed to import CSV." });
  }
};

// CSV export members (robust)
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find({}).sort({ createdAt: 1 }); // optional: sort by creation date

    // Map members to CSV-friendly format
    const csvData = members.map(m => ({
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email || "", // blank if email is missing
    }));

    // Convert to CSV
    const csv = Papa.unparse(csvData);

    // Send CSV as file download
    res.header("Content-Type", "text/csv");
    res.attachment("members.csv");
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ error: "Failed to export CSV." });
  }
};


// Member growth analytics (members added per month)
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
      { 
        $sort: { 
          "_id.year": 1, 
          "_id.month": 1, 
          "_id.day": 1 
        } 
      },
    ]);

    res.json(growthData);
  } catch (err) {
    console.error("Growth Analytics Error:", err);
    res.status(500).json({ error: "Failed to fetch growth data" });
  }
};