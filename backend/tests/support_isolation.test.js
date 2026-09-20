const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');

const Cafe = require('../models/Cafe');
const SupportTicket = require('../models/SupportTicket');
const offlineStore = require('../utils/offlineStore');

describe('Support System & Cross-Tenant Isolation Test Suite', () => {
  jest.setTimeout(35000);

  let cafeA, cafeB;
  let tokenA, tokenB, adminToken;
  let ticketAId, ticketBId;

  beforeAll(async () => {
    // Wait for DB connection if connecting
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => {
        if (mongoose.connection.readyState === 1) return resolve();
        mongoose.connection.once('connected', resolve);
        setTimeout(resolve, 12000);
      });
    }

    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

    if (mongoose.connection.readyState === 1) {
      cafeA = await Cafe.findOneAndUpdate(
        { cafeId: 'CAFE-SUPPORT-A' },
        {
          cafeId: 'CAFE-SUPPORT-A',
          name: 'Support Cafe Alpha',
          ownerName: 'Alice Support',
          phone: '+91 91000 11111',
          tableCount: 8,
          isActive: true
        },
        { upsert: true, new: true }
      );

      cafeB = await Cafe.findOneAndUpdate(
        { cafeId: 'CAFE-SUPPORT-B' },
        {
          cafeId: 'CAFE-SUPPORT-B',
          name: 'Support Cafe Beta',
          ownerName: 'Bob Support',
          phone: '+91 92000 22222',
          tableCount: 8,
          isActive: true
        },
        { upsert: true, new: true }
      );

      tokenA = jwt.sign(
        { cafeId: cafeA._id, cafeCode: cafeA.cafeId, role: 'cafeowner', id: 'usr-alice', name: 'Alice Support' },
        secret,
        { expiresIn: '1h' }
      );

      tokenB = jwt.sign(
        { cafeId: cafeB._id, cafeCode: cafeB.cafeId, role: 'cafeowner', id: 'usr-bob', name: 'Bob Support' },
        secret,
        { expiresIn: '1h' }
      );
    } else {
      // Offline fallback support
      cafeA = offlineStore.findCafe('cafe_alpha') || { _id: 'cafe_alpha', cafeId: 'CAFE-SUPPORT-A', name: 'Support Cafe Alpha' };
      cafeB = offlineStore.findCafe('cafe_beta') || { _id: 'cafe_beta', cafeId: 'CAFE-SUPPORT-B', name: 'Support Cafe Beta' };
      
      tokenA = jwt.sign(
        { cafeId: cafeA._id || 'cafe_alpha', cafeCode: 'CAFE-SUPPORT-A', role: 'cafeowner', id: 'usr-alice' },
        secret,
        { expiresIn: '1h' }
      );

      tokenB = jwt.sign(
        { cafeId: cafeB._id || 'cafe_beta', cafeCode: 'CAFE-SUPPORT-B', role: 'cafeowner', id: 'usr-bob' },
        secret,
        { expiresIn: '1h' }
      );
    }

    adminToken = jwt.sign(
      { id: 'admin-krixov', email: 'admin@krixov.com', role: 'superadmin', name: 'Krixov SuperAdmin' },
      secret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      if (cafeA?._id) await SupportTicket.deleteMany({ cafe: cafeA._id });
      if (cafeB?._id) await SupportTicket.deleteMany({ cafe: cafeB._id });
      await Cafe.deleteOne({ cafeId: 'CAFE-SUPPORT-A' });
      await Cafe.deleteOne({ cafeId: 'CAFE-SUPPORT-B' });
    }
  });

  // 1. Creation & Sensitive Context Sanitization
  describe('Ticket Creation & Diagnostic Context Sanitization', () => {
    it('creates a ticket for Cafe A and strictly scrubs sensitive keys from diagnostic context', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          subject: 'Thermal Printer Bluetooth Pairing Failure',
          category: 'Printer',
          priority: 'High',
          description: 'Our ESC/POS thermal printer stops responding during weekend peak volume.',
          context: {
            browser: 'Chrome 128',
            screenResolution: '1920x1080',
            appVersion: 'v2.5.0-production',
            password: 'SuperSecretCafePassword!123',
            userToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.leaked',
            apiKey: 'sk-live-abcdef123456789',
            authCredential: 'Basic dXNlcjpwYXNz',
            secretCode: '9988'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket).toBeDefined();
      expect(res.body.ticket.ticketId).toMatch(/^TCK-/);
      expect(res.body.ticket.category).toBe('Printer');
      expect(res.body.ticket.status).toBe('Open');

      ticketAId = res.body.ticket.ticketId || res.body.ticket._id;

      // Sensitive context verification: forbidden keys MUST be removed
      const ctx = res.body.ticket.context;
      expect(ctx).toBeDefined();
      expect(ctx.browser).toBe('Chrome 128');
      expect(ctx.screenResolution).toBe('1920x1080');
      expect(ctx.password).toBeUndefined();
      expect(ctx.userToken).toBeUndefined();
      expect(ctx.apiKey).toBeUndefined();
      expect(ctx.authCredential).toBeUndefined();
      expect(ctx.secretCode).toBeUndefined();
    });

    it('rejects ticket creation with missing required fields', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          category: 'Orders'
          // missing subject and description
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/subject/i);
    });
  });

  // 2. Tenant B Creates Ticket
  describe('Tenant B Ticket Creation', () => {
    it('creates a distinct ticket under Cafe B', async () => {
      const res = await request(app)
        .post('/api/support/tickets')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          subject: 'GST Invoice 50/50 Split Question',
          category: 'GST',
          priority: 'Medium',
          description: 'Need confirmation on how CGST/SGST roundoff appears on B2B invoices.',
          context: {
            accountingMode: 'CGST_SGST_SPLIT'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.ticket).toBeDefined();
      ticketBId = res.body.ticket.ticketId || res.body.ticket._id;
    });
  });

  // 3. Multi-Tenant Isolation: Listing Tickets
  describe('Tenant Isolation: List Tickets', () => {
    it('Cafe A only retrieves its own tickets, never Cafe B tickets', async () => {
      const res = await request(app)
        .get('/api/support/tickets')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const subjects = res.body.map(t => t.subject);
      expect(subjects).toContain('Thermal Printer Bluetooth Pairing Failure');
      expect(subjects).not.toContain('GST Invoice 50/50 Split Question');
    });

    it('Cafe B only retrieves its own tickets, never Cafe A tickets', async () => {
      const res = await request(app)
        .get('/api/support/tickets')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const subjects = res.body.map(t => t.subject);
      expect(subjects).toContain('GST Invoice 50/50 Split Question');
      expect(subjects).not.toContain('Thermal Printer Bluetooth Pairing Failure');
    });
  });

  // 4. Cross-Tenant IDOR: Direct Detail Access
  describe('Cross-Tenant IDOR Prevention: Direct Detail Fetch', () => {
    it('blocks Cafe B from reading Cafe A ticket details (returns 404/access denied)', async () => {
      const res = await request(app)
        .get(`/api/support/tickets/${ticketAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.ticket).toBeUndefined();
    });

    it('allows Cafe A to read its own ticket details', async () => {
      const res = await request(app)
        .get(`/api/support/tickets/${ticketAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.subject).toBe('Thermal Printer Bluetooth Pairing Failure');
    });
  });

  // 5. Cross-Tenant Mutation Blocking
  describe('Cross-Tenant Mutation Blocking: Reply, Resolve, Reopen', () => {
    it('blocks Cafe B from replying to Cafe A ticket', async () => {
      const res = await request(app)
        .post(`/api/support/tickets/${ticketAId}/reply`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ message: 'Hostile injection message from Tenant B' });

      expect([403, 404]).toContain(res.status);
    });

    it('blocks Cafe B from resolving Cafe A ticket', async () => {
      const res = await request(app)
        .patch(`/api/support/tickets/${ticketAId}/resolve`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ feedback: 'Hostile resolution attempt' });

      expect([403, 404]).toContain(res.status);
    });

    it('blocks Cafe B from reopening Cafe A ticket', async () => {
      const res = await request(app)
        .patch(`/api/support/tickets/${ticketAId}/reopen`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ reason: 'Hostile reopen attempt' });

      expect([403, 404]).toContain(res.status);
    });
  });

  // 6. SuperAdmin Operations & Private Internal Notes Leakage Prevention
  describe('SuperAdmin Privileges & Internal Note Leakage Prevention', () => {
    it('allows SuperAdmin to view tickets from all cafes', async () => {
      const res = await request(app)
        .get('/api/support/admin/tickets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const subjects = res.body.map(t => t.subject);
      expect(subjects).toContain('Thermal Printer Bluetooth Pairing Failure');
      expect(subjects).toContain('GST Invoice 50/50 Split Question');
    });

    it('allows SuperAdmin to post a private internal note on Cafe A ticket', async () => {
      const res = await request(app)
        .post(`/api/support/admin/tickets/${ticketAId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'INTERNAL TRIAGE NOTE: Hardware vendor RMA check needed. Do not disclose warranty details.',
          isInternalNote: true
        });

      expect(res.status).toBe(200);
      expect(res.body.ticket).toBeDefined();

      // Check note in SuperAdmin response
      const internalMsgs = res.body.ticket.conversation.filter(m => m.isInternalNote);
      expect(internalMsgs.length).toBeGreaterThan(0);
      expect(internalMsgs[0].message).toContain('Hardware vendor RMA check needed');
    });

    it('strictly prevents Cafe A from seeing SuperAdmin private internal notes', async () => {
      const res = await request(app)
        .get(`/api/support/tickets/${ticketAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);

      // Verify conversation has ZERO internal notes
      const notes = (res.body.conversation || []).filter(m => m.isInternalNote);
      expect(notes.length).toBe(0);

      // Verify the content is not leaked in any conversation message
      const messagesText = (res.body.conversation || []).map(m => m.message).join(' ');
      expect(messagesText).not.toContain('Hardware vendor RMA check needed');
      expect(messagesText).not.toContain('INTERNAL TRIAGE NOTE');
    });

    it('allows SuperAdmin to post a public reply that Cafe A CAN see', async () => {
      const res = await request(app)
        .post(`/api/support/admin/tickets/${ticketAId}/reply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          message: 'Hello Alice, our engineering team has pushed a patch for printer buffer overruns.',
          isInternalNote: false
        });

      expect(res.status).toBe(200);

      // Verify Cafe A sees this public response
      const cafeView = await request(app)
        .get(`/api/support/tickets/${ticketAId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(cafeView.status).toBe(200);
      const messagesText = cafeView.body.conversation.map(m => m.message).join(' ');
      expect(messagesText).toContain('engineering team has pushed a patch');
    });
  });

  // 7. Role-Based Access Control on Support Routes
  describe('RBAC & Unauthorized Access Safeguards', () => {
    it('rejects unauthenticated requests to support tickets (401)', async () => {
      const res = await request(app).get('/api/support/tickets');
      expect(res.status).toBe(401);
    });

    it('rejects cafe owner attempting to access SuperAdmin support routes (403)', async () => {
      const res = await request(app)
        .get('/api/support/admin/tickets')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/SuperAdmin/i);
    });

    it('allows public access to system health without token', async () => {
      const res = await request(app).get('/api/support/system-status');
      expect(res.status).toBe(200);
      expect(res.body.systemStatus).toBe('Operational');
      expect(res.body.companyBrand).toBe('Krixov');
      expect(res.body.product).toBe('QR Menu');
    });
  });
});
