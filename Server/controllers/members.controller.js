// controllers/members.controller.js
import Member from "../models/members.model.js";
import fs from "fs";
import csvParser from "csv-parser";
import { Parser as Json2CsvParser } from "json2csv";
import { logAudit } from "../utils/auditLog.utils.js";

/* 
   GET MEMBERS (paginated, searchable, sortable)
 */
export const getMembers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = req.query.search?.trim();
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "asc" ? 1 : -1;

    const filter = search
      ? {
          $or: [
            { firstName: new RegExp(search, "i") },
            { lastName: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
          ],
        }
      : {};

    const total = await Member.countDocuments(filter);
    const members = await Member.find(filter)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    await logAudit({ user: req.user, action: "VIEW_MEMBERS", target: `page=${page}`, req });

    res.json({
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("getMembers:", err);
    await logAudit({ user: req.user, action: "VIEW_MEMBERS_FAILED", target: err.message, req });
    res.status(500).json({ message: "Failed to fetch members" });
  }
};

/* GET SINGLE MEMBER */
export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    await logAudit({ user: req.user, action: "VIEW_MEMBER", target: member._id.toString(), req });

    res.json(member);
  } catch (err) {
    console.error("getMemberById:", err);
    await logAudit({ user: req.user, action: "VIEW_MEMBER_FAILED", target: err.message, req });
    res.status(500).json({ message: "Failed to fetch member" });
  }
};

/* ADD MEMBER */
export const addMember = async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    if (!firstName || !lastName || !email) return res.status(400).json({ message: "Missing required fields" });

    const exists = await Member.findOne({ email });
    if (exists) return res.status(400).json({ message: "Member already exists" });

    const member = await Member.create({ firstName, lastName, email, role: role || "user" });

    await logAudit({ user: req.user, action: "ADD_MEMBER", target: member._id.toString(), req });

    res.status(201).json({ message: "Member added", member });
  } catch (err) {
    console.error("addMember:", err);
    await logAudit({ user: req.user, action: "ADD_MEMBER_FAILED", target: err.message, req });
    res.status(500).json({ message: "Failed to add member" });
  }
};

/* DELETE MEMBER (ADMIN) */
export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    await logAudit({ user: req.user, action: "DELETE_MEMBER", target: member._id.toString(), req });

    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error("deleteMember:", err);
    await logAudit({ user: req.user, action: "DELETE_MEMBER_FAILED", target: err.message, req });
    res.status(500).json({ message: "Failed to delete member" });
  }
};

/* IMPORT MEMBERS (CSV) */
export const importMembers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "CSV file required" });

  const members = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", row => {
      if (row.firstName && row.lastName && row.email) members.push(row);
    })
    .on("end", async () => {
      try {
        for (const m of members) {
          const exists = await Member.findOne({ email: m.email });
          if (!exists) await Member.create(m);
        }
        fs.unlinkSync(req.file.path);

        await logAudit({ user: req.user, action: "IMPORT_MEMBERS", target: `${members.length} records`, req });

        res.json({ message: "Members imported successfully" });
      } catch (err) {
        console.error("importMembers:", err);
        await logAudit({ user: req.user, action: "IMPORT_MEMBERS_FAILED", target: err.message, req });
        res.status(500).json({ message: "Failed to import members" });
      }
    });
};

/* EXPORT MEMBERS (CSV) */
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find();
    const fields = ["firstName", "lastName", "email", "createdAt"];
    const parser = new Json2CsvParser({ fields });
    const csv = parser.parse(members);

    await logAudit({ user: req.user, action: "EXPORT_MEMBERS", target: `${members.length} records`, req });

    res.header("Content-Type", "text/csv");
    res.attachment("members.csv");
    res.send(csv);
  } catch (err) {
    console.error("exportMembers:", err);
    await logAudit({ user: req.user, action: "EXPORT_MEMBERS_FAILED", target: err.message, req });
    res.status(500).json({ message: "Failed to export members" });
  }
};

/* MEMBER GROWTH ANALYTICS */
export const getMemberGrowth = async (req, res) => {
  try {
    const growth = await Member.aggregate([
      { $match: { createdAt: { $exists: true } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    await logAudit({ user: req.user, action: "VIEW_MEMBER_GROWTH", req });

    res.json(growth);
  } catch (err) {
    console.error("getMemberGrowth:", err);
    await logAudit({ user: req.user, action: "VIEW_MEMBER_GROWTH_FAILED", target: err.message, req });
    res.status(500).json({ message: "Failed to fetch member growth" });
  }
};
