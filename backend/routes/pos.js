const router = require('express').Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  placePosOrder,
  quickTakeaway,
  getKotData,
  getInvoiceData,
  markInvoicePrinted
} = require('../controllers/posController');

// All POS operations are Cafe Owner protected with strict tenant isolation
router.post('/order', verifyToken, isCafeOwner, enforceTenantScope, placePosOrder);
router.post('/takeaway', verifyToken, isCafeOwner, enforceTenantScope, quickTakeaway);
router.get('/kot/:orderId', verifyToken, isCafeOwner, enforceTenantScope, getKotData);
router.get('/invoice/:sessionId', verifyToken, isCafeOwner, enforceTenantScope, getInvoiceData);
router.post('/invoice/:sessionId/print', verifyToken, isCafeOwner, enforceTenantScope, markInvoicePrinted);

module.exports = router;
