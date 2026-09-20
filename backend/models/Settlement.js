const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
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
  provider_settlement_id: {
    type: String,
    default: ''
  },

  // Amount in minor units (paise)
  amount_minor: {
    type: Number,
    required: true,
    min: 0,
    validate: { validator: Number.isInteger, message: 'Must be integer (paise)' }
  },

  status: {
    type: String,
    enum: ['PENDING', 'INITIATED', 'SETTLED', 'FAILED'],
    default: 'PENDING'
  },

  settled_at: { type: Date, default: null },
  failure_reason: { type: String, default: '' }
}, {
  timestamps: true
});

settlementSchema.index({ restaurant_id: 1, createdAt: -1 });
settlementSchema.index({ provider_settlement_id: 1 }, { sparse: true });

module.exports = mongoose.model('Settlement', settlementSchema);
