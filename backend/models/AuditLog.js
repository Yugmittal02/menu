const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor_type: {
    type: String,
    enum: ['SYSTEM', 'USER', 'CAFE_OWNER', 'STAFF', 'SUPER_ADMIN', 'WEBHOOK'],
    required: true,
    index: true
  },
  actor_id: {
    type: String,
    default: 'SYSTEM',
    index: true
  },
  actor_email: {
    type: String,
    default: ''
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    default: null,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entity_type: {
    type: String,
    enum: ['PaymentAccount', 'Payment', 'PaymentSplit', 'Settlement', 'WebhookEvent', 'Cafe', 'PaymentOnboarding'],
    required: true,
    index: true
  },
  entity_id: {
    type: String,
    required: true,
    index: true
  },
  old_state: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  new_state: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ip_address: {
    type: String,
    default: ''
  },
  user_agent: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

auditLogSchema.index({ restaurant_id: 1, createdAt: -1 });
auditLogSchema.index({ entity_type: 1, entity_id: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
