const mongoose = require('mongoose');

const paymentSplitSchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true
  },
  payment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  payment_account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentAccount',
    required: true
  },
  provider_vendor_id: {
    type: String,
    required: true
  },

  // All amounts in minor units (paise) — integer only
  gross_amount_minor: {
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Must be integer (paise)' }
  },
  vendor_amount_minor: {
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Must be integer (paise)' }
  },
  krixov_amount_minor: {
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Must be integer (paise)' }
  },

  provider_split_reference: { type: String, default: '' },

  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SETTLED', 'FAILED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

paymentSplitSchema.index({ restaurant_id: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentSplit', paymentSplitSchema);
