const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    restaurantName: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    businessType: {
      type: String,
      required: [true, 'Business type is required'],
      enum: ['Cafe', 'Restaurant', 'Cloud Kitchen', 'Hotel', 'Food Court', 'Bakery', 'Other'],
      default: 'Restaurant',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    tables: {
      type: Number,
      required: [true, 'Number of tables is required'],
      min: [1, 'At least 1 table is required'],
      default: 10,
    },
    menuRequirements: {
      type: [String],
      default: [],
    },
    estimatedDailyOrders: {
      type: String,
      default: 'Under 25',
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Demo Scheduled', 'Onboarding', 'Active', 'Rejected'],
      default: 'New',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    convertedCafeId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
