const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: '', trim: true },
  role: {
    type: String,
    enum: ['manager', 'cashier', 'waiter', 'kitchen'],
    default: 'waiter'
  },
  pin: { type: String, required: true }, // 4-digit PIN (hashed)
  isActive: { type: Boolean, default: true },
  permissions: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

staffSchema.index({ cafe: 1, isActive: 1 });

// Compare PIN helper
staffSchema.methods.comparePin = async function (enteredPin) {
  return await bcrypt.compare(String(enteredPin), this.pin);
};

// Hash PIN before save if modified
staffSchema.pre('save', async function () {
  if (!this.isModified('pin')) return;
  const salt = await bcrypt.genSalt(10);
  this.pin = await bcrypt.hash(String(this.pin), salt);
});

module.exports = mongoose.model('Staff', staffSchema);
