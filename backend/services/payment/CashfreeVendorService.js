const CashfreePaymentProvider = require('./CashfreePaymentProvider');

class CashfreeVendorService {
  constructor(provider = null) {
    this.provider = provider || new CashfreePaymentProvider();
  }

  /**
   * Onboard a vendor with Cashfree Easy Split
   */
  async createVendor({
    restaurantId,
    businessName,
    email,
    phone,
    bankAccount,
    ifsc,
    accountHolderName,
    businessType = 'INDIVIDUAL'
  }) {
    // Generate deterministic provider vendor ID prefixed by restaurant
    const sanitizedRestaurantId = String(restaurantId).replace(/[^a-zA-Z0-9]/g, '').slice(-12);
    const vendorId = `vnd_${sanitizedRestaurantId}_${Date.now().toString(36)}`;

    const vendorPayload = {
      vendorId,
      name: businessName,
      email,
      phone,
      bankAccount,
      ifsc: (ifsc || '').toUpperCase().trim(),
      accountHolderName,
      businessType
    };

    const result = await this.provider.createVendor(vendorPayload);
    return {
      vendorId,
      providerResult: result
    };
  }

  /**
   * Fetch current vendor status from Cashfree
   */
  async getVendorStatus(vendorId) {
    return await this.provider.getVendorStatus(vendorId);
  }

  /**
   * Request vendor disable / deactivation
   */
  async disableVendor(vendorId) {
    return await this.provider.disableVendorIfSupported(vendorId);
  }
}

module.exports = CashfreeVendorService;
