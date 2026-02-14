import Member from "../models/members.model.js";
import fs from "fs/promises"; 
import mongoose from "mongoose";
import Papa from "papaparse";
import Transaction from "../models/transactions.model.js";

/** 1. GET ALL MEMBERS (Pagination, Search, Sort) */
export const getMembers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", unassigned = "false" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let query = {};
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { firstName: { $regex: safeSearch, $options: "i" } },
        { lastName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (unassigned === "true") {
      query.classId = null;
    }

    const [members, count] = await Promise.all([
      Member.find(query)
        .populate("classId")
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .lean(),
      Member.countDocuments(query),
    ]);

    res.json({
      members,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalMembers: count,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

/** 2. GET MEMBER BY ID */
export const getMemberById = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid Member ID format" });
  }
  try {
    const member = await Member.findById(id).populate("classId");
    if (!member) return res.status(404).json({ error: "Member not found" });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

/** 3. ADD / CREATE MEMBER */
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
      classId: classId || null,
    });
    const savedMember = await newMember.save();
    res.status(201).json(savedMember);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Email already exists." });
    res.status(500).json({ error: "Failed to create member." });
  }
};

/** 4. UPDATE MEMBER */
export const updateMember = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: "Invalid ID" });
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

/** 5. DELETE MEMBER */
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

/** 6. PAY FINE & LOG TRANSACTION */
export const payFine = async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    const member = await Member.findById(id);
    if (!member) return res.status(404).json({ message: "Member not found" });
    if (amount > member.totalFines) {
      return res.status(400).json({ message: "Payment amount exceeds total fine." });
    }
    await Transaction.create({
      memberId: id,
      type: "payment_received",
      amount: amount,
      description: `Cash payment received`,
    });
    member.totalFines -= amount;
    await member.save();
    res.status(200).json({ message: "Payment successful", remainingBalance: member.totalFines });
  } catch (err) {
    res.status(500).json({ message: "Failed to process payment" });
  }
};

/** 7. GET MEMBER TRANSACTIONS */
export const getMemberTransactions = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });
  try {
    const transactions = await Transaction.find({ memberId: id }).sort({ createdAt: -1 }).lean();
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

/** 8. GET FINE REPORT DATA */
export const getFineReportData = async (req, res) => {
  try {
    const debtors = await Member.find({ totalFines: { $gt: 0 } })
      .select("firstName lastName memberId totalFines email")
      .sort({ totalFines: -1 })
      .lean();
    const totalOutstanding = debtors.reduce((sum, m) => sum + (m.totalFines || 0), 0);
    res.status(200).json({
      generatedAt: new Date(),
      totalOutstanding,
      debtorCount: debtors.length,
      reportData: debtors
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate report data" });
  }
};

/** 9. CSV IMPORT */
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
            errors.push(`Row ${i + 1}: Missing names`);
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
              err.writeErrors.forEach((e) => errors.push(`Skipped: ${e.err?.keyValue?.email || "Duplicate"}`));
            }
          }
        }
        await fs.unlink(req.file.path);
        res.json({ message: `Import complete. ${insertedCount} added.`, errors });
      },
    });
  } catch (err) {
    if (req.file) await fs.unlink(req.file.path);
    res.status(500).json({ error: "CSV processing failed" });
  }
};

/** 10. CSV EXPORT */
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find({}).sort({ lastName: 1 }).lean();
    const csvData = members.map((m) => ({
      FirstName: m.firstName,
      LastName: m.lastName,
      Email: m.email || "N/A",
      Status: m.status || "active",
    }));
    const csv = Papa.unparse(csvData);
    res.header("Content-Type", "text/csv");
    res.attachment("library_members_export.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Export failed" });
  }
};

/** 11. GROWTH ANALYTICS */
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