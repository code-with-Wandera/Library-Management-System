// utils/logAudit.js
import AuditLog from "../models/auditLog.model.js";

/**
 * Logs an action to the AuditLog collection.
 * @param {Object} user - user object (req.user)
 * @param {String} action - action performed (e.g., "ADD_MEMBER")
 * @param {String} [target=""] - target of the action (e.g., memberId, CSV filename)
 */
export async function logAudit(user, action, target = "") {
  try {
    if (!user) {
      console.warn("AuditLog skipped: no user provided");
      return;
    }

    const log = new AuditLog({
      user: user._id || user.email || String(user), // adapt based on what you store
      action,
      target,
    });

    await log.save();
  } catch (err) {
    console.error("Failed to log audit:", err.message);
  }
}
