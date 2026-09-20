const express = require('express');
const router = express.Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  getStaff,
  createStaff,
  updateStaff,
  resetPin,
  toggleStaff,
  deleteStaff,
  staffPinLogin
} = require('../controllers/staffController');

// PIN login endpoint (strictly scoped to verified token cafe context)
router.post('/pin-login', verifyToken, enforceTenantScope, staffPinLogin);

// Cafe Owner staff management endpoints (strictly tenant isolated)
router.get('/', verifyToken, isCafeOwner, enforceTenantScope, getStaff);
router.post('/', verifyToken, isCafeOwner, enforceTenantScope, createStaff);
router.put('/:id', verifyToken, isCafeOwner, enforceTenantScope, updateStaff);
router.patch('/:id/pin', verifyToken, isCafeOwner, enforceTenantScope, resetPin);
router.patch('/:id/toggle', verifyToken, isCafeOwner, enforceTenantScope, toggleStaff);
router.delete('/:id', verifyToken, isCafeOwner, enforceTenantScope, deleteStaff);

module.exports = router;
