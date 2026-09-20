const Payment = require('../../models/Payment');
const TableOrder = require('../../models/TableOrder');
const TableSession = require('../../models/TableSession');
const CashfreePaymentProvider = require('./CashfreePaymentProvider');
const PaymentAuditService = require('./PaymentAuditService');

class RefundService {
  constructor(provider = null) {
    this.provider = provider || new CashfreePaymentProvider();
  }

  /**
   * Initiate a refund for an existing successful payment
   */
  async processRefund({
    paymentId,
    refundAmount = null,
    refundNote = 'Customer refund',
    actor = {}
  }) {
    const PaymentSplit = require('../../models/PaymentSplit');

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');

    if (payment.status !== 'SUCCESS' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    const currentRefundedMinor = payment.refunded_amount_minor || 0;
    const remainingRefundableMinor = payment.amount_minor - currentRefundedMinor;

    if (remainingRefundableMinor <= 0) {
      throw new Error('This payment has already been fully refunded');
    }

    const requestedMinor = refundAmount !== null ? Math.round(refundAmount * 100) : remainingRefundableMinor;

    if (requestedMinor <= 0 || requestedMinor > remainingRefundableMinor) {
      throw new Error(`Invalid refund amount. Maximum refundable amount is ₹${(remainingRefundableMinor / 100).toFixed(2)}`);
    }

    const refundAmountRupees = (requestedMinor / 100).toFixed(2);
    const refundId = `ref_${payment.provider_order_id.slice(-8)}_${Date.now().toString(36)}`;

    // Calculate vendor split deduction proportionally
    const split = await PaymentSplit.findOne({ payment_id: payment._id });
    let vendorRefundRupees = refundAmountRupees;
    if (split && split.gross_amount_minor > 0) {
      const vendorRatio = split.vendor_amount_minor / split.gross_amount_minor;
      const vendorRefundMinor = Math.round(requestedMinor * vendorRatio);
      vendorRefundRupees = (vendorRefundMinor / 100).toFixed(2);
    }

    const splits = [{
      vendorId: payment.provider_vendor_id,
      amount: vendorRefundRupees
    }];

    // Call Cashfree provider refund API with vendor split allocation
    const cfRefund = await this.provider.createRefund({
      orderId: payment.provider_order_id,
      refundId,
      refundAmount: refundAmountRupees,
      refundNote,
      splits
    });

    const newRefundedTotal = currentRefundedMinor + requestedMinor;
    const isFullRefund = newRefundedTotal >= payment.amount_minor;
    payment.refunded_amount_minor = newRefundedTotal;
    payment.status = isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    await payment.save();

    // Update order or session if full refund
    if (isFullRefund) {
      if (payment.order_id) {
        await TableOrder.findByIdAndUpdate(payment.order_id, {
          $set: { paymentStatus: 'refunded' }
        });
      }
      if (payment.session_id) {
        await TableSession.findByIdAndUpdate(payment.session_id, {
          $set: { paymentStatus: 'refunded' }
        });
      }
    }

    await PaymentAuditService.log({
      actorType: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'CAFE_OWNER',
      actorId: actor.id || actor._id || 'SYSTEM',
      actorEmail: actor.email || '',
      restaurantId: payment.restaurant_id,
      action: isFullRefund ? 'PAYMENT_REFUNDED' : 'PAYMENT_PARTIALLY_REFUNDED',
      entityType: 'Payment',
      entityId: payment._id,
      newState: payment.toObject(),
      metadata: {
        refundId,
        refundAmountRupees,
        isFullRefund,
        cfRefund
      }
    });

    return {
      paymentId: payment._id,
      status: payment.status,
      refundId,
      refundAmount: parseFloat(refundAmountRupees)
    };
  }
}

module.exports = RefundService;
