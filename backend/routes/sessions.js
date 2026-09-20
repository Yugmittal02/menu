const router = require('express').Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  openSession,
  getActiveSessions,
  getSessionDetail,
  moveToBilling,
  closeSession,
  cancelSession,
  resolveSession,
  getCustomerSession,
  customerRequestBill
} = require('../controllers/sessionController');

// Public Customer-facing routes
router.post('/resolve', resolveSession);
router.get('/customer/:sessionId', getCustomerSession);
router.patch('/:id/request-bill', customerRequestBill);

// Cafe Owner protected routes with strict tenant isolation
router.post('/', verifyToken, isCafeOwner, enforceTenantScope, openSession);
router.get('/active', verifyToken, isCafeOwner, enforceTenantScope, getActiveSessions);
router.get('/:id', verifyToken, isCafeOwner, enforceTenantScope, getSessionDetail);
router.patch('/:id/billing', verifyToken, isCafeOwner, enforceTenantScope, moveToBilling);
router.patch('/:id/close', verifyToken, isCafeOwner, enforceTenantScope, closeSession);
router.delete('/:id', verifyToken, isCafeOwner, enforceTenantScope, cancelSession);

module.exports = router;
