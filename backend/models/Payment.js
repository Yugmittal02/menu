const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // Ownership chain — every field MUST resolve to the same restaurant
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TableOrder',
    default: null
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TableSession',
    default: null
  },
  bill_id: {
    type: String,
    default: ''
  },
  payment_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentAccount',
    required: true
  },

  // Provider identity
  provider: {
    type: String,
    enum: ['CASHFREE'],
    default: 'CASHFREE',
    required: true
  },
  provider_order_id: {
    type: String,
    required: true
  },
  provider_payment_id: {
    type: String
  },
  // Immutable once payment succeeds — NEVER reassign
  provider_vendor_id: {
    type: String,
    required: true
  },

  // Financial amounts — integer minor units (paise) to avoid floating-point errors
  amount_minor: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'amount_minor must be an integer (paise)'
    }
  },
  refunded_amount_minor: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: 'refunded_amount_minor must be an integer (paise)'
    }
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },

  // Payment method (populated after provider confirmation)
  payment_method: {
    type: String,
    default: ''
  },

  // Payment state machine
  status: {
    type: String,
    enum: [
      'CREATED',
      'PENDING',
      'SUCCESS',
      'FAILED',
      'CANCELLED',
      'REFUND_PENDING',
      'PARTIALLY_REFUNDED',
      'REFUNDED',
      'DISPUTED',
      'UNKNOWN'
    ],
    default: 'CREATED',
    required: true
  },

  verification_status: {
    type: String,
    enum: ['UNVERIFIED', 'PROVIDER_CONFIRMED', 'WEBHOOK_VERIFIED', 'MANUALLY_VERIFIED'],
    default: 'UNVERIFIED'
  },

  failure_reason: { type: String, default: '' },

  // Idempotency
  idempotency_key: {
    type: String,
    required: true
  },

  // Cashfree checkout session
  cf_payment_session_id: {
    type: String,
    default: ''
  },

  paid_at: { type: Date, default: null }
}, {
  timestamps: true
});

// Unique constraints
paymentSchema.index({ provider_order_id: 1 }, { unique: true });
paymentSchema.index(
  { provider_payment_id: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      provider_payment_id: { $type: 'string', $gt: '' }
    }
  }
);
paymentSchema.index({ idempotency_key: 1 }, { unique: true });

// Query optimization
paymentSchema.index({ restaurant_id: 1, status: 1 });
paymentSchema.index({ restaurant_id: 1, createdAt: -1 });
paymentSchema.index({ order_id: 1 });
paymentSchema.index({ session_id: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
