const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema({
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  tableNumber: { type: Number, required: true },
  sessionCode: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'billing', 'settled', 'closed'],
    default: 'active'
  },
  customerName: { type: String, default: 'Guest', trim: true },
  guestName: { type: String, default: '', trim: true },
  customerPhone: { type: String, default: '' },
  guestPhone: { type: String, default: '' },
  pax: { type: Number, default: 1, min: 1 },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TableOrder' }],
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: { type: String, default: '' },
  paidAt: { type: Date, default: null },
  settledAt: { type: Date, default: null },
  autoFreeAt: { type: Date, default: null },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date, default: null },
  notes: { type: String, default: '' }
});

tableSessionSchema.index({ cafe: 1, status: 1 });
tableSessionSchema.index({ cafe: 1, tableNumber: 1, status: 1 });
tableSessionSchema.index({ sessionCode: 1 }, { unique: true });

module.exports = mongoose.model('TableSession', tableSessionSchema);
