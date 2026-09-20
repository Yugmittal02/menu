const PaymentSplit = require('../../models/PaymentSplit');

class PaymentSplitService {
  /**
   * Compute vendor split and platform share in minor units (paise)
   */
  static calculateSplit(amountMinor, customBps = null) {
    const defaultBps = parseInt(process.env.PLATFORM_COMMISSION_BPS || '0', 10);
    const bps = customBps !== null ? customBps : defaultBps;

    const grossAmount = Math.max(0, Math.round(amountMinor));
    const krixovAmount = Math.max(0, Math.round((grossAmount * bps) / 10000));
    const vendorAmount = Math.max(0, grossAmount - krixovAmount);

    return {
      grossAmountMinor: grossAmount,
      vendorAmountMinor: vendorAmount,
      krixovAmountMinor: krixovAmount,
      commissionBps: bps
    };
  }

  /**
   * Persist split details for a confirmed transaction
   */
  static async recordSplit({
    restaurantId,
    paymentId,
    paymentAccountId,
    providerVendorId,
    grossAmountMinor,
    vendorAmountMinor,
    krixovAmountMinor,
    providerSplitReference = ''
  }) {
    // Check if split record already exists
    let split = await PaymentSplit.findOne({ payment_id: paymentId });
    if (split) {
      return split;
    }

    split = new PaymentSplit({
      restaurant_id: restaurantId,
      payment_id: paymentId,
      payment_account_id: paymentAccountId,
      provider_vendor_id: providerVendorId,
      gross_amount_minor: grossAmountMinor,
      vendor_amount_minor: vendorAmountMinor,
      krixov_amount_minor: krixovAmountMinor,
      provider_split_reference: providerSplitReference,
      status: 'ACTIVE'
    });

    return await split.save();
  }
}

module.exports = PaymentSplitService;
