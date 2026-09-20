const mongoose = require('mongoose');
const Cafe = require('../models/Cafe');
const crypto = require('crypto');
const offlineStore = require('../utils/offlineStore');

// Generate unique cafe ID like "CAFE-A1B2C3"
const generateCafeId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CAFE-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create a new cafe (SuperAdmin only)
exports.createCafe = async (req, res) => {
  try {
    const { name, ownerName, phone, email, address, city, description, cuisine, openTime, closeTime, tableCount } = req.body;

    if (!name || !ownerName || !phone) {
      return res.status(400).json({ message: 'Name, owner name, and phone are required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    // Generate unique cafe ID
    let cafeId;
    let exists = true;
    while (exists) {
      cafeId = generateCafeId();
      if (isDbConnected) {
        exists = await Cafe.findOne({ cafeId });
      } else {
        exists = !!offlineStore.findCafe(c => c.cafeId === cafeId);
      }
    }

    if (isDbConnected) {
      const cafe = new Cafe({
        cafeId,
        name,
        ownerName,
        phone,
        email: email || '',
        address: address || '',
        city: city || '',
        description: description || '',
        cuisine: cuisine || [],
        openTime: openTime || '09:00',
        closeTime: closeTime || '22:00',
        tableCount: tableCount || 10,
        createdBy: req.user.id
      });

      await cafe.save();

      return res.status(201).json({
        message: 'Cafe created successfully',
        cafe: cafe.toJSON(),
        cafeId: cafeId
      });
    } else {
      const newCafe = offlineStore.createCafe({
        cafeId,
        name,
        ownerName,
        phone,
        email: email || '',
        address: address || '',
        city: city || '',
        description: description || '',
        cuisine: cuisine || [],
        openTime: openTime || '09:00',
        closeTime: closeTime || '22:00',
        tableCount: tableCount || 10,
        createdBy: req.user.id,
        isActive: true
      });

      return res.status(201).json({
        message: 'Cafe created successfully',
        cafe: newCafe,
        cafeId: cafeId
      });
    }
  } catch (error) {
    console.error('Create cafe error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cafe with this ID already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all cafes (SuperAdmin only)
exports.getAllCafes = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cafes = await Cafe.find().sort({ createdAt: -1 }).select('-password');
      return res.json(cafes);
    } else {
      const cafes = offlineStore.getCafes();
      return res.json(cafes);
    }
  } catch (error) {
    console.error('Get cafes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get public cafe info (for customer menu page)
exports.getPublicCafeInfo = async (req, res) => {
  const rawId = (req.params.cafeId || '').trim();
  const publicFields = 'cafeId slug name tagline ownerName phone address city logo coverImage description cuisine openTime closeTime tableCount theme branding currency taxPercent taxLabel orderingConfig socialLinks footerText';

  try {
    if (mongoose.connection.readyState === 1) {
      const orClauses = [
        { slug: rawId.toLowerCase() },
        { cafeId: rawId.toUpperCase() }
      ];
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        orClauses.push({ _id: rawId });
      }

      let cafe = await Cafe.findOne({
        $or: orClauses,
        isActive: true
      }).select(publicFields);

      if (!cafe) {
        // Fallback check in offline store
        cafe = offlineStore.findCafe(c =>
          (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
          c.isActive !== false
        );
      }

      // Smart demo fallback for /c/CAFE, /c/demo, /c/sample
      if (!cafe && ['cafe', 'demo', 'sample', 'default'].includes(rawId.toLowerCase())) {
        cafe = await Cafe.findOne({ isActive: true }).select(publicFields);
        if (!cafe) {
          cafe = offlineStore.findCafe(c => c.isActive !== false) || offlineStore.getCafes()[0];
        }
      }

      if (!cafe) {
        return res.status(404).json({ message: 'Cafe not found' });
      }

      return res.json(cafe);
    } else {
      let cafe = offlineStore.findCafe(c =>
        (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
        c.isActive !== false
      );

      // Smart demo fallback for /c/CAFE, /c/demo, /c/sample in offline mode
      if (!cafe && ['cafe', 'demo', 'sample', 'default'].includes(rawId.toLowerCase())) {
        cafe = offlineStore.findCafe(c => c.isActive !== false) || offlineStore.getCafes()[0];
      }

      if (!cafe) {
        return res.status(404).json({ message: 'Cafe not found' });
      }
      return res.json(cafe);
    }
  } catch (error) {
    console.error('Get public cafe error:', error);
    try {
      const fallback = offlineStore.findCafe(c =>
        (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
        c.isActive !== false
      );
      if (fallback) return res.json(fallback);
    } catch (e) {}
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current cafe profile (Cafe Owner)
exports.getMyCafe = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cafe = await Cafe.findById(req.user.cafeId).select('-password');
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      return res.json(cafe);
    } else {
      const cafe = offlineStore.findCafe(c => c._id === req.user.cafeId || c.cafeId === req.user.cafeCode);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      return res.json(cafe);
    }
  } catch (error) {
    console.error('Get my cafe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update cafe (SuperAdmin or CafeOwner for their own)
exports.updateCafe = async (req, res) => {
  try {
    const id = req.params.id;

    // Strict tenant isolation: Cafe owners can ONLY update their own cafe
    if (req.user.role === 'cafeowner' && String(id) !== String(req.user.cafeId)) {
      return res.status(403).json({ message: 'Access denied: Cannot modify another cafe' });
    }

    const updates = {};
    const ownerAllowed = [
      'name', 'ownerName', 'phone', 'email', 'address', 'city',
      'logo', 'tagline', 'coverImage',
      'description', 'cuisine', 'openTime', 'closeTime', 'tableCount',
      'taxPercent', 'taxLabel', 'kotPrefix', 'invoicePrefix', 'currency', 'footerText',
      'theme', 'branding', 'orderingConfig', 'socialLinks', 'onboarding'
    ];

    if (req.user.role === 'cafeowner') {
      ownerAllowed.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
    } else {
      // SuperAdmin
      Object.assign(updates, req.body);
      delete updates.cafeId;
      delete updates.password;
      delete updates.createdBy;
    }

    if (mongoose.connection.readyState === 1) {
      const cafe = await Cafe.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      return res.json({ message: 'Cafe updated', cafe });
    } else {
      const cafe = offlineStore.updateCafe(id, updates);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      return res.json({ message: 'Cafe updated', cafe });
    }
  } catch (error) {
    console.error('Update cafe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle cafe active status (SuperAdmin only)
exports.toggleCafeStatus = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cafe = await Cafe.findById(req.params.id);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

      cafe.isActive = !cafe.isActive;
      await cafe.save();

      return res.json({ message: `Cafe ${cafe.isActive ? 'activated' : 'deactivated'}`, isActive: cafe.isActive });
    } else {
      const existing = offlineStore.findCafe(c => c._id === req.params.id || c.cafeId === req.params.id);
      if (!existing) return res.status(404).json({ message: 'Cafe not found' });

      const updated = offlineStore.updateCafe(req.params.id, { isActive: !existing.isActive });
      return res.json({ message: `Cafe ${updated.isActive ? 'activated' : 'deactivated'}`, isActive: updated.isActive });
    }
  } catch (error) {
    console.error('Toggle cafe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete cafe (SuperAdmin only)
exports.deleteCafe = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cafe = await Cafe.findByIdAndDelete(req.params.id);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      return res.json({ message: 'Cafe deleted' });
    } else {
      const deleted = offlineStore.deleteCafe(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'Cafe not found' });
      return res.json({ message: 'Cafe deleted' });
    }
  } catch (error) {
    console.error('Delete cafe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change cafe password (CafeOwner)
exports.changeCafePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password required' });
    }

    if (mongoose.connection.readyState === 1) {
      const cafe = await Cafe.findById(req.user.cafeId);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

      const isMatch = await cafe.comparePassword(currentPassword);
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

      cafe.password = newPassword;
      await cafe.save();

      return res.json({ message: 'Password changed successfully' });
    } else {
      return res.json({ message: 'Password changed successfully (offline mode)' });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current cafe onboarding progress (Cafe Owner)
exports.getMyOnboarding = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let cafe;
    if (isDbConnected) {
      cafe = await Cafe.findById(req.user.cafeId).select('onboarding name cafeId tableCount taxPercent');
    } else {
      cafe = offlineStore.findCafe(c => c._id === req.user.cafeId || c.cafeId === req.user.cafeCode);
    }
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
    return res.json({
      success: true,
      onboarding: cafe.onboarding || {
        onboarding_started: false,
        onboarding_completed: false,
        onboarding_skipped: false,
        current_setup_step: 0,
        completed_setup_steps: [],
        skipped_setup_steps: [],
        current_tour_module: 'overview',
        current_tour_step: 0,
        completed_tour_modules: [],
        skipped_tour_modules: [],
        tour_completed: false,
        welcome_banner_seen: false,
        welcome_banner_dismissed_at: null
      }
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current cafe onboarding progress (Cafe Owner - Tenant Scoped)
exports.updateMyOnboarding = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const updates = req.body || {};
    const allowedOnboardingFields = [
      'onboarding_started',
      'onboarding_completed',
      'onboarding_skipped',
      'current_setup_step',
      'completed_setup_steps',
      'skipped_setup_steps',
      'current_tour_module',
      'current_tour_step',
      'completed_tour_modules',
      'skipped_tour_modules',
      'tour_completed',
      'welcome_banner_seen',
      'welcome_banner_dismissed_at'
    ];

    const sanitized = {};
    allowedOnboardingFields.forEach(field => {
      if (updates[field] !== undefined) {
        sanitized[field] = updates[field];
      }
    });

    if (isDbConnected) {
      const cafe = await Cafe.findById(req.user.cafeId);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

      cafe.onboarding = {
        ...(cafe.onboarding?.toObject ? cafe.onboarding.toObject() : (cafe.onboarding || {})),
        ...sanitized
      };
      await cafe.save();
      return res.json({ message: 'Onboarding progress saved', onboarding: cafe.onboarding });
    } else {
      const cafe = offlineStore.updateCafe(req.user.cafeId, { onboarding: sanitized });
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      return res.json({ message: 'Onboarding progress saved', onboarding: cafe.onboarding });
    }
  } catch (error) {
    console.error('Update onboarding error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
