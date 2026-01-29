import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // optional for system actions
    },
    action: {
      type: String,
      required: true,
    },
    target: {
      type: String,
      required: false, // e.g., member ID, page info
    },
    details: {
      type: String,
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Index timestamp for faster queries
auditLogSchema.index({ timestamp: -1 });

export const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);
