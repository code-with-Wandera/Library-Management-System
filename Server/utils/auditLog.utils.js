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
    if (!user?._id) return;

    await AuditLogModel.create({
      user: user._id,
      action,
      target,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};