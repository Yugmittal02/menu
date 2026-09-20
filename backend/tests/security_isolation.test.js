const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');

const Cafe = require('../models/Cafe');
const TableOrder = require('../models/TableOrder');
const TableSession = require('../models/TableSession');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');
const Staff = require('../models/Staff');
const Customer = require('../models/Customer');
const Coupon = require('../models/Coupon');

describe('Database Security & Multi-Tenant Data Isolation Test Suite', () => {
  let cafeA, cafeB;
  let tokenA, tokenB;
  let bItem, bOrder, bSession, bReservation, bStaff, bCustomer, bCoupon;

  beforeAll(async () => {
    // Wait for DB connection to become ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('connected', resolve);
        setTimeout(resolve, 6000);
      });
    }

    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

    // 1. Create Tenant A
    cafeA = await Cafe.findOneAndUpdate(
      { cafeId: 'CAFE-TENANT-A' },
      {
        cafeId: 'CAFE-TENANT-A',
        name: 'Cafe Alpha (Tenant A)',
        ownerName: 'Alice Alpha',
        phone: '+91 91111 11111',
        tableCount: 10,
        isActive: true,
        taxPercent: 5,
        taxLabel: 'GST'
      },
      { upsert: true, new: true }
    );

    // 2. Create Tenant B
    cafeB = await Cafe.findOneAndUpdate(
      { cafeId: 'CAFE-TENANT-B' },
      {
        cafeId: 'CAFE-TENANT-B',
        name: 'Cafe Beta (Tenant B)',
        ownerName: 'Bob Beta',
        phone: '+91 92222 22222',
        tableCount: 10,
        isActive: true,
        taxPercent: 5,
        taxLabel: 'GST'
      },
      { upsert: true, new: true }
    );

    // Tokens for each tenant
    tokenA = jwt.sign(
      { cafeId: cafeA._id, cafeCode: cafeA.cafeId, role: 'cafeowner' },
      secret,
      { expiresIn: '1h' }
    );

    tokenB = jwt.sign(
      { cafeId: cafeB._id, cafeCode: cafeB.cafeId, role: 'cafeowner' },
      secret,
      { expiresIn: '1h' }
    );

    // Seed resources under Tenant B
    bItem = await MenuItem.create({
      cafe: cafeB._id,
      name: 'Beta Secret Truffle Pizza',
      price: 650,
      category: 'Pizza',
      trackStock: true,
      stockQuantity: 15,
      lowStockThreshold: 3,
      isAvailable: true
    });

    bSession = await TableSession.create({
      cafe: cafeB._id,
      tableNumber: 3,
      sessionCode: 'SES-T3-BETA',
      customerName: 'Beta VIP Guest',
      customerPhone: '9888877777',
      status: 'active',
      orders: []
    });

    bOrder = await TableOrder.create({
      cafe: cafeB._id,
      orderNumber: 'ORD-BETA-001',
      kotNumber: 'KOT-BETA-101',
      tableNumber: 3,
      customerName: 'Beta VIP Guest',
      customerPhone: '9888877777',
      items: [{ name: 'Beta Secret Truffle Pizza', price: 650, quantity: 1 }],
      subtotal: 650,
      totalAmount: 682,
      grandTotal: 682,
      taxAmount: 32,
      status: 'pending',
      paymentStatus: 'unpaid',
      orderSource: 'counter',
      orderType: 'dine-in',
      sessionId: bSession._id
    });

    bSession.orders.push(bOrder._id);
    await bSession.save();

    bReservation = await Reservation.create({
      cafe: cafeB._id,
      customerName: 'Beta Reserved Guest',
      customerPhone: '9888866666',
      pax: 4,
      reservationDate: new Date(),
      timeSlot: '20:00',
      status: 'confirmed',
      tableNumber: 4
    });

    bStaff = await Staff.create({
      cafe: cafeB._id,
      name: 'Beta Waiter 1',
      phone: '9888855555',
      role: 'waiter',
      pin: '5555',
      permissions: ['pos_order', 'view_orders']
    });

    bCustomer = await Customer.create({
      cafe: cafeB._id,
      name: 'Beta Customer Loyal',
      phone: '9888844444',
      totalSpend: 5400,
      totalOrders: 6,
      tags: ['VIP']
    });

    bCoupon = await Coupon.create({
      cafe: cafeB._id,
      code: 'BETA50OFF',
      type: 'percentage',
      value: 50,
      minOrder: 500,
      isActive: true
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (cafeA && cafeB) {
      await MenuItem.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await TableOrder.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await TableSession.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await Reservation.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await Staff.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await Customer.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await Coupon.deleteMany({ cafe: { $in: [cafeA._id, cafeB._id] } });
      await Cafe.deleteMany({ _id: { $in: [cafeA._id, cafeB._id] } });
    }
  });

  // =========================================================================
  // ATTACK VECTOR 1: Order List Isolation
  // =========================================================================
  it('Attack 1: Cafe A attempts to read Cafe B orders via order listing', async () => {
    const res = await request(app)
      .get('/api/orders/cafe')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Cafe A must see ZERO orders belonging to Cafe B
    const leakedOrders = res.body.filter(o => String(o.cafe) === String(cafeB._id) || o.orderNumber === 'ORD-BETA-001');
    expect(leakedOrders.length).toBe(0);
  });

  // =========================================================================
  // ATTACK VECTOR 2: Public Order Tracking Phone Masking
  // =========================================================================
  it('Attack 2: Public trackOrder masks sensitive customer phone numbers', async () => {
    const res = await request(app)
      .get(`/api/orders/track/${bOrder.orderNumber}`);

    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe(bOrder.orderNumber);
    // Sensitive phone number must be masked (e.g. '******7777')
    expect(res.body.customerPhone).not.toBe('9888877777');
    expect(res.body.customerPhone).toMatch(/\*{4,}/);
  });

  // =========================================================================
  // ATTACK VECTOR 3: Order Status Modification Cross-Tenant
  // =========================================================================
  it('Attack 3: Cafe A attempts to update Cafe B order status', async () => {
    const res = await request(app)
      .put(`/api/orders/${bOrder._id}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'completed' });

    // Must be rejected with 404 (or 403) with no modification
    expect([404, 403]).toContain(res.status);

    // Verify in database that Cafe B order was NOT modified
    const refreshedOrder = await TableOrder.findById(bOrder._id);
    expect(refreshedOrder.status).toBe('pending');
  });

  // =========================================================================
  // ATTACK VECTOR 4: Cross-Tenant Payment Settlement
  // =========================================================================
  it('Attack 4: Cafe A attempts to mark Cafe B order as paid', async () => {
    const res = await request(app)
      .patch(`/api/orders/${bOrder._id}/payment`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ paymentMethod: 'cash' });

    expect([404, 403]).toContain(res.status);

    const refreshedOrder = await TableOrder.findById(bOrder._id);
    expect(refreshedOrder.paymentStatus).toBe('unpaid');
  });

  // =========================================================================
  // ATTACK VECTOR 5: Active Sessions Scoping
  // =========================================================================
  it('Attack 5: Cafe A attempts to read Cafe B active table sessions', async () => {
    const res = await request(app)
      .get('/api/sessions/active')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    const leakedSessions = res.body.filter(s => String(s.cafe) === String(cafeB._id) || s.sessionCode === 'SES-T3-BETA');
    expect(leakedSessions.length).toBe(0);
  });

  // =========================================================================
  // ATTACK VECTOR 6: Session Detail and Settlement Protection
  // =========================================================================
  it('Attack 6: Cafe A attempts to read or close Cafe B table session', async () => {
    // 6a: Read attempt
    const readRes = await request(app)
      .get(`/api/sessions/${bSession._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(readRes.status);

    // 6b: Close session attempt
    const closeRes = await request(app)
      .patch(`/api/sessions/${bSession._id}/close`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ paymentMethod: 'cash' });

    expect([404, 403]).toContain(closeRes.status);

    const refreshedSession = await TableSession.findById(bSession._id);
    expect(refreshedSession.status).toBe('active');
    expect(refreshedSession.paymentStatus).toBe('unpaid');
  });

  // =========================================================================
  // ATTACK VECTOR 7: Menu Item Tampering & Deletion Protection
  // =========================================================================
  it('Attack 7: Cafe A attempts to modify or delete Cafe B menu item', async () => {
    // 7a: Update attempt
    const updateRes = await request(app)
      .put(`/api/menu/${bItem._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Hacked Pizza', price: 10 });

    expect([404, 403]).toContain(updateRes.status);

    // 7b: Delete attempt
    const deleteRes = await request(app)
      .delete(`/api/menu/${bItem._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(deleteRes.status);

    const refreshedItem = await MenuItem.findById(bItem._id);
    expect(refreshedItem).not.toBeNull();
    expect(refreshedItem.name).toBe('Beta Secret Truffle Pizza');
  });

  // =========================================================================
  // ATTACK VECTOR 8: Reservations Tampering & Seating Protection
  // =========================================================================
  it('Attack 8: Cafe A attempts to seat or delete Cafe B reservation', async () => {
    // 8a: Seat attempt
    const seatRes = await request(app)
      .post(`/api/reservations/${bReservation._id}/seat`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ tableNumber: 1 });

    expect([404, 403]).toContain(seatRes.status);

    // 8b: Delete attempt
    const deleteRes = await request(app)
      .delete(`/api/reservations/${bReservation._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(deleteRes.status);

    const refreshedRes = await Reservation.findById(bReservation._id);
    expect(refreshedRes).not.toBeNull();
    expect(refreshedRes.status).toBe('confirmed');
  });

  // =========================================================================
  // ATTACK VECTOR 9: Staff PIN Reset & Deletion Protection
  // =========================================================================
  it('Attack 9: Cafe A attempts to reset PIN or delete Cafe B staff member', async () => {
    // 9a: Reset PIN attempt
    const pinRes = await request(app)
      .patch(`/api/staff/${bStaff._id}/pin`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ pin: '0000' });

    expect([404, 403]).toContain(pinRes.status);

    // 9b: Delete staff attempt
    const deleteRes = await request(app)
      .delete(`/api/staff/${bStaff._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(deleteRes.status);

    const refreshedStaff = await Staff.findById(bStaff._id);
    expect(refreshedStaff).not.toBeNull();
    const pinStillMatches = await refreshedStaff.comparePin('5555');
    expect(pinStillMatches).toBe(true);
  });

  // =========================================================================
  // ATTACK VECTOR 10: Customer CRM Record & Profile Protection
  // =========================================================================
  it('Attack 10: Cafe A attempts to read or update Cafe B customer profile', async () => {
    // 10a: Read customer detail
    const getRes = await request(app)
      .get(`/api/customers/${bCustomer._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(getRes.status);

    // 10b: Update customer tags
    const updateRes = await request(app)
      .patch(`/api/customers/${bCustomer._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ tags: ['Hacked'] });

    expect([404, 403]).toContain(updateRes.status);

    const refreshedCust = await Customer.findById(bCustomer._id);
    expect(refreshedCust.tags).toContain('VIP');
    expect(refreshedCust.tags).not.toContain('Hacked');
  });

  // =========================================================================
  // ATTACK VECTOR 11: Inventory Stock & 86 Item Toggle Protection
  // =========================================================================
  it('Attack 11: Cafe A attempts to modify Cafe B inventory stock or 86 toggle', async () => {
    // 11a: Stock adjustment
    const stockRes = await request(app)
      .patch(`/api/inventory/${bItem._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ delta: -15 });

    expect([404, 403]).toContain(stockRes.status);

    // 11b: 86 toggle
    const toggleRes = await request(app)
      .patch(`/api/inventory/${bItem._id}/toggle-86`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(toggleRes.status);

    const refreshedItem = await MenuItem.findById(bItem._id);
    expect(refreshedItem.stockQuantity).toBe(15);
    expect(refreshedItem.isAvailable).toBe(true);
  });

  // =========================================================================
  // ATTACK VECTOR 12: Coupon Management Protection
  // =========================================================================
  it('Attack 12: Cafe A attempts to modify or delete Cafe B coupon', async () => {
    const updateRes = await request(app)
      .put(`/api/coupons/${bCoupon._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ value: 99 });

    expect([404, 403]).toContain(updateRes.status);

    const deleteRes = await request(app)
      .delete(`/api/coupons/${bCoupon._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(deleteRes.status);

    const refreshedCoupon = await Coupon.findById(bCoupon._id);
    expect(refreshedCoupon).not.toBeNull();
    expect(refreshedCoupon.value).toBe(50);
  });

  // =========================================================================
  // ATTACK VECTOR 13: KOT & Invoice Cross-Tenant Protection
  // =========================================================================
  it('Attack 13: Cafe A attempts to view Cafe B KOT ticket or invoice receipt', async () => {
    // 13a: KOT ticket
    const kotRes = await request(app)
      .get(`/api/pos/kot/${bOrder._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(kotRes.status);

    // 13b: Invoice receipt
    const invRes = await request(app)
      .get(`/api/pos/invoice/${bSession._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect([404, 403]).toContain(invRes.status);
  });

  // =========================================================================
  // ATTACK VECTOR 14: Client Request Body Tenant Tampering
  // =========================================================================
  it('Attack 14: Cafe A sends request body with cafeId of Cafe B (Tenant Tampering)', async () => {
    // Attempt to pass cafeId or cafe of Cafe B while authenticated as Cafe A
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        cafeId: String(cafeB._id),
        cafe: String(cafeB._id),
        customerName: 'Sneaky Reservation',
        customerPhone: '9111122222',
        reservationDate: new Date().toISOString(),
        timeSlot: '19:30'
      });

    // Server must reject with 403 or sanitize the cafe to Cafe A
    if (res.status === 201) {
      expect(String(res.body.reservation.cafe)).toBe(String(cafeA._id));
      expect(String(res.body.reservation.cafe)).not.toBe(String(cafeB._id));
    } else {
      expect([403, 401]).toContain(res.status);
    }

    // Ensure no reservation was created under Cafe B
    const badRes = await Reservation.findOne({ customerName: 'Sneaky Reservation', cafe: cafeB._id });
    expect(badRes).toBeNull();
  });

  // =========================================================================
  // ATTACK VECTOR 15: Mass-Assignment Exploit Protection
  // =========================================================================
  it('Attack 15: Mass-assignment exploit: updating cafe profile with unauthorized fields', async () => {
    const res = await request(app)
      .put('/api/cafes/me/update')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Cafe Alpha Updated',
        role: 'superadmin',
        is_admin: true,
        cafeId: 'CAFE-HACKED-CODE',
        isActive: false
      });

    expect(res.status).toBe(200);

    const refreshedCafe = await Cafe.findById(cafeA._id);
    expect(refreshedCafe.name).toBe('Cafe Alpha Updated');
    // Protected fields must NEVER have changed
    expect(refreshedCafe.cafeId).toBe('CAFE-TENANT-A');
    expect(refreshedCafe.isActive).toBe(true);
  });

  // =========================================================================
  // ATTACK VECTOR 16: Financial & Billing Integrity (Negative Quantities/Prices)
  // =========================================================================
  it('Attack 16: Placing an order with negative quantities or prices is rejected', async () => {
    // 16a: Negative quantity
    const resNegQty = await request(app)
      .post('/api/orders')
      .send({
        cafeId: 'CAFE-TENANT-A',
        tableNumber: 1,
        customerName: 'Fraud Check',
        customerPhone: '9888800000',
        items: [
          { name: 'Fraud Coffee', price: 100, quantity: -5 }
        ]
      });

    expect(resNegQty.status).toBe(400);
    expect(resNegQty.body.message).toMatch(/quantity/i);

    // 16b: Negative price
    const resNegPrice = await request(app)
      .post('/api/orders')
      .send({
        cafeId: 'CAFE-TENANT-A',
        tableNumber: 1,
        customerName: 'Fraud Check',
        customerPhone: '9888800000',
        items: [
          { name: 'Fraud Burger', price: -50, quantity: 2 }
        ]
      });

    expect(resNegPrice.status).toBe(400);
    expect(resNegPrice.body.message).toMatch(/price/i);
  });
});
