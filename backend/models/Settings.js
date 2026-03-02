const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: ['upi_config', 'store_config', 'fee_config']
    },
    // UPI Configuration
    upiId: {
        type: String,
        default: ''
    },
    merchantName: {
        type: String,
        default: 'Store'
    },
    // Store Configuration
    adminPhone: {
        type: String,
        default: '9876543210'
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    // Fee Configuration
    platformFee: {
        type: Number,
        default: 0.98
    },
    taxRate: {
        type: Number,
        default: 5 // Percentage (5%)
    },
    deliveryFeeBase: {
        type: Number,
        default: 30 // Base delivery fee
    },
    deliveryFeePerKm: {
        type: Number,
        default: 5 // Per kilometer charge
    },
    freeDeliveryThreshold: {
        type: Number,
        default: 500 // Free delivery above this amount
    },
    deliveryRadiusKm: {
        type: Number,
        default: 10 // Maximum delivery radius in km
    },
    // Store location for delivery calculation
    storeLocation: {
        lat: { type: Number, default: 28.6139 },
        lng: { type: Number, default: 77.2090 }
    },
    // Settings password (hashed) - separate from admin login
    settingsPassword: {
        type: String,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        default: 'system'
    }
});



module.exports = mongoose.model('Settings', SettingsSchema);
