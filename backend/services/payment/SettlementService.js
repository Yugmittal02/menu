const Settlement = require('../../models/Settlement');
const PaymentAccount = require('../../models/PaymentAccount');
const PaymentAuditService = require('./PaymentAuditService');

class SettlementService {
  /**
   * Record or update a settlement received from Cashfree
   */
  static async recordSettlement({
    restaurantId,
    paymentAccountId,
    providerVendorId,
    providerSettlementId,
    amountMinor,
    status = 'SETTLED',
    settledAt = new Date(),
    failureReason = ''
  }) {
    let settlement = null;
    if (providerSettlementId) {
      settlement = await Settlement.findOne({ provider_settlement_id: providerSettlementId });
    }

    if (!settlement) {
      settlement = new Settlement({
        restaurant_id: restaurantId,
        payment_account_id: paymentAccountId,
        provider_vendor_id: providerVendorId,
        provider_settlement_id: providerSettlementId,
        amount_minor: Math.round(amountMinor),
        status,
        settled_at: settledAt,
        failure_reason: failureReason
      });
    } else {
      settlement.status = status;
      settlement.settled_at = settledAt;
      settlement.failure_reason = failureReason;
    }

    await settlement.save();

    await PaymentAuditService.log({
      actorType: 'SYSTEM',
      actorId: 'SETTLEMENT_SERVICE',
      restaurantId,
      action: `SETTLEMENT_${status}`,
      entityType: 'Settlement',
      entityId: settlement._id,
      newState: settlement.toObject(),
      metadata: { providerSettlementId, amountMinor }
    });

    return settlement;
  }

  /**
   * List settlements for a restaurant
   */
  static async getSettlements(restaurantId, limit = 50) {
    return await Settlement.find({ restaurant_id: restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = SettlementService;
