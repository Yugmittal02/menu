const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '📦'
    },
    colorFrom: {
        type: String,
        default: '#F97316'
    },
    colorTo: {
        type: String,
        default: '#FB923C'
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isQuickPick: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-generate slug from name before validation
categorySchema.pre('validate', function () {
    if (this.name && (!this.slug || this.isModified('name'))) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
});

module.exports = mongoose.model('Category', categorySchema);
