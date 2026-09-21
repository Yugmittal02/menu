const mongoose = require('mongoose');

const moduleStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['active', 'maintenance', 'soon', 'disabled'],
    default: 'active'
  },
  message: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const systemConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    unique: true,
    default: 'global_system_modules'
  },
  modules: {
    payments: {
      type: moduleStatusSchema,
      default: () => ({ status: 'active', message: '' })
    },
    inventory: {
      type: moduleStatusSchema,
      default: () => ({ status: 'active', message: '' })
    },
    coupons: {
      type: moduleStatusSchema,
      default: () => ({ status: 'active', message: '' })
    },
    reservations: {
      type: moduleStatusSchema,
      default: () => ({ status: 'active', message: '' })
    },
    crm: {
      type: moduleStatusSchema,
      default: () => ({ status: 'active', message: '' })
    },
    kot: {
      type: moduleStatusSchema,
      default: () => ({ status: 'active', message: '' })
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
