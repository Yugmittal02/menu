const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const Cafe = require('../models/Cafe');
const offlineStore = require('../utils/offlineStore');

// 1. Get All Staff Members for Cafe
exports.getStaff = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const list = offlineStore.getStaff ? offlineStore.getStaff(cafeId) : [];
      return res.json(list);
    }

    const staffList = await Staff.find({ cafe: cafeId })
      .select('-pin')
      .sort({ createdAt: -1 });

    res.json(staffList);
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Create Staff Member
exports.createStaff = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { name, phone = '', role = 'waiter', pin, permissions = [] } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ message: 'Staff name and 4-digit PIN are required' });
    }

    if (String(pin).length !== 4 || isNaN(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 4 digits' });
    }

    if (mongoose.connection.readyState !== 1) {
      const created = offlineStore.createStaff
        ? offlineStore.createStaff({ cafe: cafeId, name, phone, role, pin: String(pin), permissions })
        : { _id: `staff-${Date.now()}`, name, phone, role, permissions, isActive: true };

      return res.status(201).json({ message: 'Staff member created successfully', staff: created });
    }

    const staff = new Staff({
      cafe: cafeId,
      name: name.trim(),
      phone: phone.trim(),
      role,
      pin: String(pin),
      permissions: permissions.length > 0 ? permissions : getDefaultPermissions(role)
    });

    await staff.save();

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: {
        _id: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        permissions: staff.permissions,
        isActive: staff.isActive,
        createdAt: staff.createdAt
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update Staff Details
exports.updateStaff = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;
    const { name, phone, role, permissions } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.updateStaff ? offlineStore.updateStaff(id, { name, phone, role, permissions }) : null;
      if (!updated) return res.status(404).json({ message: 'Staff member not found' });
      return res.json({ message: 'Staff updated', staff: updated });
    }

    const staff = await Staff.findOne({ _id: id, cafe: cafeId });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (role) staff.role = role;
    if (permissions) staff.permissions = permissions;

    await staff.save();

    res.json({
      message: 'Staff updated',
      staff: {
        _id: staff._id,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        permissions: staff.permissions,
        isActive: staff.isActive
      }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Reset Staff 4-digit PIN
exports.resetPin = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin || String(pin).length !== 4 || isNaN(pin)) {
      return res.status(400).json({ message: 'Valid 4-digit numeric PIN is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      if (offlineStore.resetStaffPin) offlineStore.resetStaffPin(id, String(pin));
      return res.json({ message: 'PIN updated successfully' });
    }

    const staff = await Staff.findOne({ _id: id, cafe: cafeId });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    staff.pin = String(pin);
    await staff.save();

    res.json({ message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Reset staff PIN error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Toggle Staff Active / Inactive
exports.toggleStaff = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.toggleStaff ? offlineStore.toggleStaff(id) : null;
      if (!updated) return res.status(404).json({ message: 'Staff not found' });
      return res.json({ message: `Staff is now ${updated.isActive ? 'active' : 'inactive'}`, staff: updated });
    }

    const staff = await Staff.findOne({ _id: id, cafe: cafeId });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    staff.isActive = !staff.isActive;
    await staff.save();

    res.json({
      message: `Staff is now ${staff.isActive ? 'active' : 'inactive'}`,
      staff: {
        _id: staff._id,
        name: staff.name,
        role: staff.role,
        isActive: staff.isActive
      }
    });
  } catch (error) {
    console.error('Toggle staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Delete Staff
exports.deleteStaff = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      if (offlineStore.deleteStaff) offlineStore.deleteStaff(id);
      return res.json({ message: 'Staff deleted' });
    }

    const staff = await Staff.findOneAndDelete({ _id: id, cafe: cafeId });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    res.json({ message: 'Staff deleted' });
  } catch (error) {
    console.error('Delete staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Rapid PIN Login (used by staff on POS terminal)
exports.staffPinLogin = async (req, res) => {
  try {
    const cafeId = req.user?.cafeId;
    if (!cafeId) {
      return res.status(401).json({ message: 'Authentication required for PIN login' });
    }
    const { pin } = req.body;

    if (!pin || String(pin).length !== 4) {
      return res.status(400).json({ message: '4-digit PIN is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const staffMember = offlineStore.verifyStaffPin ? offlineStore.verifyStaffPin(cafeId, String(pin)) : null;
      if (!staffMember) return res.status(401).json({ message: 'Incorrect PIN' });
      return res.json({
        message: `Welcome, ${staffMember.name}`,
        staff: {
          _id: staffMember._id,
          name: staffMember.name,
          role: staffMember.role,
          permissions: staffMember.permissions || []
        }
      });
    }

    const activeStaff = await Staff.find({ cafe: cafeId, isActive: true });
    let matchedStaff = null;

    for (const member of activeStaff) {
      const match = await member.comparePin(String(pin));
      if (match) {
        matchedStaff = member;
        break;
      }
    }

    if (!matchedStaff) {
      return res.status(401).json({ message: 'Incorrect PIN or staff member inactive' });
    }

    res.json({
      message: `Welcome, ${matchedStaff.name}`,
      staff: {
        _id: matchedStaff._id,
        name: matchedStaff.name,
        role: matchedStaff.role,
        permissions: matchedStaff.permissions
      }
    });
  } catch (error) {
    console.error('Staff PIN login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper: Default permissions by role
function getDefaultPermissions(role) {
  switch (role) {
    case 'manager':
      return ['pos_order', 'view_orders', 'billing_close', 'inventory', 'crm', 'reservations', 'settings'];
    case 'cashier':
      return ['pos_order', 'view_orders', 'billing_close', 'reservations'];
    case 'kitchen':
      return ['view_orders'];
    case 'waiter':
    default:
      return ['pos_order', 'view_orders'];
  }
}
