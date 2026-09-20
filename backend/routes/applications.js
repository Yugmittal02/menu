const router = require('express').Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Cafe = require('../models/Cafe');
const offlineStore = require('../utils/offlineStore');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

// Helper to generate application reference ID like QRA-2026-X89F2
const generateApplicationId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `QRA-${year}-${randomStr}`;
};

// Helper to generate Cafe ID like CAFE-A1B2C3
const generateCafeId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CAFE-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ==========================================
// PUBLIC: Submit New Restaurant Application
// ==========================================
router.post('/', async (req, res) => {
  try {
    const {
      restaurantName,
      ownerName,
      phone,
      email,
      businessType,
      city,
      address,
      tables,
      menuRequirements,
      estimatedDailyOrders,
      message,
    } = req.body;

    if (!restaurantName || !ownerName || !phone || !email || !city || !address || !tables) {
      return res.status(400).json({
        message: 'Please fill in all required fields (Restaurant Name, Owner Name, Phone, Email, City, Address, Tables)',
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    // Generate unique Application ID
    let applicationId;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 10) {
      applicationId = generateApplicationId();
      if (isDbConnected) {
        exists = await Application.findOne({ applicationId });
      } else {
        exists = !!offlineStore.findApplication(a => a.applicationId === applicationId);
      }
      attempts++;
    }

    const appData = {
      applicationId,
      restaurantName,
      ownerName,
      phone,
      email,
      businessType: businessType || 'Restaurant',
      city,
      address,
      tables: Number(tables) || 10,
      menuRequirements: Array.isArray(menuRequirements) ? menuRequirements : [],
      estimatedDailyOrders: estimatedDailyOrders || 'Under 25',
      message: message || '',
      status: 'New',
    };

    if (isDbConnected) {
      const application = new Application(appData);
      await application.save();

      return res.status(201).json({
        message: 'Application received successfully',
        applicationId,
        application,
      });
    } else {
      const application = offlineStore.createApplication(appData);
      return res.status(201).json({
        message: 'Application received successfully',
        applicationId,
        application,
      });
    }
  } catch (error) {
    console.error('Submit application error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to submit application. Please try again.' });
  }
});

// ==========================================
// SUPER ADMIN: Get All Applications (with filters)
// ==========================================
router.get('/', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status && status !== 'All') {
        query.status = status;
      }
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { restaurantName: searchRegex },
          { ownerName: searchRegex },
          { city: searchRegex },
          { phone: searchRegex },
          { email: searchRegex },
          { applicationId: searchRegex },
        ];
      }
      const applications = await Application.find(query).sort({ createdAt: -1 });
      return res.json(applications);
    } else {
      const applications = offlineStore.getApplications({ status, search });
      return res.json(applications);
    }
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// ==========================================
// SUPER ADMIN: Update Application Status & Notes
// ==========================================
router.patch('/:id/status', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const application = await Application.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (status) application.status = status;
      if (adminNotes !== undefined) application.adminNotes = adminNotes;

      await application.save();

      return res.json({
        message: 'Application updated successfully',
        application,
      });
    } else {
      const updates = {};
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;

      const application = offlineStore.updateApplication(req.params.id, updates);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      return res.json({
        message: 'Application updated successfully',
        application,
      });
    }
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Failed to update application' });
  }
});

// ==========================================
// SUPER ADMIN: 1-Click Convert Lead to Cafe
// ==========================================
router.post('/:id/convert', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const application = await Application.findById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (application.convertedCafeId) {
        const existingCafe = await Cafe.findOne({ cafeId: application.convertedCafeId });
        if (existingCafe) {
          return res.status(400).json({
            message: `Application already converted to Cafe ${application.convertedCafeId}`,
            cafe: existingCafe,
          });
        }
      }

      // Generate unique Cafe ID
      let cafeId;
      let exists = true;
      while (exists) {
        cafeId = generateCafeId();
        exists = await Cafe.findOne({ cafeId });
      }

      const cafe = new Cafe({
        cafeId,
        name: application.restaurantName,
        ownerName: application.ownerName,
        phone: application.phone,
        email: application.email,
        address: application.address,
        city: application.city,
        tableCount: application.tables || 10,
        description: `Created from application ${application.applicationId}. Type: ${application.businessType}`,
        createdBy: req.user.id,
        isActive: true,
      });

      await cafe.save();

      application.status = 'Active';
      application.convertedCafeId = cafeId;
      await application.save();

      return res.status(201).json({
        message: 'Cafe account created successfully from application',
        cafeId,
        cafe: cafe.toJSON(),
        application,
      });
    } else {
      const application = offlineStore.findApplication(a => a._id === req.params.id || a.applicationId === req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (application.convertedCafeId) {
        const existingCafe = offlineStore.findCafe(c => c.cafeId === application.convertedCafeId);
        if (existingCafe) {
          return res.status(400).json({
            message: `Application already converted to Cafe ${application.convertedCafeId}`,
            cafe: existingCafe,
          });
        }
      }

      let cafeId;
      let exists = true;
      while (exists) {
        cafeId = generateCafeId();
        exists = !!offlineStore.findCafe(c => c.cafeId === cafeId);
      }

      const cafe = offlineStore.createCafe({
        cafeId,
        name: application.restaurantName,
        ownerName: application.ownerName,
        phone: application.phone,
        email: application.email,
        address: application.address,
        city: application.city,
        tableCount: application.tables || 10,
        description: `Created from application ${application.applicationId}. Type: ${application.businessType}`,
        createdBy: req.user.id,
        isActive: true,
      });

      offlineStore.updateApplication(application._id, {
        status: 'Active',
        convertedCafeId: cafeId,
      });

      return res.status(201).json({
        message: 'Cafe account created successfully from application',
        cafeId,
        cafe,
        application,
      });
    }
  } catch (error) {
    console.error('Convert application error:', error);
    res.status(500).json({ message: 'Failed to convert application to Cafe account' });
  }
});

// ==========================================
// SUPER ADMIN: Delete Application
// ==========================================
router.delete('/:id', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const application = await Application.findByIdAndDelete(req.params.id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      return res.json({ message: 'Application deleted successfully' });
    } else {
      const deleted = offlineStore.deleteApplication(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Application not found' });
      }
      return res.json({ message: 'Application deleted successfully' });
    }
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ message: 'Failed to delete application' });
  }
});

module.exports = router;
