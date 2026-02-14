import AuditLog from "../models/auditLog.model.js";

export const logAudit = async (req, { action, resource, targetId, details }) => {
  try {
    // Automatically extract context from the request object
    await AuditLog.create({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      action,
      resource,
      targetId,
      details,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (err) {
    // In production, we log the failure but don't crash the main process
    console.error("CRITICAL: Audit log failed to save:", err);
  }
};