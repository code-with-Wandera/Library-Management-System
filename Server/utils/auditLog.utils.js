// utils/logAudit.js
import AuditLog from "../models/auditLog.model.js";

/**
 * Log an audit action
 * @param {Object} options
 * @param {Object} options.user - Mongoose User document
 * @param {string} options.action - Action performed, e.g., "ADD_MEMBER"
 * @param {string} [options.target] - Optional target
 */
export const logAudit = async ({ user, action, target }) => {
  try {
    if (!user || !user._id) {
      console.warn("Audit log skipped: user not provided");
      return;
    }

    await AuditLog.create({
      user: user._id,   // ✅ store ObjectId, NOT string
      action,
      target,
    });

    console.log("🟢 Audit log saved");
  } catch (err) {
    console.error("Failed to log audit:", err);
  }
};
