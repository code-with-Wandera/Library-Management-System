import Member from "../models/members.model.js";
import AuditLog from "../models/auditLog.model.js";
import fs from "fs";
import csvParser from "csv-parser";
import { Parser as Json2CsvParser } from "json2csv";

/**
 * Get all members (paginated)
 */
export const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Member.countDocuments();
    const members = await Member.find().skip(skip).limit(limit);

    res.json({
      members,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};

/**
 * Create a new member (admin only)
 * Prevent duplicate members
 */
export const createMember = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    const existing = await Member.findOne({ firstName, lastName });
    if (existing) return res.status(400).json({ message: "Member already exists" });

    const member = await Member.create({ firstName, lastName });

    // Audit log
    await AuditLog.create({
      action: "CREATE",
      entity: "Member",
      entityId: member._id,
      performedBy: req.user.username || req.user.email,
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create member" });
  }
};

/**
 * Delete member (admin only)
 */
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findByIdAndDelete(id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    // Audit log
    await AuditLog.create({
      action: "DELETE",
      entity: "Member",
      entityId: member._id,
      performedBy: req.user.username || req.user.email,
    });

    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete member" });
  }
};

/**
 * Import members from CSV (admin only)
 */
export const importMembers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No CSV file uploaded" });

  const members = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row) => {
      if (row.firstName && row.lastName) members.push(row);
    })
    .on("end", async () => {
      try {
        for (const m of members) {
          const exists = await Member.findOne({ firstName: m.firstName, lastName: m.lastName });
          if (!exists) await Member.create(m);
        }
        fs.unlinkSync(req.file.path); // delete temp file
        res.json({ message: "CSV imported successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to import CSV" });
      }
    });
};

/**
 * Export members to CSV (admin only)
 */
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find();
    const fields = ["firstName", "lastName", "createdAt"];
    const json2csvParser = new Json2CsvParser({ fields });
    const csv = json2csvParser.parse(members);

    res.header("Content-Type", "text/csv");
    res.attachment("members.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export CSV" });
  }
};

/**
 * Analytics - basic example
 */
export const getMemberAnalytics = async (req, res) => {
  try {
    const total = await Member.countDocuments();
    res.json({ totalMembers: total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get analytics" });
  }
};

/**
 * Growth over time (line chart)
 * Returns count per month
 */
export const getMemberGrowth = async (req, res) => {
  try {
    const growth = await Member.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(growth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get member growth" });
  }
};
