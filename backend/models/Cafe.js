const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cafeSchema = new mongoose.Schema({
  cafeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  logo: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  description: { type: String, default: '' },
  cuisine: [{ type: String }],
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '22:00' },
  theme: { type: String, default: 'classic-dark', enum: ['classic-dark', 'crimson-velvet', 'matcha-green', 'sunset-orange', 'ocean-blue', 'royal-gold', 'midnight-teal', 'berry-luxe'] },
  isActive: { type: Boolean, default: true },
  tableCount: { type: Number, default: 10, min: 1, max: 200 },
  taxPercent: { type: Number, default: 0, min: 0, max: 100 },
  taxLabel: { type: String, default: 'GST', trim: true },
  currency: { type: String, default: '₹', trim: true },
  autoAcceptOrders: { type: Boolean, default: false },
  kotPrefix: { type: String, default: 'KOT', trim: true },
  invoicePrefix: { type: String, default: 'INV', trim: true },
  businessType: {
    type: String,
    enum: ['cafe', 'restaurant', 'bar', 'bakery', 'cloud-kitchen'],
    default: 'cafe'
  },
  footerText: { type: String, default: 'Thank you for dining with us! Please visit again.' },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
    index: true,
    sparse: true
  },
  tagline: { type: String, default: '', trim: true },
  branding: {
    primaryColor: { type: String, default: '#173D32' },
    secondaryColor: { type: String, default: '#53685C' },
    accentColor: { type: String, default: '#D7B56D' },
    backgroundColor: { type: String, default: '#F7F4EC' },
    surfaceColor: { type: String, default: '#FFFFFF' },
    textColor: { type: String, default: '#18211D' },
    mutedColor: { type: String, default: '#6F7772' },
    borderColor: { type: String, default: 'rgba(23,61,50,0.10)' },
    fontFamily: { type: String, default: 'Playfair Display' }
  },
  orderingConfig: {
    qrOrderingEnabled: { type: Boolean, default: true },
    customerNameRequired: { type: Boolean, default: true },
    customerPhoneRequired: { type: Boolean, default: true },
    allowRepeatOrders: { type: Boolean, default: true },
    allowCustomerNotes: { type: Boolean, default: true },
    allowOnlinePayment: { type: Boolean, default: false },
    allowCashPayment: { type: Boolean, default: true },
    allowUpi: { type: Boolean, default: true }
  },
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    website: { type: String, default: '' },
    mapsUrl: { type: String, default: '' }
  },
  onboarding: {
    onboarding_started: { type: Boolean, default: false },
    onboarding_completed: { type: Boolean, default: false },
    onboarding_skipped: { type: Boolean, default: false },
    current_setup_step: { type: Number, default: 0 },
    completed_setup_steps: [{ type: String }],
    skipped_setup_steps: [{ type: String }],
    current_tour_module: { type: String, default: 'overview' },
    current_tour_step: { type: Number, default: 0 },
    completed_tour_modules: [{ type: String }],
    skipped_tour_modules: [{ type: String }],
    tour_completed: { type: Boolean, default: false },
    welcome_banner_seen: { type: Boolean, default: false },
    welcome_banner_dismissed_at: { type: Date, default: null }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

cafeSchema.pre('save', async function () {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

cafeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Don't return password in JSON
cafeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

cafeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Cafe', cafeSchema);
