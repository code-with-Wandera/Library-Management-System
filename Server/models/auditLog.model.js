import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    action: { type: String, required: true },
    target: { type: String }, // e.g., "member_id", "page=2"
    details: { type: String },
    ip: { type: String }, // optional, useful for production logs
  },
  { timestamps: true }
);

// Indexes for faster searches
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
