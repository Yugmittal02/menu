const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Cafe = require('../models/Cafe');
const offlineStore = require('../utils/offlineStore');

// SuperAdmin login
exports.superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let user;

    if (isDbConnected) {
      user = await User.findOne({ email: email.toLowerCase(), role: 'superadmin' });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Offline fallback
      user = await offlineStore.verifySuperAdmin(email, password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: 'superadmin', email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: 'superadmin' }
    });
  } catch (error) {
    console.error('SuperAdmin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cafe Owner login
exports.cafeOwnerLogin = async (req, res) => {
  try {
    const { cafeId } = req.body;
    if (!cafeId) {
      return res.status(400).json({ message: 'Cafe ID is required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let cafe;

    if (isDbConnected) {
      cafe = await Cafe.findOne({ cafeId: cafeId.toUpperCase() });
    } else {
      cafe = offlineStore.findCafe(c => c.cafeId === cafeId.toUpperCase());
    }

    if (!cafe) {
      return res.status(401).json({ message: 'Invalid Cafe ID' });
    }
    if (!cafe.isActive) {
      return res.status(403).json({ message: 'This cafe has been deactivated. Contact admin.' });
    }

    // Password verification removed as per requirement

    const token = jwt.sign(
      { cafeId: cafe._id, cafeName: cafe.name, cafeCode: cafe.cafeId, role: 'cafeowner' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        cafeId: cafe._id,
        cafeCode: cafe.cafeId,
        name: cafe.name,
        ownerName: cafe.ownerName,
        role: 'cafeowner'
      }
    });
  } catch (error) {
    console.error('Cafe login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
