const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = require('../server');

const Cafe = require('../models/Cafe');
const TableOrder = require('../models/TableOrder');
const TableSession = require('../models/TableSession');
const PaymentAccount = require('../models/PaymentAccount');
const Payment = require('../models/Payment');
const PaymentSplit = require('../models/PaymentSplit');
const WebhookEvent = require('../models/WebhookEvent');

describe('Cashfree Easy Split Multi-Tenant Payments Test Suite', () => {
  let cafeA, cafeB;
  let tokenA, tokenB;
  let accountA, accountB;
  let orderA, sessionA;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
  const WEBHOOK_SECRET = 'test_webhook_secret_key_123';

  beforeAll(async () => {
    process.env.CASHFREE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    process.env.CASHFREE_MOCK_MODE = 'true';

    // Wait for DB ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('connected', resolve);
        setTimeout(resolve, 5000);
      });
    }

    // Create Cafe A
    cafeA = await Cafe.findOneAndUpdate(
      { cafeId: 'CAFE-PAY-A' },
      {
        cafeId: 'CAFE-PAY-A',
        name: 'Cafe Alpha Payments',
        ownerName: 'Alice Alpha',
        phone: '+91 91111 22222',
        email: 'alice@alpha.local',
        isActive: true,
        taxPercent: 5,
        orderingConfig: { allowOnlinePayment: true }
      },
      { upsert: true, new: true }
    );

    // Create Cafe B
    cafeB = await Cafe.findOneAndUpdate(
      { cafeId: 'CAFE-PAY-B' },
      {
        cafeId: 'CAFE-PAY-B',
        name: 'Cafe Beta Payments',
        ownerName: 'Bob Beta',
        phone: '+91 93333 44444',
        email: 'bob@beta.local',
        isActive: true,
        taxPercent: 5,
        orderingConfig: { allowOnlinePayment: true }
      },
      { upsert: true, new: true }
    );

    tokenA = jwt.sign({ id: 'owner_a', email: 'alice@alpha.local', role: 'cafeowner', cafeId: cafeA._id }, JWT_SECRET);
    tokenB = jwt.sign({ id: 'owner_b', email: 'bob@beta.local', role: 'cafeowner', cafeId: cafeB._id }, JWT_SECRET);

    // Clean any prior payment test accounts
    await PaymentAccount.deleteMany({ restaurant_id: { $in: [cafeA._id, cafeB._id] } });
    await Payment.deleteMany({ restaurant_id: { $in: [cafeA._id, cafeB._id] } });
    await WebhookEvent.deleteMany({});
  });

  afterAll(async () => {
    await PaymentAccount.deleteMany({ restaurant_id: { $in: [cafeA._id, cafeB._id] } });
    await Payment.deleteMany({ restaurant_id: { $in: [cafeA._id, cafeB._id] } });
    await WebhookEvent.deleteMany({});
  });

  // ============================================================
  // TEST 1: Connect Payment Account & Multi-tenant Mapping
  // ============================================================
  describe('1. Payment Account Onboarding & Tenant Mapping', () => {
    it('should connect Cafe A to Cashfree with masked details', async () => {
      const res = await request(app)
        .post('/api/payments/connect')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          businessName: 'Cafe Alpha Roasters',
          accountHolderName: 'Alice Alpha',
          bankAccount: '123456789012',
          ifsc: 'HDFC0001234',
          phone: '9111122222',
          email: 'alice@alpha.local',
          businessType: 'INDIVIDUAL'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.connection_status).toBe('CONNECTED');
      expect(res.body.data.verification_status).toBe('VERIFIED');
      expect(res.body.data.online_payment_enabled).toBe(true);
      expect(res.body.data.masked_account_last4).toBe('9012');
      expect(res.body.data.provider_vendor_id).toBeDefined();

      accountA = res.body.data;
    });

    it('should prevent Cafe B from seeing Cafe A payment account', async () => {
      const res = await request(app)
        .get('/api/payments/account')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should reject invalid IFSC code format during onboarding', async () => {
      const res = await request(app)
        .post('/api/payments/connect')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          businessName: 'Cafe Beta',
          accountHolderName: 'Bob Beta',
          bankAccount: '987654321098',
          ifsc: 'INVALID_IFSC',
          phone: '9333344444'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('IFSC');
    });

    it('should connect Cafe B to Cashfree', async () => {
      const res = await request(app)
        .post('/api/payments/connect')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          businessName: 'Cafe Beta Treats',
          accountHolderName: 'Bob Beta',
          bankAccount: '987654321098',
          ifsc: 'ICIC0005678',
          phone: '9333344444',
          email: 'bob@beta.local',
          businessType: 'INDIVIDUAL'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.provider_vendor_id).toBeDefined();
      expect(res.body.data.provider_vendor_id).not.toBe(accountA.provider_vendor_id);

      accountB = res.body.data;
    });
  });

  // ============================================================
  // TEST 2: Wrong Vendor Protection & Server-Authoritative Split
  // ============================================================
  describe('2. Wrong Vendor Protection & Payment Session Creation', () => {
    it('should create order and checkout session for Cafe A with correct vendor ID', async () => {
      // Create test order for Cafe A
      orderA = await TableOrder.create({
        cafe: cafeA._id,
        orderNumber: `ORD-TEST-${Date.now()}`,
        items: [{ name: 'Espresso', price: 200, quantity: 2, itemTotal: 400 }],
        subtotal: 400,
        taxAmount: 20,
        grandTotal: 420,
        status: 'served',
        paymentStatus: 'unpaid'
      });

      // Even if client maliciously attempts to pass Vendor B or altered amounts
      const res = await request(app)
        .post('/api/payments/create-session')
        .send({
          orderId: orderA._id,
          spoofedVendorId: accountB.provider_vendor_id,
          spoofedAmount: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentSessionId).toBeDefined();
      expect(res.body.data.amount).toBe(420);

      // Verify the saved internal payment record routes strictly to Vendor A
      const payment = await Payment.findById(res.body.data.paymentId);
      expect(payment.provider_vendor_id).toBe(accountA.provider_vendor_id);
      expect(payment.amount_minor).toBe(42000); // 420.00 in minor paise
      expect(payment.status).toBe('PENDING');
    });

    it('should reject payment creation for an order that is already paid', async () => {
      const paidOrder = await TableOrder.create({
        cafe: cafeA._id,
        orderNumber: `ORD-PAID-${Date.now()}`,
        items: [{ name: 'Cold Brew', price: 150, quantity: 1, itemTotal: 150 }],
        subtotal: 150,
        taxAmount: 7.5,
        grandTotal: 157.5,
        status: 'completed',
        paymentStatus: 'paid'
      });

      const res = await request(app)
        .post('/api/payments/create-session')
        .send({ orderId: paidOrder._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already been paid');
    });
  });

  // ============================================================
  // TEST 3: Webhook Verification & Deduplication
  // ============================================================
  describe('3. Webhook Signature Verification & Idempotency', () => {
    let testPayment;

    beforeEach(async () => {
      const uniqueSuffix = Date.now().toString(36);
      testPayment = await Payment.create({
        restaurant_id: cafeA._id,
        payment_account_id: accountA._id,
        order_id: orderA._id,
        provider: 'CASHFREE',
        provider_order_id: `cf_test_${uniqueSuffix}`,
        provider_vendor_id: accountA.provider_vendor_id,
        amount_minor: 42000,
        status: 'PENDING',
        idempotency_key: `idem_test_${uniqueSuffix}`
      });
    });

    it('should reject webhook with invalid signature', async () => {
      const rawPayload = JSON.stringify({
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        data: {
          order: { order_id: testPayment.provider_order_id },
          payment: {
            cf_payment_id: 'cf_pay_123456',
            payment_status: 'SUCCESS',
            payment_amount: 420,
            payment_group: 'upi'
          }
        }
      });

      const res = await request(app)
        .post('/api/webhooks/cashfree')
        .set('Content-Type', 'application/json')
        .set('x-webhook-signature', 'INVALID_SIGNATURE_HASH')
        .set('x-webhook-timestamp', String(Date.now()))
        .send(rawPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should verify valid HMAC-SHA256 signature and update payment to SUCCESS', async () => {
      const timestamp = String(Date.now());
      const rawPayload = JSON.stringify({
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        data: {
          order: { order_id: testPayment.provider_order_id },
          payment: {
            cf_payment_id: 'cf_pay_verified_999',
            payment_status: 'SUCCESS',
            payment_amount: 420,
            payment_group: 'upi',
            payment_time: new Date().toISOString()
          }
        }
      });

      const validSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(`${timestamp}${rawPayload}`)
        .digest('base64');

      const res = await request(app)
        .post('/api/webhooks/cashfree')
        .set('Content-Type', 'application/json')
        .set('x-webhook-signature', validSignature)
        .set('x-webhook-timestamp', timestamp)
        .send(rawPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify payment transitioned to SUCCESS
      const updatedPayment = await Payment.findById(testPayment._id);
      expect(updatedPayment.status).toBe('SUCCESS');
      expect(updatedPayment.verification_status).toBe('WEBHOOK_VERIFIED');
      expect(updatedPayment.provider_payment_id).toBe('cf_pay_verified_999');

      // Verify associated TableOrder was marked paid
      const updatedOrder = await TableOrder.findById(orderA._id);
      expect(updatedOrder.paymentStatus).toBe('paid');

      // Verify PaymentSplit record created
      const split = await PaymentSplit.findOne({ payment_id: testPayment._id });
      expect(split).toBeDefined();
      expect(split.gross_amount_minor).toBe(42000);
      expect(split.vendor_amount_minor).toBeGreaterThan(0);
    });

    it('should deduplicate replayed webhook deliveries idempotently', async () => {
      const timestamp = String(Date.now());
      const rawPayload = JSON.stringify({
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        data: {
          order: { order_id: testPayment.provider_order_id },
          payment: {
            cf_payment_id: 'cf_pay_duplicate_check',
            payment_status: 'SUCCESS',
            payment_amount: 420,
            payment_group: 'upi'
          }
        }
      });

      const validSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(`${timestamp}${rawPayload}`)
        .digest('base64');

      // Delivery 1
      const res1 = await request(app)
        .post('/api/webhooks/cashfree')
        .set('Content-Type', 'application/json')
        .set('x-webhook-signature', validSignature)
        .set('x-webhook-timestamp', timestamp)
        .send(rawPayload);
      expect(res1.status).toBe(200);

      // Delivery 2 (Replay)
      const res2 = await request(app)
        .post('/api/webhooks/cashfree')
        .set('Content-Type', 'application/json')
        .set('x-webhook-signature', validSignature)
        .set('x-webhook-timestamp', timestamp)
        .send(rawPayload);

      expect(res2.status).toBe(200);
      expect(res2.body.message).toContain('Duplicate');
    });
  });

  // ============================================================
  // TEST 4: Safe Disconnect and Reconnect Invariants
  // ============================================================
  describe('4. Safe Disconnect & Reconnect Lifecycle', () => {
    it('should safely disconnect online payments without corrupting existing payments', async () => {
      const res = await request(app)
        .post('/api/payments/disconnect')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ reason: 'Owner maintenance test' });

      expect(res.status).toBe(200);
      expect(res.body.data.connection_status).toBe('DISCONNECTED');
      expect(res.body.data.online_payment_enabled).toBe(false);

      // Verify cafe orderingConfig flag
      const updatedCafe = await Cafe.findById(cafeA._id);
      expect(updatedCafe.orderingConfig.allowOnlinePayment).toBe(false);

      // Verify prior payment records for Cafe A still exist and are intact
      const count = await Payment.countDocuments({ restaurant_id: cafeA._id });
      expect(count).toBeGreaterThan(0);
    });

    it('should reject new online payment creation while disconnected', async () => {
      const newOrder = await TableOrder.create({
        cafe: cafeA._id,
        orderNumber: `ORD-BLOCKED-${Date.now()}`,
        items: [{ name: 'Brownie', price: 120, quantity: 1, itemTotal: 120 }],
        subtotal: 120,
        grandTotal: 120,
        status: 'served',
        paymentStatus: 'unpaid'
      });

      const res = await request(app)
        .post('/api/payments/create-session')
        .send({ orderId: newOrder._id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('disabled or disconnected');
    });

    it('should safely reconnect verified vendor account and restore online payments', async () => {
      const res = await request(app)
        .post('/api/payments/reconnect')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.connection_status).toBe('CONNECTED');
      expect(res.body.data.online_payment_enabled).toBe(true);

      const updatedCafe = await Cafe.findById(cafeA._id);
      expect(updatedCafe.orderingConfig.allowOnlinePayment).toBe(true);
    });
  });
});
