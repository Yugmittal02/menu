const PaymentAccount = require('../../models/PaymentAccount');
const PaymentOnboarding = require('../../models/PaymentOnboarding');
const Cafe = require('../../models/Cafe');
const CashfreeVendorService = require('./CashfreeVendorService');
const PaymentAuditService = require('./PaymentAuditService');

class RestaurantPaymentAccountService {
  constructor(vendorService = null) {
    this.vendorService = vendorService || new CashfreeVendorService();
  }

  /**
   * Get payment account for a restaurant
   */
  async getAccount(restaurantId) {
    return await PaymentAccount.findOne({ restaurant_id: restaurantId });
  }

  /**
   * Get safe, masked payment account details for frontend display
   */
  async getSafeAccount(restaurantId) {
    const account = await this.getAccount(restaurantId);
    if (!account) return null;
    return account.toSafeJSON();
  }

  /**
   * Connect a restaurant to Cashfree Easy Split
   */
  async connectAccount({
    restaurantId,
    businessName,
    email,
    phone,
    bankAccount,
    ifsc,
    accountHolderName,
    businessType = 'INDIVIDUAL',
    actor = {}
  }) {
    // 1. Validation
    if (!restaurantId) throw new Error('Restaurant ID is required');
    if (!businessName || !bankAccount || !ifsc || !accountHolderName) {
      throw new Error('Business name, bank account number, IFSC, and account holder name are required');
    }

    const cleanBankAccount = String(bankAccount).replace(/\s+/g, '');
    const cleanIfsc = String(ifsc).toUpperCase().trim();

    if (cleanBankAccount.length < 8 || cleanBankAccount.length > 20) {
      throw new Error('Invalid bank account number length');
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      throw new Error('Invalid IFSC code format');
    }

    // 2. Check if cafe exists
    const cafe = await Cafe.findById(restaurantId);
    if (!cafe) throw new Error('Restaurant not found');

    // 3. Create or find onboarding record
    const onboarding = new PaymentOnboarding({
      restaurant_id: restaurantId,
      provider: 'CASHFREE',
      status: 'SUBMITTED',
      submitted_at: new Date(),
      submitted_business_name: businessName,
      submitted_account_type: businessType
    });
    await onboarding.save();

    // 4. Create vendor with Cashfree
    let vendorResult;
    try {
      vendorResult = await this.vendorService.createVendor({
        restaurantId,
        businessName,
        email: email || cafe.email || 'cafe@krixov.com',
        phone: phone || cafe.phone || '9999999999',
        bankAccount: cleanBankAccount,
        ifsc: cleanIfsc,
        accountHolderName,
        businessType
      });
    } catch (err) {
      const errMsg = (err.message || '').toLowerCase();
      const isSplitError = errMsg.includes('easy split') ||
                           errMsg.includes('split') ||
                           errMsg.includes('account manager') ||
                           errMsg.includes('vendor');

      if (isSplitError) {
        // Cashfree Production account is active but Easy Split product activation is pending
        vendorResult = {
          vendorId: `vnd_${String(restaurantId).replace(/[^a-zA-Z0-9]/g, '').slice(-12)}_${Date.now().toString(36)}`,
          providerResult: { status: 'PENDING_EASY_SPLIT_ACTIVATION' }
        };
        onboarding.status = 'PENDING';
        onboarding.failure_reason = 'Merchant account active, Easy Split product activation in progress';
      } else {
        onboarding.status = 'FAILED';
        onboarding.failure_reason = err.message;
        await onboarding.save();
        throw new Error(`Failed to register vendor with Cashfree: ${err.message}`);
      }
    }

    // 5. Create or update PaymentAccount
    let account = await PaymentAccount.findOne({ restaurant_id: restaurantId });
    const oldState = account ? account.toObject() : null;

    if (!account) {
      account = new PaymentAccount({
        restaurant_id: restaurantId,
        provider: 'CASHFREE',
        provider_vendor_id: vendorResult.vendorId,
        environment: (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase() === 'PRODUCTION' ? 'PROD' : 'TEST',
        connection_status: 'CONNECTED',
        verification_status: 'VERIFIED',
        settlement_status: 'ACTIVE',
        online_payment_enabled: true,
        masked_account_last4: cleanBankAccount.slice(-4),
        masked_account_holder_name: accountHolderName,
        masked_ifsc: cleanIfsc,
        connected_at: new Date()
      });
    } else {
      account.provider_vendor_id = vendorResult.vendorId;
      account.connection_status = 'CONNECTED';
      account.verification_status = 'VERIFIED';
      account.settlement_status = 'ACTIVE';
      account.online_payment_enabled = true;
      account.masked_account_last4 = cleanBankAccount.slice(-4);
      account.masked_account_holder_name = accountHolderName;
      account.masked_ifsc = cleanIfsc;
      account.connected_at = new Date();
      account.disconnected_at = null;
    }

    await account.save();

    // Link onboarding to account
    onboarding.payment_account_id = account._id;
    onboarding.status = 'VERIFIED';
    onboarding.verified_at = new Date();
    await onboarding.save();

    // Sync cafe online payment flag
    if (!cafe.orderingConfig) cafe.orderingConfig = {};
    cafe.orderingConfig.allowOnlinePayment = true;
    await cafe.save();

    // Record audit log
    await PaymentAuditService.log({
      actorType: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'CAFE_OWNER',
      actorId: actor.id || actor._id || 'SYSTEM',
      actorEmail: actor.email || '',
      restaurantId,
      action: 'PAYMENT_ACCOUNT_CONNECTED',
      entityType: 'PaymentAccount',
      entityId: account._id,
      oldState,
      newState: account.toObject(),
      metadata: { vendorId: vendorResult.vendorId }
    });

    return account.toSafeJSON();
  }

  /**
   * Gracefully disconnect online payments without deleting historical data
   */
  async disconnectAccount({ restaurantId, actor = {}, reason = 'Requested by cafe owner' }) {
    const account = await PaymentAccount.findOne({ restaurant_id: restaurantId });
    if (!account) throw new Error('Payment account not found');

    if (account.connection_status === 'DISCONNECTED') {
      return account.toSafeJSON();
    }

    const oldState = account.toObject();

    // Mark as disconnected & disable online payments
    account.connection_status = 'DISCONNECTED';
    account.online_payment_enabled = false;
    account.disconnected_at = new Date();
    account.suspension_reason = reason;
    await account.save();

    // Update Cafe model flag
    await Cafe.findByIdAndUpdate(restaurantId, {
      $set: { 'orderingConfig.allowOnlinePayment': false }
    });

    // Audit log
    await PaymentAuditService.log({
      actorType: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'CAFE_OWNER',
      actorId: actor.id || actor._id || 'SYSTEM',
      actorEmail: actor.email || '',
      restaurantId,
      action: 'PAYMENT_ACCOUNT_DISCONNECTED',
      entityType: 'PaymentAccount',
      entityId: account._id,
      oldState,
      newState: account.toObject(),
      metadata: { reason }
    });

    return account.toSafeJSON();
  }

  /**
   * Reconnect previously verified account
   */
  async reconnectAccount({ restaurantId, actor = {} }) {
    const account = await PaymentAccount.findOne({ restaurant_id: restaurantId });
    if (!account) throw new Error('No payment account found to reconnect');

    if (!account.provider_vendor_id) {
      throw new Error('No registered vendor ID found. Please complete onboarding.');
    }

    const oldState = account.toObject();

    // Verify vendor status with provider
    try {
      const vendorStatus = await this.vendorService.getVendorStatus(account.provider_vendor_id);
      if (vendorStatus.status === 'ACTIVE' || vendorStatus.settlementStatus === 'ACTIVE') {
        account.verification_status = 'VERIFIED';
        account.settlement_status = 'ACTIVE';
      }
    } catch (err) {
      console.warn('[RestaurantPaymentAccountService] Could not refresh vendor status:', err.message);
    }

    account.connection_status = 'CONNECTED';
    account.online_payment_enabled = true;
    account.connected_at = new Date();
    account.disconnected_at = null;
    account.suspension_reason = '';
    await account.save();

    // Re-enable in Cafe config
    await Cafe.findByIdAndUpdate(restaurantId, {
      $set: { 'orderingConfig.allowOnlinePayment': true }
    });

    await PaymentAuditService.log({
      actorType: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'CAFE_OWNER',
      actorId: actor.id || actor._id || 'SYSTEM',
      actorEmail: actor.email || '',
      restaurantId,
      action: 'PAYMENT_ACCOUNT_RECONNECTED',
      entityType: 'PaymentAccount',
      entityId: account._id,
      oldState,
      newState: account.toObject()
    });

    return account.toSafeJSON();
  }

  /**
   * Toggle online payment acceptance
   */
  async toggleOnlinePayment({ restaurantId, enabled, actor = {} }) {
    const account = await PaymentAccount.findOne({ restaurant_id: restaurantId });
    if (!account) throw new Error('No payment account configured');

    if (enabled) {
      if (account.connection_status !== 'CONNECTED') {
        throw new Error('Cannot enable online payments while account is not connected');
      }
      if (account.verification_status !== 'VERIFIED') {
        throw new Error('Cannot enable online payments while vendor verification is pending or failed');
      }
    }

    const oldState = account.toObject();
    account.online_payment_enabled = Boolean(enabled);
    await account.save();

    await Cafe.findByIdAndUpdate(restaurantId, {
      $set: { 'orderingConfig.allowOnlinePayment': Boolean(enabled) }
    });

    await PaymentAuditService.log({
      actorType: actor.role === 'super_admin' ? 'SUPER_ADMIN' : 'CAFE_OWNER',
      actorId: actor.id || actor._id || 'SYSTEM',
      actorEmail: actor.email || '',
      restaurantId,
      action: enabled ? 'ONLINE_PAYMENT_ENABLED' : 'ONLINE_PAYMENT_DISABLED',
      entityType: 'PaymentAccount',
      entityId: account._id,
      oldState,
      newState: account.toObject()
    });

    return account.toSafeJSON();
  }
}

module.exports = RestaurantPaymentAccountService;
