const router = require('express').Router();
const {
  verifyToken,
  isCafeOwner,
  isSuperAdmin,
  enforceTenantScope
} = require('../middleware/authMiddleware');

const {
  getCafeNotices,
  getAllNoticesAdmin,
  createNotice,
  toggleNoticeActive,
  deleteNotice
} = require('../controllers/noticeController');

// Cafe Owner route: fetch active notices for this cafe
router.get('/cafe', verifyToken, isCafeOwner, enforceTenantScope, getCafeNotices);

// SuperAdmin management routes
router.get('/admin', verifyToken, isSuperAdmin, getAllNoticesAdmin);
router.post('/admin', verifyToken, isSuperAdmin, createNotice);
router.patch('/admin/:id/toggle', verifyToken, isSuperAdmin, toggleNoticeActive);
router.delete('/admin/:id', verifyToken, isSuperAdmin, deleteNotice);

module.exports = router;
