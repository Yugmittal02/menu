const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { _id: false });

const tableOrderSchema = new mongoose.Schema({
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  tableNumber: { type: Number, default: 0 },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, default: '' },
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending'
  },
  // PAYMENT TRACKING — revenue only counted when payment is received
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'online', 'other', ''],
    default: ''
  },
  paidAt: { type: Date, default: null },
  specialInstructions: { type: String, default: '' },
  orderNumber: { type: String, required: true },
  
  // POS & Multi-source ordering fields
  orderSource: {
    type: String,
    enum: ['qr', 'counter', 'waiter', 'takeaway', 'phone'],
    default: 'qr'
  },
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway', 'delivery'],
    default: 'dine-in'
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TableSession',
    default: null
  },
  kotNumber: { type: String, default: '' },
  kotPrintedAt: { type: Date, default: null },
  invoiceNumber: { type: String, default: '' },
  invoicePrintedAt: { type: Date, default: null },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  customerAddress: { type: String, default: '' },
  notes: { type: String, default: '' },
  placedBy: { type: String, default: 'Customer' },
  completedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});

tableOrderSchema.index({ cafe: 1, createdAt: -1 });
tableOrderSchema.index({ cafe: 1, status: 1 });
tableOrderSchema.index({ cafe: 1, paymentStatus: 1 });
tableOrderSchema.index({ cafe: 1, sessionId: 1 });
tableOrderSchema.index({ cafe: 1, orderSource: 1, createdAt: -1 });
tableOrderSchema.index({ orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('TableOrder', tableOrderSchema);
