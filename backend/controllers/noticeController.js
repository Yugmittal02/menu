const mongoose = require('mongoose');
const Notice = require('../models/Notice');

// 1. Get Notices applicable to current logged-in Cafe
exports.getCafeNotices = async (req, res) => {
  try {
    const cafeId = req.user?.cafeId;
    if (!cafeId) {
      return res.status(400).json({ message: 'Cafe identification required' });
    }

    const now = new Date();
    const query = {
      active: true,
      $or: [
        { targetType: 'all' },
        { targetCafes: cafeId }
      ],
      $and: [
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        }
      ]
    };

    const notices = await Notice.find(query).sort({ createdAt: -1 }).limit(20);
    res.json({
      success: true,
      notices
    });
  } catch (error) {
    console.error('Error fetching cafe notices:', error);
    res.status(500).json({ message: 'Failed to retrieve notices' });
  }
};

// 2. SuperAdmin: Get all notices with target details
exports.getAllNoticesAdmin = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate('targetCafes', 'name cafeId city')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notices
    });
  } catch (error) {
    console.error('Error fetching admin notices:', error);
    res.status(500).json({ message: 'Failed to fetch notices list' });
  }
};

// 3. SuperAdmin: Create new broadcast or targeted notice
exports.createNotice = async (req, res) => {
  try {
    const {
      title,
      message,
      priority = 'info',
      targetType = 'all',
      targetCafes = [],
      isPopup = true,
      expiresAt = null
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const validPriorities = ['info', 'warning', 'urgent', 'maintenance'];
    const chosenPriority = validPriorities.includes(priority) ? priority : 'info';

    const validTargetType = targetType === 'specific' ? 'specific' : 'all';
    let cafeIds = [];
    if (validTargetType === 'specific' && Array.isArray(targetCafes)) {
      cafeIds = targetCafes.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (cafeIds.length === 0) {
        return res.status(400).json({ message: 'Please select at least one valid cafe for specific targeting' });
      }
    }

    const notice = new Notice({
      title: title.trim(),
      message: message.trim(),
      priority: chosenPriority,
      targetType: validTargetType,
      targetCafes: cafeIds,
      isPopup: Boolean(isPopup),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user?.id || req.user?._id || null,
      active: true
    });

    await notice.save();

    const populated = await Notice.findById(notice._id).populate('targetCafes', 'name cafeId city');

    res.status(201).json({
      success: true,
      message: 'Notice broadcasted successfully',
      notice: populated
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Failed to broadcast notice' });
  }
};

// 4. SuperAdmin: Toggle Notice Active / Inactive
exports.toggleNoticeActive = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    notice.active = !notice.active;
    await notice.save();

    res.json({
      success: true,
      message: `Notice ${notice.active ? 'activated' : 'deactivated'}`,
      notice
    });
  } catch (error) {
    console.error('Error toggling notice:', error);
    res.status(500).json({ message: 'Failed to toggle notice status' });
  }
};

// 5. SuperAdmin: Delete Notice
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Failed to delete notice' });
  }
};
