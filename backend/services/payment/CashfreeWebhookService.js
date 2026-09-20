const crypto = require('crypto');
const WebhookEvent = require('../../models/WebhookEvent');
const Payment = require('../../models/Payment');
const TableOrder = require('../../models/TableOrder');
const TableSession = require('../../models/TableSession');
const CashfreePaymentProvider = require('./CashfreePaymentProvider');
const PaymentSplitService = require('./PaymentSplitService');
const PaymentAuditService = require('./PaymentAuditService');

class CashfreeWebhookService {
  constructor(provider = null) {
    this.provider = provider || new CashfreePaymentProvider();
  }

  /**
   * Process incoming raw webhook payload and headers
   */
  async handleWebhook(headers, rawBody) {
    const payloadHash = crypto.createHash('sha256').update(rawBody || '').digest('hex');

    // Parse JSON payload safely
    let payload = {};
    try {
      payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    } catch (err) {
      // Invalid JSON
      await this._recordWebhookEvent({
        eventType: 'MALFORMED_JSON',
        payloadHash,
        signatureValid: false,
        processingStatus: 'REJECTED',
        errorMessage: 'Malformed JSON payload',
        payload: { raw: rawBody }
      });
      return { success: false, status: 400, message: 'Malformed JSON payload' };
    }

    const eventType = payload.type || payload.event || 'UNKNOWN';
    const eventId = payload.data?.payment?.cf_payment_id || payload.event_id || '';

    // 1. Signature Verification
    const isSignatureValid = this.provider.verifyWebhookSignature(headers, rawBody);
    if (!isSignatureValid) {
      await this._recordWebhookEvent({
        eventType,
        eventId: String(eventId),
        payloadHash,
        signatureValid: false,
        processingStatus: 'REJECTED',
        errorMessage: 'Cryptographic signature mismatch',
        payload
      });
      return { success: false, status: 401, message: 'Invalid webhook signature' };
    }

    // 2. Anti-Replay: Verify timestamp freshness (reject if drift > 5 minutes)
    const timestamp = headers['x-webhook-timestamp'] || headers['x-cf-timestamp'];
    if (timestamp) {
      const tsNum = Number(timestamp);
      const timestampMs = tsNum < 1e11 ? tsNum * 1000 : tsNum;
      const ageMs = Math.abs(Date.now() - timestampMs);
      const MAX_AGE_MS = 5 * 60 * 1000;
      if (ageMs > MAX_AGE_MS && !this.provider.isMockMode) {
        await this._recordWebhookEvent({
          eventType,
          eventId: String(eventId),
          payloadHash,
          signatureValid: true,
          processingStatus: 'REJECTED',
          errorMessage: `Webhook timestamp expired or in future (drift: ${Math.round(ageMs / 1000)}s)`,
          payload
        });
        return { success: false, status: 400, message: 'Webhook timestamp expired (replay rejected)' };
      }
    }

    // 2. Idempotency / Deduplication check
    const existingProcessed = await WebhookEvent.findOne({
      payload_sha256: payloadHash,
      signature_valid: true,
      processing_status: 'PROCESSED'
    });

    if (existingProcessed) {
      await this._recordWebhookEvent({
        eventType,
        eventId: String(eventId),
        payloadHash,
        signatureValid: true,
        processingStatus: 'DUPLICATE',
        errorMessage: 'Webhook payload already processed',
        payload,
        restaurantId: existingProcessed.restaurant_id,
        paymentId: existingProcessed.payment_id
      });
      return { success: true, status: 200, message: 'Duplicate webhook event acknowledged' };
    }

    // 3. Process according to event type
    const webhookRecord = await this._recordWebhookEvent({
      eventType,
      eventId: String(eventId),
      payloadHash,
      signatureValid: true,
      processingStatus: 'VERIFIED',
      payload
    });

    try {
      if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || payload.data?.payment?.payment_status === 'SUCCESS') {
        await this._processPaymentSuccess(payload, webhookRecord);
      } else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || payload.data?.payment?.payment_status === 'FAILED') {
        await this._processPaymentFailure(payload, webhookRecord);
      } else if (eventType.startsWith('SETTLEMENT_') || eventType.startsWith('TRANSFER_')) {
        await this._processSettlementEvent(payload, webhookRecord);
      } else if (eventType.startsWith('REFUND_')) {
        await this._processRefundEvent(payload, webhookRecord);
      } else {
        // Other verified events
        webhookRecord.processing_status = 'PROCESSED';
        webhookRecord.processed_at = new Date();
        await webhookRecord.save();
      }

