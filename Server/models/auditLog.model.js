// models/auditLog.model.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",  // Reference the User collection
    required: true 
  },
  action: { type: String, required: true },  // e.g., "ADD_MEMBER"
  target: { type: String },                   // e.g., member id or CSV file name
  timestamp: { type: Date, default: Date.now },
});

// Optional: create indexes for faster queries
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
