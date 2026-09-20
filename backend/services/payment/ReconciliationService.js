const Payment = require('../../models/Payment');
const PaymentSplit = require('../../models/PaymentSplit');
const WebhookEvent = require('../../models/WebhookEvent');
const PaymentAccount = require('../../models/PaymentAccount');
const CashfreePaymentProvider = require('./CashfreePaymentProvider');
const PaymentSplitService = require('./PaymentSplitService');

class ReconciliationService {
  constructor(provider = null) {
    this.provider = provider || new CashfreePaymentProvider();
  }

  /**
   * Scan for discrepancies:
   * 1. Successful payments missing split records
   * 2. Quarantined or rejected webhooks
   * 3. Stale pending payments
   */
  async runReconciliation() {
    const issues = [];

    // 1. Missing splits for SUCCESS payments
    const successfulPayments = await Payment.find({ status: 'SUCCESS' }).limit(100).lean();
    for (const payment of successfulPayments) {
      const split = await PaymentSplit.findOne({ payment_id: payment._id });
      if (!split) {
        issues.push({
          type: 'MISSING_SPLIT',
          paymentId: payment._id,
          providerOrderId: payment.provider_order_id,
          restaurantId: payment.restaurant_id,
          severity: 'HIGH',
          message: 'Payment is marked SUCCESS but has no PaymentSplit record'
        });

        // Auto-heal missing split
        const calculated = PaymentSplitService.calculateSplit(payment.amount_minor);
        await PaymentSplitService.recordSplit({
          restaurantId: payment.restaurant_id,
          paymentId: payment._id,
          paymentAccountId: payment.payment_account_id,
          providerVendorId: payment.provider_vendor_id,
          grossAmountMinor: calculated.grossAmountMinor,
          vendorAmountMinor: calculated.vendorAmountMinor,
          krixovAmountMinor: calculated.krixovAmountMinor
        });
      }
    }

    // 2. Webhook quarantine count
    const quarantinedWebhooks = await WebhookEvent.find({ processing_status: 'QUARANTINED' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    for (const q of quarantinedWebhooks) {
      issues.push({
        type: 'QUARANTINED_WEBHOOK',
        webhookId: q._id,
        eventType: q.event_type,
        errorMessage: q.error_message,
        severity: 'MEDIUM',
        message: `Webhook event quarantined: ${q.error_message}`
      });
    }

    // 3. Stale pending payments (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const stalePayments = await Payment.find({
      status: 'PENDING',
      createdAt: { $lt: oneHourAgo }
    }).limit(20).lean();

    for (const p of stalePayments) {
      issues.push({
        type: 'STALE_PENDING_PAYMENT',
        paymentId: p._id,
        providerOrderId: p.provider_order_id,
        restaurantId: p.restaurant_id,
        severity: 'LOW',
        message: 'Payment has remained in PENDING status for over 1 hour'
      });
    }

    return {
      timestamp: new Date(),
      totalIssuesFound: issues.length,
      issues
    };
  }
}

module.exports = ReconciliationService;
