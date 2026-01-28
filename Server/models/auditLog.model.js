// models/auditLog.model.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true }, // user id or email
  action: { type: String, required: true }, // e.g., "ADD_MEMBER"
  target: { type: String }, // e.g., member id or CSV file name
  timestamp: { type: Date, default: Date.now },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
