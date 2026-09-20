const express = require('express');
const router = express.Router();
const adminPaymentController = require('../controllers/adminPaymentController');
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');

// All endpoints require SuperAdmin authorization
router.use(verifyToken, isSuperAdmin);

router.get('/overview', adminPaymentController.getOverview);
router.get('/accounts', adminPaymentController.listAccounts);
router.get('/transactions', adminPaymentController.listTransactions);
router.get('/webhooks', adminPaymentController.listWebhooks);
router.get('/reconciliation', adminPaymentController.getReconciliation);
router.post('/accounts/:id/suspend', adminPaymentController.suspendAccount);

module.exports = router;
