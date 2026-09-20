const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: '', trim: true },
  totalOrders: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  avgOrderValue: { type: Number, default: 0 },
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now },
  favoriteItems: [
    {
      name: { type: String, required: true },
      count: { type: Number, default: 1 }
    }
  ],
  tags: [{ type: String, trim: true }],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.index({ cafe: 1, phone: 1 }, { unique: true });
customerSchema.index({ cafe: 1, totalSpend: -1 });
customerSchema.index({ cafe: 1, totalOrders: -1 });
customerSchema.index({ cafe: 1, lastVisit: -1 });

module.exports = mongoose.model('Customer', customerSchema);
