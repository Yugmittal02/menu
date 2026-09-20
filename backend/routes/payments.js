const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, isCafeOwner, attachCafe } = require('../middleware/authMiddleware');

// ===================================
// Public Customer Endpoints
// ===================================
router.post('/create-session', paymentController.createPaymentSession);
router.get('/verify/:orderId', paymentController.verifyPayment);

// ===================================
// Cafe Owner Authenticated Endpoints
// ===================================
router.get('/account', verifyToken, isCafeOwner, attachCafe, paymentController.getAccountStatus);
router.post('/connect', verifyToken, isCafeOwner, attachCafe, paymentController.connectAccount);
router.post('/disconnect', verifyToken, isCafeOwner, attachCafe, paymentController.disconnectAccount);
router.post('/reconnect', verifyToken, isCafeOwner, attachCafe, paymentController.reconnectAccount);
router.post('/toggle', verifyToken, isCafeOwner, attachCafe, paymentController.toggleOnlinePayment);
router.get('/transactions', verifyToken, isCafeOwner, attachCafe, paymentController.getTransactions);
router.get('/settlements', verifyToken, isCafeOwner, attachCafe, paymentController.getSettlements);
router.post('/:paymentId/refund', verifyToken, isCafeOwner, attachCafe, paymentController.refundPayment);

module.exports = router;
