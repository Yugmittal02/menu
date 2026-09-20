const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Cashfree Webhook Ingress (Cryptographically verified via raw HMAC-SHA256)
router.post('/cashfree', webhookController.handleCashfreeWebhook);

module.exports = router;
