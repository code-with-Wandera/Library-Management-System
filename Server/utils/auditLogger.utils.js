import AuditLog from "../models/auditLog.model.js";

export const createAuditLog = async (req, { action, resource, details, payload = {} }) => {
  try {
    await AuditLog.create({
      tenantId: req.user.tenantId, // From your Auth middleware
      userId: req.user._id,
      action,
      resource,
      details,
      payload,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });
  } catch (err) {
    console.error("Audit Logging Failed:", err);
    // We don't throw the error because we don't want to crash the main request 
    // just because a log failed.
  }
};