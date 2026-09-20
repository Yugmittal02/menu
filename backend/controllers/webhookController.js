const CashfreeWebhookService = require('../services/payment/CashfreeWebhookService');

const webhookService = new CashfreeWebhookService();

/**
 * Handle incoming Cashfree webhook with raw body verification
 */
exports.handleCashfreeWebhook = async (req, res) => {
  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const headers = req.headers;

    const result = await webhookService.handleWebhook(headers, rawBody);
    return res.status(result.status || 200).json(result);
  } catch (err) {
    console.error('[WebhookController] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing webhook'
    });
  }
};
