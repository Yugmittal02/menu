const Offer = require('../models/Offer');

// Get all offers (admin)
exports.getAllOffers = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch offers' });
    }
};

// Get active offers (public)
exports.getActiveOffers = async (req, res) => {
    try {
        const now = new Date();
        const offers = await Offer.find({
            isActive: true,
            $or: [
                { validTo: { $exists: false } },
                { validTo: null },
                { validTo: { $gte: now } }
            ]
        }).sort({ createdAt: -1 });
        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch offers' });
    }
};

// Create offer (admin)
exports.createOffer = async (req, res) => {
    try {
        const offer = new Offer(req.body);
        await offer.save();
        res.status(201).json(offer);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create offer' });
    }
};

// Update offer (admin)
exports.updateOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        res.json(offer);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update offer' });
    }
};

// Delete offer (admin)
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        res.json({ message: 'Offer deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete offer' });
    }
};

// Toggle offer active status (admin)
exports.toggleOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });
        offer.isActive = !offer.isActive;
        await offer.save();
        res.json(offer);
    } catch (err) {
        res.status(500).json({ message: 'Failed to toggle offer' });
    }
};
