const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['info', 'warning', 'urgent', 'maintenance'],
    default: 'info'
  },
  targetType: {
    type: String,
    enum: ['all', 'specific'],
    default: 'all'
  },
  targetCafes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe'
  }],
  isPopup: {
    type: Boolean,
    default: true
  },
  active: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

noticeSchema.index({ active: 1, targetType: 1 });
noticeSchema.index({ targetCafes: 1, active: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
