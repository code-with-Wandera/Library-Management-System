import Member from "../models/members.model.js";
import AuditLog from "../models/auditLog.model.js";
import csvParser from "csv-parser";
import fs from "fs";

/* HELPERS*/
async function logAction({ action, entity, entityId, userId, meta }) {
  await AuditLog.create({ action, entity, entityId, performedBy: userId, meta });
}

/* GET MEMBERS  */
export async function getMembers(req, res) {
  try {
    const { page = 1, limit = 5, search = "", sortBy = "createdAt", order = "desc" } = req.query;

    const query = search
      ? {
          $or: [
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const members = await Member.find(query)
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const total = await Member.countDocuments(query);

    res.json({
      members,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
}

/* CREATE MEMBER */
export async function createMember(req, res) {
  try {
    const { firstName, lastName } = req.body;

    // Prevent duplicates
    const exists = await Member.findOne({
      firstName: { $regex: `^${firstName}$`, $options: "i" },
      lastName: { $regex: `^${lastName}$`, $options: "i" },
    });

    if (exists) return res.status(409).json({ message: "Member already exists" });

    const member = await Member.create({ firstName: firstName.trim(), lastName: lastName.trim() });

    await logAction({
      action: "CREATE",
      entity: "Member",
      entityId: member._id,
      userId: req.user.id,
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create member" });
  }
}

/* DELETE MEMBER */
export async function deleteMember(req, res) {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ message: "Member not found" });

    await logAction({
      action: "DELETE",
      entity: "Member",
      entityId: member._id,
      userId: req.user.id,
    });

    res.json({ message: "Member deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete member" });
  }
}

/* CSV IMPORT */
export async function importMembers(req, res) {
  if (!req.file) return res.status(400).json({ message: "CSV file required" });

  const members = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row) => {
      if (row.firstName && row.lastName) {
        members.push({ firstName: row.firstName.trim(), lastName: row.lastName.trim() });
      }
    })
    .on("end", async () => {
      fs.unlinkSync(req.file.path);

      const inserted = await Member.insertMany(members, { ordered: false }).catch(() => []);

      await logAction({
        action: "IMPORT",
        entity: "Member",
        userId: req.user.id,
        meta: { count: inserted.length },
      });

      res.json({ message: `${inserted.length} members imported` });
    });
}

/* CSV EXPORT */
export async function exportMembers(req, res) {
  try {
    const members = await Member.find().lean();
    const csv = "firstName,lastName\n" + members.map((m) => `${m.firstName},${m.lastName}`).join("\n");

    await logAction({
      action: "EXPORT",
      entity: "Member",
      userId: req.user.id,
      meta: { count: members.length },
    });

    res.header("Content-Type", "text/csv");
    res.attachment("members.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to export members" });
  }
}

/* ANALYTICS */
export async function memberAnalytics(req, res) {
  try {
    const total = await Member.countDocuments();
    const byLetter = await Member.aggregate([
      { $group: { _id: { $substrCP: ["$firstName", 0, 1] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ totalMembers: total, byFirstLetter: byLetter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
}

/* GROWTH OVER TIME */
export async function memberGrowth(req, res) {
  try {
    const growth = await Member.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json(growth.map((g) => ({ date: g._id, count: g.count })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch growth analytics" });
  }
}
