const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String }, // URL or base64
    category: { type: String, required: true },
    basePrice: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    sizes: [{
        name: { type: String },
        price: { type: Number }
    }],
    addons: [{
        name: { type: String },
        price: { type: Number }
    }],
    subcategories: [{ type: String }],
    isBestseller: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
