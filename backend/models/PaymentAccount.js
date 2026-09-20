const mongoose = require('mongoose');

const paymentAccountSchema = new mongoose.Schema({
  // Restaurant ownership — exactly one restaurant per payment account
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true
  },

  // Provider identity
  provider: {
    type: String,
    enum: ['CASHFREE'],
    default: 'CASHFREE',
    required: true
  },
  provider_vendor_id: {
    type: String,
    required: true,
    trim: true
  },
  provider_account_reference: {
    type: String,
    default: ''
  },

  // Connection lifecycle
  connection_status: {
    type: String,
    enum: [
      'NOT_CONNECTED',
      'ONBOARDING',
      'PENDING_VERIFICATION',
      'CONNECTED',
      'DISCONNECTING',
      'DISCONNECTED',
      'SUSPENDED',
      'REQUIRES_REVIEW'
    ],
    default: 'NOT_CONNECTED',
    required: true
  },

  // Vendor verification lifecycle
  verification_status: {
    type: String,
    enum: [
      'NOT_STARTED',
      'PENDING',
      'VERIFIED',
      'FAILED',
      'SUSPENDED',
      'REQUIRES_REVIEW'
    ],
    default: 'NOT_STARTED',
    required: true
  },

  // Settlement readiness
  settlement_status: {
    type: String,
    enum: ['INACTIVE', 'ACTIVE'],
    default: 'INACTIVE'
  },

  // Master toggle — server-enforced, never set by client
  online_payment_enabled: {
    type: Boolean,
    default: false
  },

  // Environment isolation
  environment: {
    type: String,
    enum: ['TEST', 'PROD'],
    default: 'TEST',
    required: true
  },

  // Masked bank info — NEVER store full account numbers
  masked_account_last4: { type: String, default: '' },
  masked_account_holder_name: { type: String, default: '' },
  masked_ifsc: { type: String, default: '' },

  // Lifecycle timestamps
  connected_at: { type: Date, default: null },
  disconnected_at: { type: Date, default: null },
  suspension_reason: { type: String, default: '' }
}, {
  timestamps: true // createdAt, updatedAt
});

// A provider vendor ID must be globally unique within provider + environment
paymentAccountSchema.index(
  { provider: 1, provider_vendor_id: 1, environment: 1 },
  { unique: true }
);

// Never return sensitive internal fields in JSON
paymentAccountSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('PaymentAccount', paymentAccountSchema);
