const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  customerEmail: { type: String, default: '', trim: true },
  pax: { type: Number, default: 2, min: 1 },
  reservationDate: { type: Date, required: true },
  timeSlot: { type: String, required: true, trim: true }, // e.g. "19:30"
  tableNumber: { type: Number, default: null }, // optional pre-assigned table
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'seated', 'cancelled', 'no-show'],
    default: 'confirmed'
  },
  specialRequests: { type: String, default: '' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession', default: null },
  createdAt: { type: Date, default: Date.now }
});

reservationSchema.index({ cafe: 1, reservationDate: 1 });
reservationSchema.index({ cafe: 1, status: 1 });
reservationSchema.index({ cafe: 1, customerPhone: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
