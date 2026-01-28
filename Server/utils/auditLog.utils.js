// utils/logAudit.js
import AuditLog from "../models/auditLog.model.js";

/**
 * Log an audit action
 * @param {Object} options
 * @param {Object} options.user - Mongoose User document
 * @param {string} options.action - Action performed, e.g., "ADD_MEMBER"
 * @param {string} [options.target] - Optional target, e.g., member id or file name
 */
export const logAudit = async ({ user, action, target }) => {
  try {
    if (!user || !user._id) {
      console.warn("Audit log skipped: user not provided");
      return;
    }

    const audit = new AuditLog({
      user: user._id.toString(), // store user id as string
      action,
      target,
    });

    await audit.save();
  } catch (err) {
    console.error("Failed to log audit:", err.message);
  }
};
