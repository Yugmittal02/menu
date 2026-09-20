const mongoose = require('mongoose');

const paymentOnboardingSchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true
  },
  payment_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentAccount',
    default: null
  },

  provider: {
    type: String,
    enum: ['CASHFREE'],
    default: 'CASHFREE',
    required: true
  },
  provider_reference: {
    type: String,
    default: ''
  },

  // Onboarding lifecycle
  requested_at: { type: Date, default: Date.now },
  submitted_at: { type: Date, default: null },
  verified_at: { type: Date, default: null },

  status: {
    type: String,
    enum: [
      'REQUESTED',
      'SUBMITTED',
      'PENDING_VERIFICATION',
      'VERIFIED',
      'FAILED',
      'CANCELLED'
    ],
    default: 'REQUESTED',
    required: true
  },

  failure_reason: { type: String, default: '' },

  // Submitted onboarding data (sensitive fields are NOT stored here — only metadata)
  submitted_business_name: { type: String, default: '' },
  submitted_account_type: { type: String, default: '' }
}, {
  timestamps: true
});

paymentOnboardingSchema.index({ restaurant_id: 1, status: 1 });

module.exports = mongoose.model('PaymentOnboarding', paymentOnboardingSchema);
