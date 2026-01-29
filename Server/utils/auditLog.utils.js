// utils/logAudit.utils.js
import mongoose from "mongoose";

// Audit Log Schema & Model
const auditLogSchema = new mongoose.Schema(
  {
    user: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: String,
      role: String,
    },
    action: { type: String, required: true },
    target: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

const AuditLogModel = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

// Audit Logging Function
export const logAudit = async ({ user, action, target, req }) => {
  try {
    if (!action) return;

    const logEntry = {
      action,
      target: target || "",
      user: user
        ? {
            _id: user._id,
            email: user.email,
            role: user.role,
          }
        : undefined,
    };

    // Optional: capture IP and user-agent if request object is provided
    if (req) {
      logEntry.ip = req.ip || req.headers["x-forwarded-for"] || "";
      logEntry.userAgent = req.headers["user-agent"] || "";
    }

    await AuditLogModel.create(logEntry);
  } catch (err) {
    console.error("Audit log failed:", err.message || err);
    // Do NOT throw error; logging should never crash main app
  }
};
