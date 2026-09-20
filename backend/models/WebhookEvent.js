const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['CASHFREE'],
    default: 'CASHFREE',
    required: true
  },
  event_type: {
    type: String,
    required: true,
    index: true
  },
  event_id: {
    type: String,
    default: '',
    index: true
  },
  payload_sha256: {
    type: String,
    required: true,
    index: true
  },
  signature_valid: {
    type: Boolean,
    required: true
  },
  processing_status: {
    type: String,
    enum: ['RECEIVED', 'VERIFIED', 'PROCESSED', 'DUPLICATE', 'REJECTED', 'QUARANTINED'],
    default: 'RECEIVED',
    required: true,
    index: true
  },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    default: null,
    index: true
  },
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    default: null,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error_message: {
    type: String,
    default: ''
  },
  processed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

webhookEventSchema.index({ payload_sha256: 1, signature_valid: 1 });
webhookEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
