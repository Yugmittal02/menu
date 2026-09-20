const crypto = require('crypto');
const PaymentProvider = require('./PaymentProvider');

class CashfreePaymentProvider extends PaymentProvider {
  constructor(options = {}) {
    super();
    this.appId = options.appId || process.env.CASHFREE_APP_ID || '';
    this.secretKey = options.secretKey || process.env.CASHFREE_SECRET_KEY || '';
    this.environment = (options.environment || process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').toUpperCase();
    this.apiVersion = options.apiVersion || process.env.CASHFREE_API_VERSION || '2023-08-01';
    this.webhookSecret = options.webhookSecret || process.env.CASHFREE_WEBHOOK_SECRET || this.secretKey;
    this.isMockMode = !this.appId || this.appId.startsWith('mock_') || process.env.CASHFREE_MOCK_MODE === 'true';

    this.baseUrl = this.environment === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  getHeaders() {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': this.apiVersion,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async _request(endpoint, method = 'GET', body = null) {
    if (this.isMockMode) {
      return this._mockRequest(endpoint, method, body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Cashfree API error (${response.status})`);
        error.status = response.status;
        error.code = data.code || 'CASHFREE_ERROR';
        error.details = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      const error = new Error(`Cashfree Network Error: ${err.message}`);
      error.code = 'CASHFREE_NETWORK_ERROR';
      throw error;
    }
  }

  // Deterministic mock handler when credentials are not configured or in mock mode
  async _mockRequest(endpoint, method, body) {
    if (endpoint.startsWith('/easy-split/vendors') && method === 'POST') {
      return {
        vendor_id: body.vendor_id,
        status: 'ACTIVE',
        name: body.name,
        email: body.email,
        phone: body.phone,
        verify_account: false,
        bank_details: {
          account_number: body.bank_details?.account_number,
          account_holder: body.bank_details?.account_holder,
          ifsc: body.bank_details?.ifsc
        },
        settlement_status: 'ACTIVE',
        created_at: new Date().toISOString()
      };
    }

    if (endpoint.startsWith('/easy-split/vendors/') && method === 'GET') {
      const vendorId = endpoint.split('/')[3];
      return {
        vendor_id: vendorId,
        status: 'ACTIVE',
        settlement_status: 'ACTIVE',
        name: 'Mock Verified Vendor',
        email: 'vendor@krixov.local'
      };
    }

    if (endpoint === '/orders' && method === 'POST') {
      return {
        cf_order_id: Math.floor(10000000 + Math.random() * 90000000),
        order_id: body.order_id,
        order_status: 'ACTIVE',
        order_amount: body.order_amount,
        order_currency: body.order_currency || 'INR',
        payment_session_id: `session_mock_${body.order_id}_${Date.now()}`,
        order_splits: body.order_splits || []
      };
    }

    if (endpoint.startsWith('/orders/') && endpoint.endsWith('/payments') && method === 'GET') {
      return [{
        payment_id: `cf_pay_mock_${Date.now()}`,
        order_id: endpoint.split('/')[2],
        payment_status: 'SUCCESS',
        payment_amount: 100,
        payment_currency: 'INR',
        payment_message: 'Mock payment success',
        payment_time: new Date().toISOString(),
        payment_group: 'upi'
      }];
    }

    if (endpoint.startsWith('/orders/') && method === 'GET') {
      const orderId = endpoint.split('/')[2];
      return {
        order_id: orderId,
        order_status: 'PAID',
        order_amount: 100,
        order_currency: 'INR'
      };
    }

    if (endpoint.includes('/refunds') && method === 'POST') {
      return {
        cf_refund_id: `cf_ref_mock_${Date.now()}`,
        refund_id: body.refund_id,
        order_id: body.order_id || 'mock_order',
        refund_amount: body.refund_amount,
        refund_status: 'SUCCESS'
      };
    }

    return { success: true, message: 'Mock Cashfree Response' };
  }

  /**
   * Onboard vendor via Cashfree Easy Split
   */
  async createVendor(vendorData) {
    const payload = {
      vendor_id: vendorData.vendorId,
      status: 'ACTIVE',
      name: vendorData.name,
      email: vendorData.email,
      phone: vendorData.phone,
      verify_account: false,
      dashboard_access: false,
      schedule_option: 1,
      bank_details: {
        account_number: vendorData.bankAccount,
        account_holder: vendorData.accountHolderName,
        ifsc: vendorData.ifsc
      }
    };

    if (vendorData.kycDetails) {
      payload.kyc_details = vendorData.kycDetails;
    }

    return await this._request('/easy-split/vendors', 'POST', payload);
  }

  /**
   * Get vendor details
   */
  async getVendor(vendorId) {
    return await this._request(`/easy-split/vendors/${encodeURIComponent(vendorId)}`, 'GET');
  }

  /**
   * Update vendor details
   */
  async updateVendor(vendorId, updateData) {
    return await this._request(`/easy-split/vendors/${encodeURIComponent(vendorId)}`, 'PATCH', updateData);
  }

  /**
   * Get vendor status & settlement state
   */
  async getVendorStatus(vendorId) {
    const data = await this.getVendor(vendorId);
    return {
      vendorId: data.vendor_id,
      status: data.status,
      settlementStatus: data.settlement_status || (data.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
      raw: data
    };
  }

  /**
   * Disable vendor if supported
   */
  async disableVendorIfSupported(vendorId) {
    try {
      return await this._request(`/easy-split/vendors/${encodeURIComponent(vendorId)}`, 'PATCH', {
        status: 'INACTIVE'
      });
    } catch (err) {
      return { vendorId, disabled: false, error: err.message };
    }
  }

  /**
   * Create an Easy Split payment order
   */
  async createPaymentOrder({ orderId, amount, currency = 'INR', customer, orderMeta = {}, splits = [] }) {
    const payload = {
      order_id: orderId,
      order_amount: Number(amount), // in rupees (float/number)
      order_currency: currency,
      customer_details: {
        customer_id: customer.id || `cust_${orderId.slice(-8)}`,
        customer_phone: customer.phone || '9999999999',
        customer_name: customer.name || 'Guest Customer',
        customer_email: customer.email || 'guest@krixov.com'
      },
      order_meta: {
        return_url: orderMeta.returnUrl || null,
        notify_url: orderMeta.notifyUrl || null,
        payment_methods: orderMeta.paymentMethods || 'upi,cc,dc,nb'
      }
    };

    // Attach Easy Split vendor split directives
    if (splits && splits.length > 0) {
      payload.order_splits = splits.map(s => {
        const item = { vendor_id: s.vendorId };
        if (s.amount !== undefined) item.amount = Number(s.amount);
        if (s.percentage !== undefined) item.percentage = Number(s.percentage);
        return item;
      });
    }

    const response = await this._request('/orders', 'POST', payload);
    return {
      cfOrderId: response.cf_order_id,
      orderId: response.order_id,
      paymentSessionId: response.payment_session_id,
      orderStatus: response.order_status,
      raw: response
    };
  }

  /**
   * Get payment status and details
   */
  async getPaymentStatus(orderId) {
    const [orderRes, paymentsRes] = await Promise.allSettled([
      this._request(`/orders/${encodeURIComponent(orderId)}`, 'GET'),
      this._request(`/orders/${encodeURIComponent(orderId)}/payments`, 'GET')
    ]);

    const orderData = orderRes.status === 'fulfilled' ? orderRes.value : null;
    const paymentsList = paymentsRes.status === 'fulfilled' ? paymentsRes.value : [];

    // Find successful payment if any
    const successfulPayment = Array.isArray(paymentsList)
      ? paymentsList.find(p => p.payment_status === 'SUCCESS')
      : null;

    return {
      orderId,
      orderStatus: orderData?.order_status || 'UNKNOWN',
      isPaid: orderData?.order_status === 'PAID' || Boolean(successfulPayment),
      successfulPayment,
      allPayments: Array.isArray(paymentsList) ? paymentsList : [],
      rawOrder: orderData
    };
  }

  /**
   * Create refund with Easy Split handling
   */
  async createRefund({ orderId, refundId, refundAmount, refundNote = 'Order refund', splits = [] }) {
    const payload = {
      refund_id: refundId,
      refund_amount: Number(refundAmount),
      refund_note: refundNote
    };

    if (splits && splits.length > 0) {
      payload.refund_splits = splits.map(s => ({
        vendor_id: s.vendorId,
        amount: Number(s.amount)
      }));
    }

    return await this._request(`/orders/${encodeURIComponent(orderId)}/refunds`, 'POST', payload);
  }

  /**
   * Get refund status
   */
  async getRefundStatus(orderId, refundId) {
    return await this._request(`/orders/${encodeURIComponent(orderId)}/refunds/${encodeURIComponent(refundId)}`, 'GET');
  }

  /**
   * Verify Webhook Signature using HMAC-SHA256
   * Cashfree algorithm: HMAC-SHA256(timestamp + rawBody, webhookSecret)
   */
  verifyWebhookSignature(headers = {}, rawBody = '') {
    if (this.isMockMode && (!headers['x-webhook-signature'] && !headers['x-cf-signature'])) {
      // In mock mode without headers, return true for developer convenience
      return true;
    }

    const signature = headers['x-webhook-signature'] || headers['x-cf-signature'] || '';
    const timestamp = headers['x-webhook-timestamp'] || headers['x-cf-timestamp'] || '';

    if (!signature || !rawBody) {
      return false;
    }

    try {
      const payloadToSign = timestamp ? `${timestamp}${rawBody}` : rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payloadToSign)
        .digest('base64');

      const sigBuffer = Buffer.from(signature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (err) {
      return false;
    }
  }
}

module.exports = CashfreePaymentProvider;
