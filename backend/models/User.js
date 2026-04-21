const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['order_placed', 'order_cancelled', 'payment_made', 'payment_failed', 'cart_updated', 'login', 'signup'],
        required: true
    },
    description: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    amount: Number,
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    image: String,
    basePrice: Number,
    price: Number,
    quantity: { type: Number, default: 1 },
    size: String,
    selectedAddons: [String],
    cartId: String,
    category: String,
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    // Persisted cart
    cart: [cartItemSchema],

    // Activity log
    activity: [activitySchema],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving (only for admin)
userSchema.pre('save', async function() {
    if (this.password && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Index for fast customer login (phone + role queries)
userSchema.index({ phone: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
