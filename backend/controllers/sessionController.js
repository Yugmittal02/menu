const mongoose = require('mongoose');
const TableSession = require('../models/TableSession');
const TableOrder = require('../models/TableOrder');
const Cafe = require('../models/Cafe');
const offlineStore = require('../utils/offlineStore');
const { recalculateSessionTotals } = require('../utils/billingEngine');

// Generate session code e.g. SES-T1-K8J2
const generateSessionCode = (tableNum) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SES-T${tableNum}-${rand}`;
};

// 1. Open Session (Seat Guest)
exports.openSession = async (req, res) => {
  try {
    const { tableNumber, customerName, customerPhone, pax, notes } = req.body;
    const cafeId = req.user.cafeId;

    if (!tableNumber || tableNumber < 1) {
      return res.status(400).json({ message: 'Valid table number is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      try {
        const session = offlineStore.openSession({
          cafe: cafeId,
          tableNumber,
          guestName: customerName,
          guestPhone: customerPhone,
          pax,
          notes
        });
        return res.status(201).json({ message: 'Table session started successfully', session });
      } catch (err) {
        return res.status(err.status || 400).json({ message: err.message });
      }
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
    if (tableNumber > cafe.tableCount) {
      return res.status(400).json({ message: `Table number exceeds cafe table count (${cafe.tableCount})` });
    }

    // Check if table is currently occupied
    const existing = await TableSession.findOne({
      cafe: cafeId,
      tableNumber,
      status: { $in: ['active', 'billing'] }
    });

    if (existing) {
      return res.status(400).json({
        message: `Table ${tableNumber} is already occupied with an active session (${existing.sessionCode})`,
        session: existing
      });
    }

    let sessionCode = generateSessionCode(tableNumber);
    let codeExists = true;
    while (codeExists) {
      const found = await TableSession.findOne({ sessionCode });
      if (!found) codeExists = false;
      else sessionCode = generateSessionCode(tableNumber);
    }

    const session = new TableSession({
      cafe: cafeId,
      tableNumber,
      sessionCode,
      customerName: customerName ? customerName.trim() : `Table ${tableNumber} Guest`,
      customerPhone: customerPhone ? customerPhone.trim() : '',
      pax: pax ? Math.max(1, parseInt(pax)) : 1,
      notes: notes || '',
      status: 'active',
      orders: []
    });

    await session.save();
    res.status(201).json({ message: 'Table session started successfully', session });
  } catch (error) {
    console.error('Open session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get all Active Sessions (Active + Billing + Settled countdown)
exports.getActiveSessions = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const sessions = offlineStore.getActiveSessions(cafeId);
      return res.json(sessions);
    }

    const now = Date.now();

    const sessions = await TableSession.find({
      cafe: cafeId,
      status: { $in: ['active', 'billing', 'settled'] }
    })
      .populate({
        path: 'orders',
        select: 'orderNumber items subtotal discount totalAmount status paymentStatus orderSource kotNumber createdAt paidAt'
      })
      .sort({ tableNumber: 1 });

    const activeList = [];

    for (const session of sessions) {
      const validOrders = (session.orders || []).filter(o => o.status !== 'cancelled');
      const allOrdersPaid = validOrders.length > 0 && validOrders.every(o => (o.paymentStatus || '').toLowerCase() === 'paid');

      // Check if session has settled or all orders are paid
      const isSettled = session.status === 'settled' || session.paymentStatus === 'paid' || allOrdersPaid;

      if (isSettled) {
        if (!session.settledAt) {
          const latestPaid = validOrders.reduce((latest, o) => {
            const pt = o.paidAt ? new Date(o.paidAt).getTime() : 0;
            return Math.max(latest, pt);
          }, 0);
          session.settledAt = latestPaid ? new Date(latestPaid) : new Date();
          session.autoFreeAt = new Date(new Date(session.settledAt).getTime() + 60 * 1000);
          session.status = 'settled';
          session.paymentStatus = 'paid';
          await session.save();
        }

        const elapsedSec = Math.floor((now - new Date(session.settledAt).getTime()) / 1000);

        // Auto-free table after 60 seconds
        if (elapsedSec >= 60) {
          session.status = 'closed';
          session.closedAt = new Date();
          await session.save();
          continue; // table is now free/available
        }
      }

      activeList.push(session);
    }

    res.json(activeList);
  } catch (error) {
    console.error('Get active sessions error:', error);
    try {
      const sessions = offlineStore.getActiveSessions(req.user?.cafeId);
      return res.json(sessions || []);
    } catch (e) { }
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get Session Detail by ID
exports.getSessionDetail = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const session = offlineStore.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ message: 'Session not found' });
      return res.json(session);
    }

    const session = await TableSession.findOne({
      _id: req.params.id,
      cafe: req.user.cafeId
    }).populate('orders');

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    console.error('Get session detail error:', error);
    try {
      const session = offlineStore.getSessionById(req.params.id);
      if (session) return res.json(session);
    } catch (e) { }
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Move Session to Billing (Calculates totals + tax)
exports.moveToBilling = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const session = offlineStore.getSessionById(req.params.id);
      if (!session) return res.status(404).json({ message: 'Session not found' });
      const cafe = offlineStore.findCafe(c => c._id === cafeId || c.cafeId === req.user.cafeCode);
      const taxPercent = cafe?.taxPercent !== undefined ? cafe.taxPercent : 5;

      const validOrders = (session.orders || []).filter(o => (o.status || '').toLowerCase() !== 'cancelled');
      const subtotal = validOrders.reduce((sum, o) => sum + (o.subtotal || o.itemTotal || o.totalAmount || 0), 0);
      const customDiscount = req.body.discount !== undefined ? parseFloat(req.body.discount) : (session.discountAmount || 0);
      const taxableAmount = Math.max(0, subtotal - customDiscount);
      const taxAmount = Math.round((taxableAmount * taxPercent) / 100);
      const grandTotal = taxableAmount + taxAmount;

      const updated = offlineStore.updateSession(req.params.id, {
        status: 'billing',
        subtotal,
        discountAmount: customDiscount,
        taxAmount,
        grandTotal
      });

      return res.json({
        message: 'Session moved to billing',
        session: updated,
        taxPercent,
        taxLabel: cafe?.taxLabel || 'GST'
      });
    }

    const session = await TableSession.findOne({
      _id: req.params.id,
      cafe: cafeId
    }).populate('orders');

    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'closed') {
      return res.status(400).json({ message: 'Session is already closed' });
    }

    const cafe = await Cafe.findById(cafeId);
    const taxPercent = cafe?.taxPercent || 0;

    // Filter active/non-cancelled orders
    const validOrders = (session.orders || []).filter(o => o.status !== 'cancelled');
    const subtotal = validOrders.reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);
    const orderDiscounts = validOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const customDiscount = req.body.discount ? parseFloat(req.body.discount) : 0;
    const discount = Math.max(orderDiscounts, customDiscount);

    const taxableAmount = Math.max(0, subtotal - discount);
    const taxAmount = Math.round((taxableAmount * taxPercent) / 100);
    const grandTotal = taxableAmount + taxAmount;

    session.status = 'billing';
    session.subtotal = subtotal;
    session.discount = discount;
    session.taxAmount = taxAmount;
    session.grandTotal = grandTotal;

    await session.save();

    res.json({
      message: 'Session moved to billing',
      session,
      taxPercent,
      taxLabel: cafe?.taxLabel || 'GST'
    });
  } catch (error) {
    console.error('Move to billing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Close Session & Mark Paid
exports.closeSession = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { paymentMethod, notes, immediate } = req.body;
    const method = ['cash', 'upi', 'card', 'other', 'Cash', 'UPI', 'Card'].includes(paymentMethod) ? paymentMethod : 'Cash';

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.closeSession(req.params.id, {
        paymentMethod: method,
        discountAmount: req.body.discount,
        grandTotal: req.body.grandTotal,
        immediate
      });
      if (!updated) return res.status(404).json({ message: 'Session not found' });
      return res.json({ message: 'Session settled successfully', session: updated });
    }

    const session = await TableSession.findOne({
      _id: req.params.id,
      cafe: cafeId
    }).populate('orders');

    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'closed') {
      return res.status(400).json({ message: 'Session is already closed' });
    }

    const now = new Date();
    session.paymentStatus = 'paid';
    session.paymentMethod = method;
    session.paidAt = now;
    if (notes) session.notes = notes;

    if (immediate) {
      session.status = 'closed';
      session.closedAt = now;
    } else {
      session.status = 'settled';
      session.settledAt = now;
      session.autoFreeAt = new Date(now.getTime() + 60 * 1000);

      // Auto-close table after 60 seconds in background
      setTimeout(async () => {
        try {
          const s = await TableSession.findById(session._id);
          if (s && s.status !== 'closed') {
            s.status = 'closed';
            s.closedAt = new Date();
            await s.save();
          }
        } catch (e) {}
      }, 60000);
    }

    // If grandTotal wasn't calculated yet, calculate it now
    if (!session.grandTotal || session.grandTotal === 0) {
      const cafe = await Cafe.findById(cafeId);
      recalculateSessionTotals(session, cafe || 0, session.discount);
    }

    await session.save();

    // Mark all orders in this session as completed & paid
    if (session.orders && session.orders.length > 0) {
      const orderIds = session.orders.map(o => o._id);
      await TableOrder.updateMany(
        {
          _id: { $in: orderIds },
          cafe: cafeId,
          status: { $ne: 'cancelled' }
        },
        {
          $set: {
            paymentStatus: 'paid',
            paymentMethod: method,
            paidAt: now,
            status: 'completed',
            completedAt: now
          }
        }
      );
    }

    res.json({
      message: immediate ? 'Session closed and table freed' : 'Bill settled. Table will auto-free after 60 seconds.',
      session
    });
  } catch (error) {
    console.error('Close session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Cancel Session (if empty or table freed)
exports.cancelSession = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      offlineStore.cancelSession(req.params.id);
      return res.json({ message: 'Table session cancelled' });
    }

    const session = await TableSession.findOne({
      _id: req.params.id,
      cafe: req.user.cafeId
    });

    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Unlink orders with strict tenant isolation
    await TableOrder.updateMany(
      { sessionId: session._id, cafe: req.user.cafeId },
      { $set: { sessionId: null } }
    );

    await TableSession.deleteOne({ _id: session._id });
    res.json({ message: 'Table session cancelled' });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. Resolve or create dining session for table QR scan (Customer Facing)
exports.resolveSession = async (req, res) => {
  const { cafeId, tableNumber, guestName, guestPhone } = req.body;
  if (!cafeId || !tableNumber) {
    return res.status(400).json({ message: 'Cafe identifier and table number are required' });
  }

  const tableNum = parseInt(tableNumber, 10);
  if (isNaN(tableNum) || tableNum < 1) {
    return res.status(400).json({ message: 'Valid table number is required' });
  }

  try {
    let resolvedCafe = null;
    if (mongoose.connection.readyState === 1) {
      const orClauses = [
        { slug: String(cafeId).toLowerCase() },
        { cafeId: String(cafeId).toUpperCase() }
      ];
      if (mongoose.Types.ObjectId.isValid(cafeId)) {
        orClauses.push({ _id: cafeId });
      }
      resolvedCafe = await Cafe.findOne({ $or: orClauses, isActive: true });
    }

    if (!resolvedCafe) {
      resolvedCafe = offlineStore.findCafe(c =>
        (c.slug === String(cafeId).toLowerCase() || c.cafeId === String(cafeId).toUpperCase() || c._id === cafeId) &&
        c.isActive !== false
      );
    }

    if (!resolvedCafe && ['cafe', 'demo', 'sample', 'default'].includes(String(cafeId).toLowerCase())) {
      if (mongoose.connection.readyState === 1) {
        resolvedCafe = await Cafe.findOne({ isActive: true });
      }
      if (!resolvedCafe) {
        const allCafes = offlineStore.getCafes();
        resolvedCafe = allCafes.find(c => c.isActive !== false) || allCafes[0];
      }
    }

    if (!resolvedCafe) {
      return res.status(404).json({ message: 'Cafe not found or inactive' });
    }

    if (tableNum > (resolvedCafe.tableCount || 50)) {
      return res.status(400).json({ message: `Table ${tableNum} is invalid for this cafe (max: ${resolvedCafe.tableCount})` });
    }

    const cafeIdTarget = resolvedCafe._id;

    // Check existing active or billing session
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(cafeIdTarget)) {
      let session = await TableSession.findOne({
        cafe: cafeIdTarget,
        tableNumber: tableNum,
        status: { $in: ['active', 'billing'] }
      }).populate({
        path: 'orders',
        select: 'orderNumber items subtotal discount taxAmount grandTotal status paymentStatus createdAt'
      });

      if (!session) {
        // Create new session for this table visit
        session = new TableSession({
          cafe: cafeIdTarget,
          tableNumber: tableNum,
          sessionCode: generateSessionCode(tableNum),
          guestName: guestName || '',
          guestPhone: guestPhone || '',
          pax: 2,
          openedAt: new Date(),
          status: 'active'
        });
        await session.save();
      } else if (guestName || guestPhone) {
        if (guestName && !session.guestName) session.guestName = guestName;
        if (guestPhone && !session.guestPhone) session.guestPhone = guestPhone;
        await session.save();
      }

      return res.json({
        session,
        cafe: {
          id: resolvedCafe._id,
          cafeId: resolvedCafe.cafeId,
          slug: resolvedCafe.slug,
          name: resolvedCafe.name,
          currency: resolvedCafe.currency || '₹',
          tableCount: resolvedCafe.tableCount
        },
        tableNumber: tableNum
      });
    }

    // Offline store implementation
    let session = (offlineStore.getActiveSessions(resolvedCafe._id || resolvedCafe.cafeId) || [])
      .find(s => s.tableNumber === tableNum);

    if (!session) {
      session = offlineStore.openSession({
        cafe: resolvedCafe._id || resolvedCafe.cafeId,
        tableNumber: tableNum,
        guestName: guestName || '',
        guestPhone: guestPhone || '',
        pax: 2
      });
    }

    res.json({
      session,
      cafe: {
        id: resolvedCafe._id || resolvedCafe.cafeId,
        cafeId: resolvedCafe.cafeId,
        slug: resolvedCafe.slug,
        name: resolvedCafe.name,
        currency: resolvedCafe.currency || '₹',
        tableCount: resolvedCafe.tableCount
      },
      tableNumber: tableNum
    });
  } catch (error) {
    console.error('Resolve session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 8. Get Customer Session Detail (Sanitized)
exports.getCustomerSession = async (req, res) => {
  const sessionId = req.params.sessionId;
  try {
    if (mongoose.connection.readyState === 1) {
      let session = null;
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        session = await TableSession.findById(sessionId).populate({
          path: 'orders',
          select: 'orderNumber items subtotal discount taxAmount grandTotal status paymentStatus createdAt'
        });
      }
      if (!session) {
        session = await TableSession.findOne({ sessionCode: sessionId }).populate({
          path: 'orders',
          select: 'orderNumber items subtotal discount taxAmount grandTotal status paymentStatus createdAt'
        });
      }
      if (session) return res.json(session);
    }

    const session = offlineStore.getSessionById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    console.error('Get customer session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 9. Customer Request Bill from table
exports.customerRequestBill = async (req, res) => {
  const sessionId = req.params.id;
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(sessionId)) {
      const session = await TableSession.findById(sessionId).populate('orders');
      if (!session) return res.status(404).json({ message: 'Session not found' });
      if (session.status === 'closed') {
        return res.status(400).json({ message: 'Session already closed and settled' });
      }

      const cafe = await Cafe.findById(session.cafe);
      recalculateSessionTotals(session, cafe);
      session.status = 'billing';
      await session.save();
      return res.json({ message: 'Bill requested. Staff has been notified.', session });
    }

    const session = offlineStore.getSessionById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const cafe = offlineStore.findCafe(c => c._id === session.cafe || c.cafeId === session.cafe);
    const taxPercent = cafe?.taxPercent !== undefined ? cafe.taxPercent : 5;
    const totals = recalculateSessionTotals(session, taxPercent);
    const updated = offlineStore.updateSession(sessionId, {
      status: 'billing',
      subtotal: totals.subtotal,
      discountAmount: totals.discount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal
    });
    res.json({ message: 'Bill requested. Staff has been notified.', session: updated || session });
  } catch (error) {
    console.error('Customer request bill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

