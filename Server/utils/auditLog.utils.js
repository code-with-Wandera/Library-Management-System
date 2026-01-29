import AuditLogModel from "../models/auditLog.model.js";

/**
 * Logs audit actions safely
 * @param {Object} param0
 * @param {Object} param0.user - Mongoose User document (optional)
 * @param {string} param0.action - action name
 * @param {string} [param0.target] - target entity / info
 * @param {string} [param0.details] - optional details
 * @param {string} [param0.ip] - optional client IP
 */
export const logAudit = async ({ user, action, target, details, ip }) => {
  try {
    await AuditLogModel.create({
      user: user?._id || null,
      action,
      target,
      details,
      ip,
      timestamp: new Date(),
    });
  } catch (err) {
    // Never crash the app if logging fails
    console.error("Audit log failed:", err.message);
  }
};
