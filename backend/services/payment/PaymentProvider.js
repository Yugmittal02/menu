/**
 * Abstract PaymentProvider Base Class
 * Defines the contract for payment gateway adapters in Krixov.
 */
class PaymentProvider {
  /**
   * Onboard a vendor/seller to the split payments account
   * @param {Object} vendorData
   * @returns {Promise<Object>}
   */
  async createVendor(vendorData) {
    throw new Error('createVendor() must be implemented by provider');
  }

  /**
   * Retrieve vendor details
   * @param {string} vendorId
   * @returns {Promise<Object>}
   */
  async getVendor(vendorId) {
    throw new Error('getVendor() must be implemented by provider');
  }

  /**
   * Update vendor details
   * @param {string} vendorId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateVendor(vendorId, updateData) {
    throw new Error('updateVendor() must be implemented by provider');
  }

  /**
   * Verify vendor settlement status
   * @param {string} vendorId
   * @returns {Promise<Object>}
   */
  async getVendorStatus(vendorId) {
    throw new Error('getVendorStatus() must be implemented by provider');
  }

  /**
   * Disable vendor on provider side
   * @param {string} vendorId
   * @returns {Promise<Object>}
   */
  async disableVendorIfSupported(vendorId) {
    throw new Error('disableVendorIfSupported() must be implemented by provider');
  }

  /**
   * Create an Easy Split payment order
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async createPaymentOrder(orderData) {
    throw new Error('createPaymentOrder() must be implemented by provider');
  }

  /**
   * Fetch order status and payment attempts
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async getPaymentStatus(orderId) {
    throw new Error('getPaymentStatus() must be implemented by provider');
  }

  /**
   * Initiate a refund for an order
   * @param {Object} refundData
   * @returns {Promise<Object>}
   */
  async createRefund(refundData) {
    throw new Error('createRefund() must be implemented by provider');
  }

  /**
   * Fetch status of a refund
   * @param {string} orderId
   * @param {string} refundId
   * @returns {Promise<Object>}
   */
  async getRefundStatus(orderId, refundId) {
    throw new Error('getRefundStatus() must be implemented by provider');
  }

  /**
   * Cryptographically verify an incoming webhook
   * @param {Object} headers
   * @param {string} rawBody
   * @returns {boolean}
   */
  verifyWebhookSignature(headers, rawBody) {
    throw new Error('verifyWebhookSignature() must be implemented by provider');
  }
}

module.exports = PaymentProvider;
