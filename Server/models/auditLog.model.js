import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true, 
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Member', // The staff/admin performing the action
    required: true 
  },
  action: { 
    type: String, 
    required: true // e.g., "ISSUE_BOOK", "DELETE_MEMBER", "PAY_FINE"
  },
  resource: { 
    type: String, 
    required: true // e.g., "Members", "Books", "Transactions"
  },
  details: { type: String }, // Human-readable summary
  payload: { type: Object }, // Raw data for deep inspection if needed
  ipAddress: String,
}, { timestamps: true });

// Auto-delete logs after 90 days for tenants to keep DB lean
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model("AuditLog", auditLogSchema);