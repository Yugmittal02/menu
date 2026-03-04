const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const bcrypt = require('bcryptjs');

// Default settings password (should be changed on first setup)
const DEFAULT_PASSWORD = 'Imperio';

// Initialize or get settings by key
const getOrCreateSettings = async (key = 'upi_config') => {
    let settings = await Settings.findOne({ key });
    if (!settings) {
        // Create default settings with default password
        const salt = await bcrypt.genSalt(10);
        const settingsPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
        
        settings = await Settings.create({
            key,
            upiId: key === 'upi_config' ? '' : undefined,
            merchantName: key === 'upi_config' ? 'Store' : undefined,
            adminPhone: key === 'store_config' ? '9876543210' : undefined,
            settingsPassword,
            updatedBy: 'system'
        });
    }
    return settings;
};

// GET /api/settings/upi - Get current UPI config (public)
router.get('/upi', async (req, res) => {
    try {
        const settings = await getOrCreateSettings('upi_config');
        res.json({
            upiId: settings.upiId,
            merchantName: settings.merchantName,
            isConfigured: settings.upiId && settings.upiId.includes('@'),
            updatedAt: settings.updatedAt
        });
    } catch (error) {
        console.error('Error fetching UPI settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/settings/upi/admin - Get UPI config for admin (shows masked ID)
router.get('/upi/admin', async (req, res) => {
    try {
        const settings = await getOrCreateSettings('upi_config');
        
        // Mask the UPI ID for display (e.g., "ayu***@upi")
        let maskedUpiId = '';
        if (settings.upiId) {
            const [name, handle] = settings.upiId.split('@');
            if (name && handle) {
                const maskedName = name.substring(0, 3) + '***';
                maskedUpiId = `${maskedName}@${handle}`;
            } else {
                maskedUpiId = '***';
            }
        }
        
        res.json({
            upiId: settings.upiId,
            maskedUpiId: maskedUpiId,
            merchantName: settings.merchantName,
            isConfigured: settings.upiId && settings.upiId.includes('@'),
            updatedAt: settings.updatedAt,
            updatedBy: settings.updatedBy
        });
    } catch (error) {
        console.error('Error fetching admin UPI settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// NOTE: GET /store route is defined further below with proper isOpen field

// POST /api/settings/verify-password - Verify settings password
router.post('/verify-password', async (req, res) => {
    try {
        const { password, type } = req.body; // type: 'upi' or 'store'
        const key = type === 'store' ? 'store_config' : 'upi_config';
        
        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        const settings = await getOrCreateSettings(key);
        const isMatch = await bcrypt.compare(password, settings.settingsPassword);
        
        res.json({ valid: isMatch });
    } catch (error) {
        console.error('Error verifying password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/settings/upi - Update UPI config (requires password)
router.put('/upi', async (req, res) => {
    try {
        const { upiId, merchantName, password, newPassword } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: 'Settings password is required' });
        }

        const settings = await getOrCreateSettings('upi_config');
        
        // Verify password - check DB hash first, then fallback to default password
        const isMatch = await bcrypt.compare(password, settings.settingsPassword);
        const isDefaultPassword = password === DEFAULT_PASSWORD;
        
        if (!isMatch && !isDefaultPassword) {
            return res.status(401).json({ message: 'Incorrect settings password' });
        }

        // Validate UPI ID format
        if (upiId && !upiId.includes('@')) {
            return res.status(400).json({ message: 'Invalid UPI ID format. Must contain @' });
        }

        // Update settings
        if (upiId !== undefined) settings.upiId = upiId.trim();
        if (merchantName !== undefined) settings.merchantName = merchantName.trim();
        settings.updatedAt = new Date();
        settings.updatedBy = 'admin';

        // Update password if provided
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            settings.settingsPassword = await bcrypt.hash(newPassword, salt);
        }

        await settings.save();

        res.json({
            message: 'UPI settings updated successfully',
            upiId: settings.upiId,
            merchantName: settings.merchantName,
            isConfigured: settings.upiId && settings.upiId.includes('@')
        });
    } catch (error) {
        console.error('Error updating UPI settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/settings/store - Get store config (public)
router.get('/store', async (req, res) => {
    try {
        const settings = await getOrCreateSettings('store_config');
        res.json({
            isOpen: settings.isOpen !== undefined ? settings.isOpen : true,
            adminPhone: settings.adminPhone || '',
            updatedAt: settings.updatedAt
        });
    } catch (error) {
        console.error('Error fetching store settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/settings/store - Update Store config (requires password)
router.put('/store', async (req, res) => {
    try {
        const { adminPhone, isOpen, password, newPassword } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: 'Settings password is required' });
        }

        const settings = await getOrCreateSettings('store_config');
        
        // Verify password - check DB hash first, then fallback to default password
        const isMatch = await bcrypt.compare(password, settings.settingsPassword);
        const isDefaultPassword = password === DEFAULT_PASSWORD;
        
        if (!isMatch && !isDefaultPassword) {
            return res.status(401).json({ message: 'Incorrect settings password' });
        }

        // Update settings
        if (adminPhone !== undefined) settings.adminPhone = adminPhone.trim();
        if (isOpen !== undefined) settings.isOpen = isOpen;
        settings.updatedAt = new Date();
        settings.updatedBy = 'admin';

        // Update password if provided
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            settings.settingsPassword = await bcrypt.hash(newPassword, salt);
        }

        await settings.save();

        res.json({
            message: 'Store settings updated successfully',
            adminPhone: settings.adminPhone,
            isOpen: settings.isOpen
        });
    } catch (error) {
        console.error('Error updating Store settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/settings/change-password - Change settings password
router.put('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword, type } = req.body;
        const key = type === 'store' ? 'store_config' : 'upi_config';
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const settings = await getOrCreateSettings(key);
        
        // Verify current password - check DB hash first, then fallback to default password
        const isMatch = await bcrypt.compare(currentPassword, settings.settingsPassword);
        const isDefaultPassword = currentPassword === DEFAULT_PASSWORD;
        
        if (!isMatch && !isDefaultPassword) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        // Update password
        const salt = await bcrypt.genSalt(10);
        settings.settingsPassword = await bcrypt.hash(newPassword, salt);
        settings.updatedAt = new Date();
        
        await settings.save();

        res.json({ message: 'Settings password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/settings/fees - Get fee configuration (public)
router.get('/fees', async (req, res) => {
    try {
        const settings = await getOrCreateSettings('fee_config');
        res.json({
            platformFee: settings.platformFee || 0.98,
            taxRate: settings.taxRate || 5,
            deliveryFeeBase: settings.deliveryFeeBase || 30,
            deliveryFeePerKm: settings.deliveryFeePerKm || 5,
            freeDeliveryThreshold: settings.freeDeliveryThreshold || 500,
            deliveryRadiusKm: settings.deliveryRadiusKm || 10,
            storeLocation: settings.storeLocation || { lat: 28.6139, lng: 77.2090 },
            updatedAt: settings.updatedAt
        });
    } catch (error) {
        console.error('Error fetching fee settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/settings/fees - Update fee configuration (requires password)
router.put('/fees', async (req, res) => {
    try {
        const { 
            platformFee, 
            taxRate, 
            deliveryFeeBase, 
            deliveryFeePerKm, 
            freeDeliveryThreshold,
            deliveryRadiusKm,
            storeLocation,
            password 
        } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: 'Settings password is required' });
        }

        const settings = await getOrCreateSettings('fee_config');
        
        // Verify password - check DB hash first, then fallback to default password
        const isMatch = await bcrypt.compare(password, settings.settingsPassword);
        const isDefaultPassword = password === DEFAULT_PASSWORD;
        
        if (!isMatch && !isDefaultPassword) {
            return res.status(401).json({ message: 'Incorrect settings password' });
        }

        // Update settings
        if (platformFee !== undefined) settings.platformFee = platformFee;
        if (taxRate !== undefined) settings.taxRate = taxRate;
        if (deliveryFeeBase !== undefined) settings.deliveryFeeBase = deliveryFeeBase;
        if (deliveryFeePerKm !== undefined) settings.deliveryFeePerKm = deliveryFeePerKm;
        if (freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = freeDeliveryThreshold;
        if (deliveryRadiusKm !== undefined) settings.deliveryRadiusKm = deliveryRadiusKm;
        if (storeLocation) settings.storeLocation = storeLocation;
        settings.updatedAt = new Date();
        settings.updatedBy = 'admin';

        await settings.save();

        res.json({
            message: 'Fee settings updated successfully',
            platformFee: settings.platformFee,
            taxRate: settings.taxRate,
            deliveryFeeBase: settings.deliveryFeeBase,
            deliveryFeePerKm: settings.deliveryFeePerKm,
            freeDeliveryThreshold: settings.freeDeliveryThreshold,
            deliveryRadiusKm: settings.deliveryRadiusKm,
            storeLocation: settings.storeLocation
        });
    } catch (error) {
        console.error('Error updating fee settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/settings/calculate-delivery - Calculate delivery fee based on coordinates
router.post('/calculate-delivery', async (req, res) => {
    try {
        const { customerLat, customerLng, orderTotal } = req.body;
        
        if (!customerLat || !customerLng) {
            return res.status(400).json({ message: 'Customer coordinates are required' });
        }

        const settings = await getOrCreateSettings('fee_config');
        const storeLocation = settings.storeLocation || { lat: 28.6139, lng: 77.2090 };
        
        // Calculate distance using Haversine formula
        const toRad = (deg) => deg * (Math.PI / 180);
        const R = 6371; // Earth's radius in km
        
        const dLat = toRad(customerLat - storeLocation.lat);
        const dLon = toRad(customerLng - storeLocation.lng);
        const lat1 = toRad(storeLocation.lat);
        const lat2 = toRad(customerLat);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Check if within delivery radius
        const deliveryRadiusKm = settings.deliveryRadiusKm || 10;
        if (distance > deliveryRadiusKm) {
            return res.status(400).json({ 
                message: `Sorry, we only deliver within ${deliveryRadiusKm}km. Your location is ${distance.toFixed(1)}km away.`,
                distance: distance.toFixed(2),
                deliverable: false
            });
        }
        
        // Calculate delivery fee
        const deliveryFeeBase = settings.deliveryFeeBase || 30;
        const deliveryFeePerKm = settings.deliveryFeePerKm || 5;
        const freeDeliveryThreshold = settings.freeDeliveryThreshold || 500;
        
        let deliveryFee = 0;
        let freeDelivery = false;
        
        if (orderTotal >= freeDeliveryThreshold) {
            freeDelivery = true;
            deliveryFee = 0;
        } else {
            deliveryFee = deliveryFeeBase + (distance * deliveryFeePerKm);
            deliveryFee = Math.round(deliveryFee * 100) / 100; // Round to 2 decimal places
        }
        
        res.json({
            distance: distance.toFixed(2),
            deliveryFee,
            freeDelivery,
            freeDeliveryThreshold,
            deliverable: true,
            message: freeDelivery 
                ? 'Free delivery!' 
                : `Delivery fee: ₹${deliveryFee.toFixed(0)}`
        });
    } catch (error) {
        console.error('Error calculating delivery fee:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ====== HOMEPAGE BADGES ======
// Uses a separate 'app_config' collection to avoid Settings schema enum constraints

const DEFAULT_BADGES = [
    { icon: '⚡', title: 'Express Delivery', subtitle: 'Within 2 hours', enabled: true },
    { icon: '🌿', title: '100% Eggless', subtitle: 'Pure Vegetarian', enabled: true },
    { icon: '🎁', title: 'Free Delivery', subtitle: 'Above ₹500', enabled: true }
];

// GET /api/settings/homepage-badges
router.get('/homepage-badges', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const configCol = mongoose.connection.db.collection('app_config');
        let doc = await configCol.findOne({ key: 'homepage_badges' });
        
        if (!doc) {
            // Seed default
            await configCol.insertOne({ key: 'homepage_badges', value: DEFAULT_BADGES, updatedAt: new Date() });
            doc = { value: DEFAULT_BADGES };
        }
        
        res.json(doc.value);
    } catch (error) {
        console.error('Error fetching homepage badges:', error);
        res.json(DEFAULT_BADGES); // Fallback to defaults on error
    }
});

// PUT /api/settings/homepage-badges (admin only, requires auth)
router.put('/homepage-badges', async (req, res) => {
    try {
        const { badges } = req.body;
        if (!Array.isArray(badges)) {
            return res.status(400).json({ message: 'badges must be an array' });
        }

        const mongoose = require('mongoose');
        const configCol = mongoose.connection.db.collection('app_config');
        
        await configCol.updateOne(
            { key: 'homepage_badges' },
            { $set: { value: badges, updatedAt: new Date() } },
            { upsert: true }
        );
        
        res.json({ message: 'Homepage badges updated', badges });
    } catch (error) {
        console.error('Error updating homepage badges:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
