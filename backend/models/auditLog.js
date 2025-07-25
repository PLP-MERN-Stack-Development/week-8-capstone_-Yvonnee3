const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'request_submit', 'approve', 'reject', 'override']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  },
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Index for compliance reporting
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('auditLog', auditLogSchema);

module.exports = AuditLog;