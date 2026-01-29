import Member from "../models/members.model.js";
import AuditLog from "../models/auditLog.model.js";
import fs from "fs";
import csvParser from "csv-parser";
import { Parser as Json2CsvParser } from "json2csv";
import { logAudit } from "../utils/auditLog.utils.js";
/**
 * Get all members (paginated, searchable, sortable)
 */
export const getMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const order = req.query.order === "desc" ? -1 : 1;

    const query = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    await AuditLog.create({
      action: "VIEW_MEMBERS",
      performedBy: req.user?.id || "unknown",
      details: `Fetched page ${page} of members`,
      timestamp: new Date(),
    });

    res.json({
      members: members || [],
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error("Error in getMembers:", err);

    await AuditLog.create({
      action: "VIEW_MEMBERS_FAILED",
      performedBy: req.user?.id || "unknown",
      details: err.message,
      timestamp: new Date(),
    }).catch(auditErr => console.error("Failed to log audit:", auditErr));

    res.status(500).json({ message: "Failed to fetch members", error: err.message });
  }
};

/**
 * Get a single member by ID
 */
export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    await AuditLog.create({
      action: "VIEW_MEMBER",
      performedBy: req.user?.id || "unknown",
      details: `Viewed member ${member.firstName} ${member.lastName}`,
      timestamp: new Date(),
    });

    res.json(member);
  } catch (err) {
    console.error("Error in getMemberById:", err);

    await AuditLog.create({
      action: "VIEW_MEMBER_FAILED",
      performedBy: req.user?.id || "unknown",
      details: err.message,
      timestamp: new Date(),
    }).catch(auditErr => console.error("Failed to log audit:", auditErr));

    res.status(500).json({ message: "Failed to fetch member", error: err.message });
  }
};

/**
 * Add member
 */
export async function addMember(req, res) {
  try {
    const { firstName, lastName, email, role } = req.body;
    if (!firstName || !lastName || !email)
      return res.status(400).json({ message: "First name, last name and email are required" });

    const member = new Member({ firstName, lastName, email, role: role || "user" });
    await member.save();

    await AuditLog.create({
      action: "ADD_MEMBER",
      performedBy: req.user?.id || "unknown",
      details: `Added member ${firstName} ${lastName} (${email})`,
      timestamp: new Date(),
    });

    res.status(201).json({ member, message: "Member added successfully" });
  } catch (err) {
    console.error("Error in addMember:", err);

    await AuditLog.create({
      action: "ADD_MEMBER_FAILED",
      performedBy: req.user?.id || "unknown",
      details: err.message,
      timestamp: new Date(),
    }).catch(auditErr => console.error("Failed to log audit:", auditErr));

    res.status(500).json({ message: "Server error", error: err.message });
  }
}

/**
 * Delete member (admin only)
 */
export const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findByIdAndDelete(id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    await AuditLog.create({
      action: "DELETE_MEMBER",
      entity: "Member",
      entityId: member._id,
      performedBy: req.user?.username || req.user?.email || "unknown",
      timestamp: new Date(),
    });

    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error("Error in deleteMember:", err);

    await AuditLog.create({
      action: "DELETE_MEMBER_FAILED",
      entity: "Member",
      performedBy: req.user?.username || req.user?.email || "unknown",
      details: err.message,
      timestamp: new Date(),
    }).catch(auditErr => console.error("Failed to log audit:", auditErr));

    res.status(500).json({ message: "Failed to delete member", error: err.message });
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

        await AuditLog.create({
          action: "IMPORT_MEMBERS",
          performedBy: req.user?.id || "unknown",
          details: `Imported ${members.length} members from CSV`,
          timestamp: new Date(),
        });

        res.json({ message: "CSV imported successfully" });
      } catch (err) {
        console.error("Error in importMembers:", err);
        res.status(500).json({ message: "Failed to import CSV", error: err.message });
      }
    });
};

/**
 * Export members to CSV (admin only)
 */
export const exportMembers = async (req, res) => {
  try {
    const members = await Member.find();
    const fields = ["firstName", "lastName", "email", "createdAt"];
    const json2csvParser = new Json2CsvParser({ fields });
    const csv = json2csvParser.parse(members);

    await AuditLog.create({
      action: "EXPORT_MEMBERS",
      performedBy: req.user?.id || "unknown",
      details: `Exported ${members.length} members to CSV`,
      timestamp: new Date(),
    });

    res.header("Content-Type", "text/csv");
    res.attachment("members.csv");
    res.send(csv);
  } catch (err) {
    console.error("Error in exportMembers:", err);
    res.status(500).json({ message: "Failed to export CSV", error: err.message });
  }
};

/**
 * Member analytics
 */
export const getMemberAnalytics = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: 1 });
    let total = 0;
    const growth = members.map(m => {
      total += 1;
      return { date: m.createdAt.toISOString().split("T")[0], total };
    });

    await AuditLog.create({
      action: "VIEW_MEMBER_ANALYTICS",
      performedBy: req.user?.id || "unknown",
      details: `Viewed member analytics`,
      timestamp: new Date(),
    });

    res.json(growth);
  } catch (err) {
    console.error("Error in getMemberAnalytics:", err);
    res.status(500).json({ message: "Failed to fetch analytics", error: err.message });
  }
};

/**
 * Member growth over time (line chart)
 */
export const getMemberGrowth = async (req, res) => {
  try {
    const growth = await Member.aggregate([
      { $match: { createdAt: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    await AuditLog.create({
      action: "VIEW_MEMBER_GROWTH",
      performedBy: req.user?.id || "unknown",
      details: `Viewed member growth over time`,
      timestamp: new Date(),
    });

    res.json(growth);
  } catch (err) {
    console.error("Error in getMemberGrowth:", err);

    await AuditLog.create({
      action: "VIEW_MEMBER_GROWTH_FAILED",
      performedBy: req.user?.id || "unknown",
      details: err.message,
      timestamp: new Date(),
    }).catch(auditErr => console.error("Failed to log audit:", auditErr));

    res.status(500).json({ message: "Failed to get member growth", error: err.message });
  }
};