      return { success: true, status: 200, message: 'Webhook processed successfully' };
    } catch (err) {
      webhookRecord.processing_status = 'QUARANTINED';
      webhookRecord.error_message = err.message;
      await webhookRecord.save();

      return { success: false, status: 500, message: `Processing error: ${err.message}` };
    }
  }

  async _processPaymentSuccess(payload, webhookRecord) {
    const data = payload.data || {};
    const orderData = data.order || {};
    const paymentData = data.payment || {};

    const providerOrderId = orderData.order_id || payload.order_id;
    const providerPaymentId = paymentData.cf_payment_id || paymentData.payment_id;
    const paymentMethod = paymentData.payment_group || 'online';
    const paymentTime = paymentData.payment_time ? new Date(paymentData.payment_time) : new Date();

    if (!providerOrderId) {
      throw new Error('No order_id present in payment success webhook');
    }

    const payment = await Payment.findOne({ provider_order_id: providerOrderId });
    if (!payment) {
      throw new Error(`No internal Payment record matches provider_order_id: ${providerOrderId}`);
    }

    webhookRecord.restaurant_id = payment.restaurant_id;
    webhookRecord.payment_id = payment._id;

    // Verify amount matches internal payment amount_minor (prevent underpayment attacks)
    const receivedAmount = Number(paymentData.payment_amount ?? orderData.order_amount);
    if (!isNaN(receivedAmount) && receivedAmount > 0) {
      const receivedAmountMinor = Math.round(receivedAmount * 100);
      if (receivedAmountMinor !== payment.amount_minor) {
        webhookRecord.processing_status = 'QUARANTINED';
        webhookRecord.error_message = `Amount mismatch: expected ${payment.amount_minor} paise, received ${receivedAmountMinor} paise`;
        await webhookRecord.save();
        return;
      }
    }

    if (payment.status === 'SUCCESS') {
      webhookRecord.processing_status = 'PROCESSED';
      webhookRecord.processed_at = new Date();
      await webhookRecord.save();
      return;
    }

    // Transition payment to SUCCESS
    payment.status = 'SUCCESS';
    payment.verification_status = 'WEBHOOK_VERIFIED';
    payment.provider_payment_id = String(providerPaymentId || payment.provider_payment_id || '');
    payment.payment_method = paymentMethod;
    payment.paid_at = paymentTime;
    await payment.save();

    // Record immutable split
    const split = PaymentSplitService.calculateSplit(payment.amount_minor);
    await PaymentSplitService.recordSplit({
      restaurantId: payment.restaurant_id,
      paymentId: payment._id,
      paymentAccountId: payment.payment_account_id,
      providerVendorId: payment.provider_vendor_id,
      grossAmountMinor: split.grossAmountMinor,
      vendorAmountMinor: split.vendorAmountMinor,
      krixovAmountMinor: split.krixovAmountMinor
    });

    // Update TableOrder or TableSession
    if (payment.order_id) {
      await TableOrder.findByIdAndUpdate(payment.order_id, {
        $set: {
          paymentStatus: 'paid',
          paymentMethod,
          paidAt: paymentTime
        }
      });
    }

    if (payment.session_id) {
      await TableSession.findByIdAndUpdate(payment.session_id, {
        $set: {
          paymentStatus: 'paid',
          paymentMethod,
          settledAt: paymentTime
        }
      });
    }

    // Audit log
    await PaymentAuditService.log({
      actorType: 'WEBHOOK',
      actorId: 'CASHFREE',
      restaurantId: payment.restaurant_id,
      action: 'PAYMENT_CONFIRMED_VIA_WEBHOOK',
      entityType: 'Payment',
      entityId: payment._id,
      newState: payment.toObject(),
      metadata: {
        providerOrderId,
        providerPaymentId,
        paymentMethod
      }
    });

    webhookRecord.processing_status = 'PROCESSED';
    webhookRecord.processed_at = new Date();
    await webhookRecord.save();
  }

  async _processPaymentFailure(payload, webhookRecord) {
    const data = payload.data || {};
    const orderData = data.order || {};
    const paymentData = data.payment || {};
    const providerOrderId = orderData.order_id || payload.order_id;
    const failureReason = paymentData.payment_message || 'Payment failed';

    if (providerOrderId) {
      const payment = await Payment.findOne({ provider_order_id: providerOrderId });
      if (payment && payment.status !== 'SUCCESS') {
        payment.status = 'FAILED';
        payment.failure_reason = failureReason;
        await payment.save();

        webhookRecord.restaurant_id = payment.restaurant_id;
        webhookRecord.payment_id = payment._id;

        await PaymentAuditService.log({
          actorType: 'WEBHOOK',
          actorId: 'CASHFREE',
          restaurantId: payment.restaurant_id,
          action: 'PAYMENT_FAILED_VIA_WEBHOOK',
          entityType: 'Payment',
          entityId: payment._id,
          newState: payment.toObject(),
          metadata: { failureReason }
        });
      }
    }

    webhookRecord.processing_status = 'PROCESSED';
    webhookRecord.processed_at = new Date();
    await webhookRecord.save();
  }

  async _processSettlementEvent(payload, webhookRecord) {
    const SettlementService = require('./SettlementService');
    const PaymentAccount = require('../../models/PaymentAccount');
    const data = payload.data || {};
    const vendorId = data.vendor_id || payload.vendor_id;
    const settlementId = data.settlement_id || payload.settlement_id || '';
    const amountRupees = Number(data.settlement_amount || data.amount || 0);
    const status = (payload.type || '').includes('FAILED') ? 'FAILED' : 'SETTLED';

    if (vendorId) {
      const account = await PaymentAccount.findOne({ provider_vendor_id: vendorId });
      if (account) {
        webhookRecord.restaurant_id = account.restaurant_id;
        await SettlementService.recordSettlement({
          restaurantId: account.restaurant_id,
          paymentAccountId: account._id,
          providerVendorId: vendorId,
          providerSettlementId: settlementId,
          amountMinor: Math.round(amountRupees * 100),
          status,
          settledAt: new Date(data.settlement_time || Date.now())
        });
      }
    }
    webhookRecord.processing_status = 'PROCESSED';
    webhookRecord.processed_at = new Date();
    await webhookRecord.save();
  }

  async _processRefundEvent(payload, webhookRecord) {
    const data = payload.data || {};
    const refundData = data.refund || {};
    const orderId = refundData.order_id || data.order_id;
    const refundStatus = refundData.refund_status || ((payload.type || '').includes('SUCCESS') ? 'SUCCESS' : 'FAILED');
    const refundAmountRupees = Number(refundData.refund_amount || 0);

    if (orderId) {
      const payment = await Payment.findOne({ provider_order_id: orderId });
      if (payment) {
        webhookRecord.restaurant_id = payment.restaurant_id;
        webhookRecord.payment_id = payment._id;

        if (refundStatus === 'SUCCESS' && refundAmountRupees > 0) {
          const refundMinor = Math.round(refundAmountRupees * 100);
          payment.refunded_amount_minor = (payment.refunded_amount_minor || 0) + refundMinor;
          payment.status = payment.refunded_amount_minor >= payment.amount_minor ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
          await payment.save();
        }
      }
    }
    webhookRecord.processing_status = 'PROCESSED';
    webhookRecord.processed_at = new Date();
    await webhookRecord.save();
  }

  async _recordWebhookEvent({
    eventType,
    eventId = '',
    payloadHash,
    signatureValid,
    processingStatus,
    errorMessage = '',
    payload = {},
    restaurantId = null,
    paymentId = null
  }) {
    const event = new WebhookEvent({
      provider: 'CASHFREE',
      event_type: eventType,
      event_id: eventId,
      payload_sha256: payloadHash,
      signature_valid: signatureValid,
      processing_status: processingStatus,
      error_message: errorMessage,
      payload,
      restaurant_id: restaurantId,
      payment_id: paymentId
    });
    return await event.save();
  }
}

module.exports = CashfreeWebhookService;
