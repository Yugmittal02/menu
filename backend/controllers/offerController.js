const Offer = require('../models/Offer');

exports.getAllOffers = async (req, res) => {
    try {
        // Include offers where validTo is null, doesn't exist, or is in the future
        const offers = await Offer.find({ 
            isActive: true,
            $or: [
                { validTo: null },
                { validTo: { $exists: false } },
                { validTo: { $gte: new Date() } }
            ]
        });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
};

exports.getAllOffersAdmin = async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json(offers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers' });
    }
};

exports.createOffer = async (req, res) => {
    try {
        const offer = new Offer(req.body);
        await offer.save();
        res.status(201).json(offer);
    } catch (error) {
        res.status(500).json({ message: 'Error creating offer', error: error.message });
    }
};

exports.updateOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(offer);
    } catch (error) {
        res.status(500).json({ message: 'Error updating offer' });
    }
};

exports.deleteOffer = async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting offer' });
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        const offer = await Offer.findOne({ 
            code: code.toUpperCase(), 
            isActive: true,
            $or: [
                { validTo: null },
                { validTo: { $exists: false } },
                { validTo: { $gte: new Date() } }
            ]
        });
        
        if (!offer) {
            return res.status(400).json({ message: 'Invalid or expired coupon' });
        }
        
        if (orderTotal < offer.minOrderValue) {
            return res.status(400).json({ message: `Minimum order value is ₹${offer.minOrderValue}` });
        }
        
        let discount = 0;
        if (offer.discountType === 'percentage') {
            discount = (orderTotal * offer.discountValue) / 100;
            // Cap at maxDiscount if set
            if (offer.maxDiscount && discount > offer.maxDiscount) {
                discount = offer.maxDiscount;
            }
        } else {
            discount = offer.discountValue;
        }
        
        res.json({ offer, discount });
    } catch (error) {
        res.status(500).json({ message: 'Error validating coupon' });
    }
};
