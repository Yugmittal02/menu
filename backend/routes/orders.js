const router = require('express').Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  placeOrder, trackOrder, getCafeOrders,
  updateOrderStatus, getCafeStats, markOrderPaid
} = require('../controllers/tableOrderController');

const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
const orderPlacementLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isProduction ? 15 : 999,
  message: { message: 'Too many orders submitted. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (customer — no auth)
router.post('/', orderPlacementLimiter, placeOrder);
router.get('/track/:orderNumber', trackOrder);

// Cafe Owner routes
router.get('/cafe/stats', verifyToken, isCafeOwner, enforceTenantScope, getCafeStats);
router.get('/cafe', verifyToken, isCafeOwner, enforceTenantScope, getCafeOrders);
router.put('/:id/status', verifyToken, isCafeOwner, enforceTenantScope, updateOrderStatus);
router.patch('/:id/payment', verifyToken, isCafeOwner, enforceTenantScope, markOrderPaid);

module.exports = router;
