import AuditLog from "../models/auditLog.model.js";
import mongoose from "mongoose";

/**
 * GET ALL AUDIT LOGS (Tenant Scoped)
 * Supports pagination and filtering by staffId or action type
 */
export const getSystemLogs = async (req, res) => {
  try {
    // 1. Extract tenantId from the auth middleware
    const { tenantId } = req.user;
    
    // 2. Extract query parameters for filtering and pagination
    let { page = 1, limit = 20, action, staffId } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // 3. Build the query object
    const query = { tenantId: new mongoose.Types.ObjectId(tenantId) };

    if (action) {
      query.action = action;
    }

    if (staffId && mongoose.Types.ObjectId.isValid(staffId)) {
      query.userId = staffId;
    }

    // 4. Execute query with population and pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("userId", "firstName lastName name email") // Populate staff details
        .sort({ createdAt: -1 }) // Newest first
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    // 5. Return paginated response
    res.status(200).json({
      logs,
      pagination: {
        totalLogs: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (err) {
    console.error("Audit Log Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch system logs" });
  }
};

/**
 * DELETE OLD LOGS (Optional Maintenance)
 * Tenants usually keep logs for 90 days.
 */
export const clearOldLogs = async (req, res) => {
  const { tenantId } = req.user;
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await AuditLog.deleteMany({
      tenantId,
      createdAt: { $lt: ninetyDaysAgo }
    });

    res.json({ message: `Cleared ${result.deletedCount} old logs.` });
  } catch (err) {
    res.status(500).json({ error: "Cleanup failed" });
  }
};