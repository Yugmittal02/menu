const Payment = require('../models/Payment');
const RestaurantPaymentAccountService = require('../services/payment/RestaurantPaymentAccountService');
const PaymentOrderService = require('../services/payment/PaymentOrderService');
const SettlementService = require('../services/payment/SettlementService');
const RefundService = require('../services/payment/RefundService');

const accountService = new RestaurantPaymentAccountService();
const orderService = new PaymentOrderService();
const refundService = new RefundService();

/**
 * Public Customer: Create a payment session for an order or table session
 */
exports.createPaymentSession = async (req, res) => {
  try {
    const { orderId, sessionId, customerDetails, returnUrl, notifyUrl } = req.body;
    const session = await orderService.createPaymentSession({
      orderId,
      sessionId,
      customerDetails,
      returnUrl,
      notifyUrl
    });

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Public Customer: Verify and sync payment status by provider order ID
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await orderService.verifyAndSyncPayment(orderId);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: Get current payment account status and masked bank details
 */
exports.getAccountStatus = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const account = await accountService.getSafeAccount(restaurantId);
    res.json({
      success: true,
      data: account
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: Connect Cashfree Easy Split vendor account
 */
exports.connectAccount = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const {
      businessName,
      email,
      phone,
      bankAccount,
      ifsc,
      accountHolderName,
      businessType
    } = req.body;

    const account = await accountService.connectAccount({
      restaurantId,
      businessName,
      email,
      phone,
      bankAccount,
      ifsc,
      accountHolderName,
      businessType,
      actor: req.user
    });

    res.status(200).json({
      success: true,
      message: 'Cashfree vendor account connected successfully',
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: Disconnect online payments safely
 */
exports.disconnectAccount = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const { reason } = req.body;

    const account = await accountService.disconnectAccount({
      restaurantId,
      actor: req.user,
      reason
    });

    res.json({
      success: true,
      message: 'Online payments safely disconnected. Historical data preserved.',
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: Reconnect previously registered payment account
 */
exports.reconnectAccount = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const account = await accountService.reconnectAccount({
      restaurantId,
      actor: req.user
    });

    res.json({
      success: true,
      message: 'Online payments reconnected successfully',
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: Toggle online payments on/off
 */
exports.toggleOnlinePayment = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const { enabled } = req.body;

    const account = await accountService.toggleOnlinePayment({
      restaurantId,
      enabled,
      actor: req.user
    });

    res.json({
      success: true,
      message: `Online payments ${enabled ? 'enabled' : 'disabled'}`,
      data: account
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: List payment transactions for this restaurant
 */
exports.getTransactions = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    const payments = await Payment.find({ restaurant_id: restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: payments
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: List settlements for this restaurant
 */
exports.getSettlements = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const settlements = await SettlementService.getSettlements(restaurantId);
    res.json({
      success: true,
      data: settlements
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * Cafe Owner: Initiate full or partial refund
 */
exports.refundPayment = async (req, res) => {
  try {
    const restaurantId = req.user.cafeId;
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (String(payment.restaurant_id) !== String(restaurantId)) {
      return res.status(403).json({ success: false, message: 'Access denied: Payment belongs to another restaurant' });
    }

    const result = await refundService.processRefund({
      paymentId,
      refundAmount: amount,
      refundNote: reason,
      actor: req.user
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
