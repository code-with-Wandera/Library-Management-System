
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    meta: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
