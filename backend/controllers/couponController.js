const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const Cafe = require('../models/Cafe');

const offlineStore = require('../utils/offlineStore');

// Create coupon (Cafe Owner)
exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt } = req.body;
    if (!code || !type || !value) return res.status(400).json({ message: 'Code, type, and value are required' });

    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const existing = (offlineStore.getCoupons(cafeId) || []).find(c => c.code.toUpperCase() === code.toUpperCase());
      if (existing) return res.status(400).json({ message: 'Coupon code already exists' });
      const newC = offlineStore.createCoupon({
        cafe: cafeId,
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minOrder: Number(minOrder) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        usageLimit: Number(usageLimit) || 0,
        expiresAt: expiresAt || null
      });
      return res.status(201).json(newC);
    }

    try {
      const existing = await Coupon.findOne({ cafe: cafeId, code: code.toUpperCase() });
      if (existing) return res.status(400).json({ message: 'Coupon code already exists' });

      const coupon = new Coupon({
        cafe: cafeId,
        code: code.toUpperCase(),
        type,
        value,
        minOrder: minOrder || 0,
        maxDiscount: maxDiscount || 0,
        usageLimit: usageLimit || 0,
        expiresAt: expiresAt || null
      });
      await coupon.save();
      return res.status(201).json(coupon);
    } catch (dbErr) {
      const newC = offlineStore.createCoupon({
        cafe: cafeId,
        code: code.toUpperCase(),
        type,
        value: Number(value),
        minOrder: Number(minOrder) || 0,
        maxDiscount: Number(maxDiscount) || 0,
        usageLimit: Number(usageLimit) || 0,
        expiresAt: expiresAt || null
      });
      return res.status(201).json(newC);
    }
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all coupons (Cafe Owner)
exports.getMyCoupons = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    if (mongoose.connection.readyState !== 1) {
      return res.json(offlineStore.getCoupons(cafeId));
    }
    try {
      const coupons = await Coupon.find({ cafe: cafeId }).sort({ createdAt: -1 });
      return res.json(coupons);
    } catch (dbErr) {
      return res.json(offlineStore.getCoupons(cafeId));
    }
  } catch (error) {
    try {
      return res.json(offlineStore.getCoupons(req.user?.cafeId));
    } catch { }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update coupon (Cafe Owner)
exports.updateCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt, isActive } = req.body;
    const cafeId = req.user.cafeId;
    const updates = {};
    if (code !== undefined) updates.code = code.toUpperCase();
    if (type !== undefined) updates.type = type;
    if (value !== undefined) updates.value = Number(value);
    if (minOrder !== undefined) updates.minOrder = Number(minOrder);
    if (maxDiscount !== undefined) updates.maxDiscount = Number(maxDiscount);
    if (usageLimit !== undefined) updates.usageLimit = Number(usageLimit);
    if (expiresAt !== undefined) updates.expiresAt = expiresAt;
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const updated = offlineStore.updateCoupon(req.params.id, updates);
      if (!updated) return res.status(404).json({ message: 'Coupon not found' });
      return res.json(updated);
    }

    try {
      const coupon = await Coupon.findOneAndUpdate(
        { _id: req.params.id, cafe: cafeId },
        updates,
        { new: true, runValidators: true }
      );
      if (!coupon) {
        const updated = offlineStore.updateCoupon(req.params.id, updates);
        if (updated) return res.json(updated);
        return res.status(404).json({ message: 'Coupon not found' });
      }
      return res.json(coupon);
    } catch (dbErr) {
      const updated = offlineStore.updateCoupon(req.params.id, updates);
      if (updated) return res.json(updated);
      throw dbErr;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete coupon (Cafe Owner)
exports.deleteCoupon = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const deleted = offlineStore.deleteCoupon(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Coupon not found' });
      return res.json({ message: 'Coupon deleted' });
    }

    try {
      const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, cafe: cafeId });
      if (!coupon) {
        const deleted = offlineStore.deleteCoupon(req.params.id);
        if (deleted) return res.json({ message: 'Coupon deleted' });
        return res.status(404).json({ message: 'Coupon not found' });
      }
      return res.json({ message: 'Coupon deleted' });
    } catch (dbErr) {
      const deleted = offlineStore.deleteCoupon(req.params.id);
      if (deleted) return res.json({ message: 'Coupon deleted' });
      throw dbErr;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle coupon active status (Cafe Owner)
exports.toggleCoupon = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      const existing = (offlineStore.getCoupons(cafeId) || []).find(c => c._id === req.params.id);
      if (!existing) return res.status(404).json({ message: 'Coupon not found' });
      const updated = offlineStore.updateCoupon(req.params.id, { isActive: !existing.isActive });
      return res.json(updated);
    }

    try {
      const coupon = await Coupon.findOne({ _id: req.params.id, cafe: cafeId });
      if (!coupon) {
        const existing = (offlineStore.getCoupons(cafeId) || []).find(c => c._id === req.params.id);
        if (existing) {
          const updated = offlineStore.updateCoupon(req.params.id, { isActive: !existing.isActive });
          return res.json(updated);
        }
        return res.status(404).json({ message: 'Coupon not found' });
      }
      coupon.isActive = !coupon.isActive;
      await coupon.save();
      return res.json(coupon);
    } catch (dbErr) {
      const existing = (offlineStore.getCoupons(cafeId) || []).find(c => c._id === req.params.id);
      if (existing) {
        const updated = offlineStore.updateCoupon(req.params.id, { isActive: !existing.isActive });
        return res.json(updated);
      }
      throw dbErr;
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Validate coupon (Public — customer use)
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cafeId, orderTotal = 0 } = req.body;
    if (!code || !cafeId) return res.status(400).json({ message: 'Code and cafeId required' });

    let cafe = null;
    let coupon = null;

    if (mongoose.connection.readyState === 1) {
      cafe = await Cafe.findOne({
        $or: [
          { cafeId: cafeId.toUpperCase() },
          { slug: cafeId.toLowerCase() }
        ],
        isActive: true
      });
      if (cafe) {
        coupon = await Coupon.findOne({ cafe: cafe._id, code: code.toUpperCase(), isActive: true });
      }
    } else {
      cafe = offlineStore.findCafe(c =>
        (c.slug === cafeId.toLowerCase() || c.cafeId === cafeId.toUpperCase() || String(c._id) === String(cafeId)) &&
        c.isActive !== false
      );
      if (cafe) {
        const cafeIdentifier = cafe._id || cafe.cafeId;
        const coupons = offlineStore.getCoupons(cafeIdentifier) || [];
        coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive !== false);
      }
    }

    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
    if (!coupon) return res.status(404).json({ message: 'Invalid coupon code' });

    // Check expiry
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Check minimum order
    const totalNum = parseFloat(orderTotal) || 0;
    if (coupon.minOrder && totalNum < coupon.minOrder) {
      return res.status(400).json({ message: `Minimum order ₹${coupon.minOrder} required` });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((totalNum * coupon.value) / 100);
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }
    discount = Math.min(discount, totalNum); // Can't exceed total

    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      message: `₹${discount} off applied!`
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public active coupons/offers for a cafe (Exclusive Offers carousel)
exports.getPublicCoupons = async (req, res) => {
  const rawId = (req.params.cafeId || '').trim();
  try {
    let cafeIdObj = null;

    if (mongoose.connection.readyState === 1) {
      const orClauses = [
        { slug: rawId.toLowerCase() },
        { cafeId: rawId.toUpperCase() }
      ];
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        orClauses.push({ _id: rawId });
      }
      const cafe = await Cafe.findOne({ $or: orClauses, isActive: true });
      if (cafe) {
        cafeIdObj = cafe._id;
      }
    }

    if (cafeIdObj) {
      const now = new Date();
      const coupons = await Coupon.find({
        cafe: cafeIdObj,
        isActive: true,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }).select('code type value title description image minOrder maxDiscount');

      return res.json(coupons);
    }

    // Offline store fallback
    let cafe = offlineStore.findCafe(c =>
      (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
      c.isActive !== false
    );
    if (!cafe && ['cafe', 'demo', 'sample', 'default'].includes(rawId.toLowerCase())) {
      const allCafes = offlineStore.getCafes();
      cafe = allCafes.find(c => c.isActive !== false) || allCafes[0];
    }
    const cafeIdentifier = cafe ? (cafe._id || cafe.cafeId) : rawId;
    const coupons = (offlineStore.getCoupons ? offlineStore.getCoupons(cafeIdentifier) : [])
      .filter(c => c.isActive !== false);

    res.json(coupons.map(c => ({
      code: c.code,
      type: c.type,
      value: c.value,
      title: c.title || (c.type === 'percentage' ? `${c.value}% OFF` : `₹${c.value} OFF`),
      description: c.description || (c.minOrder ? `On orders above ₹${c.minOrder}` : 'Special offer'),
      image: c.image || '',
      minOrder: c.minOrder || 0,
      maxDiscount: c.maxDiscount || 0
    })));
  } catch (error) {
    console.error('Get public coupons error:', error);
    res.json([]);
  }
};
