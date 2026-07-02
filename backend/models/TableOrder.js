const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' }
}, { _id: false });

const tableOrderSchema = new mongoose.Schema({
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  tableNumber: { type: Number, required: true },
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
    enum: ['cash', 'upi', 'card', 'other', ''],
    default: ''
  },
  paidAt: { type: Date, default: null },
  specialInstructions: { type: String, default: '' },
  orderNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

tableOrderSchema.index({ cafe: 1, createdAt: -1 });
tableOrderSchema.index({ cafe: 1, status: 1 });
tableOrderSchema.index({ cafe: 1, paymentStatus: 1 });
tableOrderSchema.index({ orderNumber: 1 }, { unique: true });

module.exports = mongoose.model('TableOrder', tableOrderSchema);
