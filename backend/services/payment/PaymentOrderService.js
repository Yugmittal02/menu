const crypto = require('crypto');
const Payment = require('../../models/Payment');
const PaymentAccount = require('../../models/PaymentAccount');
const TableOrder = require('../../models/TableOrder');
const TableSession = require('../../models/TableSession');
const Cafe = require('../../models/Cafe');
const CashfreePaymentProvider = require('./CashfreePaymentProvider');
const PaymentSplitService = require('./PaymentSplitService');
const PaymentAuditService = require('./PaymentAuditService');

class PaymentOrderService {
  constructor(provider = null) {
    this.provider = provider || new CashfreePaymentProvider();
  }

  /**
   * Create an Easy Split payment order for an order or session
   */
  async createPaymentSession({
    orderId = null,
    sessionId = null,
    customerDetails = {},
    returnUrl = null,
    notifyUrl = null
  }) {
    if (!orderId && !sessionId) {
      throw new Error('Either orderId or sessionId is required to create a payment session');
    }

    let targetOrder = null;
    let targetSession = null;
    let restaurantId = null;
    let grandTotal = 0;
    let billId = '';

    if (orderId) {
      targetOrder = await TableOrder.findById(orderId);
      if (!targetOrder) throw new Error('Order not found');
      if (targetOrder.paymentStatus === 'paid') {
        throw new Error('This order has already been paid');
      }
      restaurantId = targetOrder.cafe;
      grandTotal = Number(targetOrder.grandTotal || 0);
      billId = targetOrder.orderNumber || targetOrder._id.toString();
    } else if (sessionId) {
      targetSession = await TableSession.findById(sessionId);
      if (!targetSession) throw new Error('Dining session not found');
      if (targetSession.paymentStatus === 'paid') {
        throw new Error('This session has already been paid');
      }
      restaurantId = targetSession.cafe;
      grandTotal = Number(targetSession.grandTotal || 0);
      billId = targetSession.sessionCode || targetSession._id.toString();
    }

    if (!restaurantId) {
      throw new Error('Could not resolve restaurant for the given order or session');
    }

    const amountMinor = Math.round(grandTotal * 100);
    if (amountMinor <= 0) {
      throw new Error('Payable amount must be greater than zero');
    }

    // 1. Resolve and validate restaurant's PaymentAccount
    const paymentAccount = await PaymentAccount.findOne({ restaurant_id: restaurantId });
    if (!paymentAccount) {
      throw new Error('Online payments are not configured for this restaurant');
    }

    if (paymentAccount.connection_status !== 'CONNECTED' || !paymentAccount.online_payment_enabled) {
      throw new Error('Online payments are currently disabled or disconnected for this restaurant');
    }

    if (paymentAccount.verification_status !== 'VERIFIED') {
      throw new Error('Restaurant payment account verification is not complete');
    }

    const providerVendorId = paymentAccount.provider_vendor_id;
    if (!providerVendorId) {
      throw new Error('Restaurant does not have an active vendor ID configured');
    }

    // 2. Compute Easy Split allocations
    const split = PaymentSplitService.calculateSplit(amountMinor);
    const amountRupees = (amountMinor / 100).toFixed(2);
    const vendorRupees = (split.vendorAmountMinor / 100).toFixed(2);

    // 3. Reuse active PENDING session if created within last 15 minutes
    const pendingQuery = {
      restaurant_id: restaurantId,
      status: 'PENDING',
      cf_payment_session_id: { $ne: '' },
      createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) }
    };
    if (targetOrder) pendingQuery.order_id = targetOrder._id;
    if (targetSession) pendingQuery.session_id = targetSession._id;

    const existingPending = await Payment.findOne(pendingQuery);
    if (existingPending && existingPending.amount_minor === amountMinor) {
      return {
        paymentId: existingPending._id,
        providerOrderId: existingPending.provider_order_id,
        paymentSessionId: existingPending.cf_payment_session_id,
        amount: parseFloat(amountRupees),
        currency: 'INR',
        environment: this.provider.environment
      };
    }

    // 4. Generate unique IDs and internal payment record
    const targetRef = (orderId || sessionId).toString().slice(-8);
    const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const providerOrderId = `cf_${targetRef}_${uniqueSuffix}`;
    const idempotencyKey = `idem_${providerOrderId}`;

    const payment = new Payment({
      restaurant_id: restaurantId,
      order_id: targetOrder ? targetOrder._id : null,
      session_id: targetSession ? targetSession._id : null,
      bill_id: billId,
      payment_account_id: paymentAccount._id,
      provider: 'CASHFREE',
      provider_order_id: providerOrderId,
      provider_vendor_id: providerVendorId,
      amount_minor: amountMinor,
      currency: 'INR',
      status: 'CREATED',
      verification_status: 'UNVERIFIED',
      idempotency_key: idempotencyKey
    });

    await payment.save();

    // 4. Create order on Cashfree with Easy Split vendor routing
    const splits = [{
      vendorId: providerVendorId,
      amount: vendorRupees
    }];

    let cfResponse;
    try {
      cfResponse = await this.provider.createPaymentOrder({
        orderId: providerOrderId,
        amount: amountRupees,
        currency: 'INR',
        customer: {
          id: customerDetails.id || `cust_${payment._id.toString().slice(-8)}`,
          name: customerDetails.name || 'Dine-in Customer',
          phone: customerDetails.phone || '9999999999',
          email: customerDetails.email || 'customer@krixov.com'
        },
        orderMeta: {
          returnUrl: returnUrl || null,
          notifyUrl: notifyUrl || null
        },
        splits
      });
    } catch (err) {
      payment.status = 'FAILED';
      payment.failure_reason = err.message;
      await payment.save();
      throw err;
    }

    payment.cf_payment_session_id = cfResponse.paymentSessionId;
    payment.status = 'PENDING';
    await payment.save();

    await PaymentAuditService.log({
      actorType: 'USER',
      actorId: customerDetails.id || 'CUSTOMER',
      restaurantId,
      action: 'PAYMENT_SESSION_CREATED',
      entityType: 'Payment',
      entityId: payment._id,
      newState: payment.toObject(),
      metadata: {
        providerOrderId,
        amountRupees,
        vendorRupees,
        vendorId: providerVendorId
      }
    });

    return {
      paymentId: payment._id,
      providerOrderId,
      paymentSessionId: cfResponse.paymentSessionId,
      amount: parseFloat(amountRupees),
      currency: 'INR',
      environment: this.provider.environment
    };
  }

  /**
   * Verify and reconcile an order payment status directly with Cashfree
   */
  async verifyAndSyncPayment(providerOrderId) {
    const payment = await Payment.findOne({ provider_order_id: providerOrderId });
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status === 'SUCCESS') {
      return {
        paymentId: payment._id,
        status: payment.status,
        isPaid: true,
        paymentMethod: payment.payment_method
      };
    }

    const statusRes = await this.provider.getPaymentStatus(providerOrderId);

    if (statusRes.isPaid || statusRes.successfulPayment) {
      const successfulPayment = statusRes.successfulPayment || {};
      payment.status = 'SUCCESS';
      payment.verification_status = 'PROVIDER_CONFIRMED';
      payment.provider_payment_id = successfulPayment.payment_id || `cf_pay_${Date.now()}`;
      payment.payment_method = successfulPayment.payment_group || 'online';
      payment.paid_at = new Date(successfulPayment.payment_time || Date.now());
      await payment.save();

      // Record split
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

      // Update associated order or session
      if (payment.order_id) {
        await TableOrder.findByIdAndUpdate(payment.order_id, {
          $set: {
            paymentStatus: 'paid',
            paymentMethod: payment.payment_method || 'online',
            paidAt: payment.paid_at
          }
        });
      }

      if (payment.session_id) {
        await TableSession.findByIdAndUpdate(payment.session_id, {
          $set: {
            paymentStatus: 'paid',
            paymentMethod: payment.payment_method || 'online',
            settledAt: payment.paid_at
          }
        });
      }

      await PaymentAuditService.log({
        actorType: 'SYSTEM',
        actorId: 'PROVIDER_SYNC',
        restaurantId: payment.restaurant_id,
        action: 'PAYMENT_VERIFIED_SUCCESS',
        entityType: 'Payment',
        entityId: payment._id,
        newState: payment.toObject()
      });

      return {
        paymentId: payment._id,
        status: 'SUCCESS',
        isPaid: true,
        paymentMethod: payment.payment_method
      };
    }

    return {
      paymentId: payment._id,
      status: payment.status,
      isPaid: false
    };
  }
}

module.exports = PaymentOrderService;
