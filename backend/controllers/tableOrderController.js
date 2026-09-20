const mongoose = require('mongoose');
const TableOrder = require('../models/TableOrder');
const TableSession = require('../models/TableSession');
const Cafe = require('../models/Cafe');
const Coupon = require('../models/Coupon');
const offlineStore = require('../utils/offlineStore');
const { calculateOrderAmounts } = require('../utils/billingEngine');
const { decrementStock, updateCustomerCRM } = require('../utils/crmAndInventoryHelper');
const { maskPhoneNumber } = require('../middleware/sanitizePayload');

// Shared date filter for orders list + stats (today | week | all)
const buildDateFilter = (date) => {
  if (date === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { createdAt: { $gte: today, $lt: tomorrow } };
  }
  if (date === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { createdAt: { $gte: weekAgo } };
  }
  return {};
};

// Generate order number: ORD-XXXXXX
const generateOrderNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ORD-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

// Generate KOT number: KOT-XXXX
const generateKotNumber = (prefix = 'KOT') => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

// Generate session code
const generateSessionCode = (tableNum) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SES-T${tableNum}-${rand}`;
};

// Place order (Customer — no auth required, unified into POS session engine)
exports.placeOrder = async (req, res) => {
  try {
    const { cafeId, customerName = 'Guest', customerPhone, items, specialInstructions } = req.body;
    const orderType = (req.body.orderType || 'dine-in').toLowerCase();
    const isTakeaway = orderType === 'takeaway';
    const tableNumber = isTakeaway ? 0 : parseInt(req.body.tableNumber, 10);

    if (!cafeId || (!isTakeaway && (!tableNumber || isNaN(tableNumber))) || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cafe ID, valid table number (for dine-in), and items are required' });
    }

    // Financial & input integrity validation
    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || item.price < 0 || isNaN(item.price)) {
        return res.status(400).json({ message: 'Invalid item price. Prices must be non-negative numbers.' });
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item quantity. Quantities must be positive integers.' });
      }
    }

    const pickupToken = isTakeaway ? `TKW-${Math.floor(1000 + Math.random() * 9000)}` : '';

    if (mongoose.connection.readyState !== 1) {
      const cidUpper = (cafeId || '').toUpperCase();
      const cidLower = (cafeId || '').toLowerCase();
      const cafe = offlineStore.findCafe(c => (c.cafeId === cidUpper || c.slug === cidLower || String(c._id) === String(cafeId)) && c.isActive !== false);
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      if (!isTakeaway && (tableNumber < 1 || tableNumber > cafe.tableCount)) {
        return res.status(400).json({ message: `Invalid table number. Must be between 1 and ${cafe.tableCount}` });
      }

      const rawSubtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
      let discount = 0, couponCode = '';
      if (req.body.couponCode) {
        const coupons = offlineStore.getCoupons(cafe._id);
        const coupon = coupons.find(c => c.code === req.body.couponCode.toUpperCase() && c.isActive);
        if (coupon && rawSubtotal >= (coupon.minOrder || 0)) {
          discount = coupon.type === 'percentage'
            ? Math.round((rawSubtotal * coupon.value) / 100)
            : coupon.value;
          if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
          discount = Math.min(discount, rawSubtotal);
          couponCode = coupon.code;
        }
      }

      const amounts = calculateOrderAmounts({
        items,
        discount,
        taxPercent: cafe.taxPercent || 0
      });
      const subtotal = amounts.subtotal;
      const taxableAmount = amounts.taxableAmount;
      const taxAmount = amounts.taxAmount;
      const grandTotal = amounts.grandTotal;

      let session = null;
      if (!isTakeaway) {
        // Find or create session for Dine-In table
        let sessions = offlineStore.getActiveSessions(cafe._id);
        session = sessions.find(s => s.tableNumber === Number(tableNumber));
        if (!session) {
          session = offlineStore.openSession({
            cafe: cafe._id,
            tableNumber: Number(tableNumber),
            guestName: (customerName || 'Guest').trim(),
            guestPhone: customerPhone || '',
            pax: 2
          });
        }
      }

      const order = offlineStore.createOrder({
        cafe: cafe._id,
        sessionId: session ? session._id : null,
        orderSource: 'QR Scan',
        orderType: isTakeaway ? 'Takeaway' : 'Dine-In',
        tableNumber: isTakeaway ? 0 : Number(tableNumber),
        customerName: (customerName || (isTakeaway ? 'Takeaway Guest' : 'Guest')).trim(),
        customerPhone: customerPhone || '',
        items,
        subtotal,
        discount,
        couponCode,
        taxAmount,
        grandTotal,
        totalAmount: grandTotal,
        specialInstructions: isTakeaway ? `[Token: ${pickupToken}] ${specialInstructions || ''}`.trim() : (specialInstructions || ''),
        status: 'Pending',
        paymentStatus: 'Unpaid'
      });

      return res.status(201).json({
        message: 'Order placed successfully',
        order,
        kotNumber: order.kotNumber,
        sessionCode: session ? session.sessionCode : null,
        pickupToken: pickupToken || null
      });
    }

    let cafeQuery = { isActive: true };
    const cidUpper = (cafeId || '').toUpperCase();
    const cidLower = (cafeId || '').toLowerCase();
    const orConditions = [{ cafeId: cidUpper }, { slug: cidLower }];
    if (mongoose.Types.ObjectId.isValid(cafeId)) {
      orConditions.push({ _id: cafeId });
    }
    cafeQuery.$or = orConditions;
    const cafe = await Cafe.findOne(cafeQuery);
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
    if (!isTakeaway && (tableNumber < 1 || tableNumber > cafe.tableCount))
      return res.status(400).json({ message: `Invalid table number. Must be between 1 and ${cafe.tableCount}` });

    const rawSubtotal = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);

    // Handle coupon
    let discount = 0, couponCode = '';
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ cafe: cafe._id, code: req.body.couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const validExpiry = !coupon.expiresAt || new Date() <= coupon.expiresAt;
        const validUsage = coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit;
        const validMin = rawSubtotal >= coupon.minOrder;
        if (validExpiry && validUsage && validMin) {
          if (coupon.type === 'percentage') {
            discount = Math.round((rawSubtotal * coupon.value) / 100);
            if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
          } else {
            discount = coupon.value;
          }
          discount = Math.min(discount, rawSubtotal);
          couponCode = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const amounts = calculateOrderAmounts({
      items,
      discount,
      taxPercent: cafe.taxPercent || 0
    });
    const subtotal = amounts.subtotal;
    const taxableAmount = amounts.taxableAmount;
    const taxAmount = amounts.taxAmount;
    const grandTotal = amounts.grandTotal;

    let orderNumber, exists = true;
    while (exists) { orderNumber = generateOrderNumber(); exists = await TableOrder.findOne({ orderNumber }); }

    const kotNumber = generateKotNumber(cafe.kotPrefix || 'KOT');

    // Attach to or create active session for Dine-In table
    let session = null;
    if (!isTakeaway) {
      session = await TableSession.findOne({
        cafe: cafe._id,
        tableNumber,
        status: { $in: ['active', 'billing'] }
      });

      if (!session) {
        const sessionCode = generateSessionCode(tableNumber);
        session = new TableSession({
          cafe: cafe._id,
          tableNumber,
          sessionCode,
          customerName: customerName.trim(),
          customerPhone: customerPhone ? customerPhone.trim() : '',
          pax: 1,
          status: 'active',
          orders: []
        });
        await session.save();
      }
    }

    const cleanItems = items.map(item => ({
      menuItem: (item.menuItem && mongoose.Types.ObjectId.isValid(item.menuItem)) ? item.menuItem : undefined,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      image: item.image || '',
      notes: item.specialInstructions || item.notes || ''
    }));

    const order = new TableOrder({
      cafe: cafe._id,
      tableNumber: isTakeaway ? 0 : tableNumber,
      customerName: (customerName || (isTakeaway ? 'Takeaway Guest' : 'Guest')).trim(),
      customerPhone: customerPhone || '',
      items: cleanItems,
      subtotal,
      discount,
      couponCode,
      taxAmount,
      grandTotal,
      totalAmount: grandTotal,
      specialInstructions: isTakeaway ? `[Token: ${pickupToken}] ${specialInstructions || ''}`.trim() : (specialInstructions || ''),
      orderNumber,
      orderSource: 'qr',
      orderType: isTakeaway ? 'takeaway' : 'dine-in',
      sessionId: session ? session._id : null,
      kotNumber,
      kotPrintedAt: new Date(),
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    await order.save();

    // Link order to session if Dine-In
    if (session) {
      session.orders.push(order._id);
      session.subtotal = Math.round((session.subtotal + subtotal) * 100) / 100;
      session.discount = Math.round((session.discount + discount) * 100) / 100;
      session.taxAmount = Math.round((session.taxAmount + taxAmount) * 100) / 100;
      session.grandTotal = Math.round((session.grandTotal + grandTotal) * 100) / 100;
      await session.save();
    }

    // Phase 2: Auto-decrement stock & Update Customer CRM
    decrementStock(cafe._id, items);
    updateCustomerCRM(cafe._id, { customerName, customerPhone, items, totalAmount: grandTotal });

    res.status(201).json({
      message: 'Order placed successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        kotNumber: order.kotNumber,
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        taxAmount: order.taxAmount,
        grandTotal: order.grandTotal,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderSource: order.orderSource,
        orderType: order.orderType,
        pickupToken: pickupToken || null,
        sessionId: session ? session._id : null,
        createdAt: order.createdAt
      },
      kotNumber: order.kotNumber,
      sessionCode: session ? session.sessionCode : null,
      pickupToken: pickupToken || null
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Customer poll order status / track order by orderNumber or ID
exports.trackOrder = async (req, res) => {
  try {
    const identifier = req.params.orderNumber || req.params.id;

    if (mongoose.connection.readyState !== 1) {
      const orders = offlineStore.getOrders();
      const order = orders.find(o => o.orderNumber === identifier || o._id === identifier);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      return res.json({
        orderNumber: order.orderNumber,
        kotNumber: order.kotNumber,
        tableNumber: order.tableNumber,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        taxAmount: order.taxAmount,
        grandTotal: order.grandTotal,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderSource: order.orderSource,
        orderType: order.orderType,
        customerName: order.customerName,
        customerPhone: maskPhoneNumber(order.customerPhone),
        createdAt: order.createdAt,
        cafeId: order.cafe || ''
      });
    }

    let order = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      order = await TableOrder.findById(identifier);
    }
    if (!order) {
      order = await TableOrder.findOne({ orderNumber: identifier });
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const cafe = await Cafe.findById(order.cafe).select('cafeId name');

    res.json({
      orderNumber: order.orderNumber,
      kotNumber: order.kotNumber,
      tableNumber: order.tableNumber,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      taxAmount: order.taxAmount,
      grandTotal: order.grandTotal,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderSource: order.orderSource,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: maskPhoneNumber(order.customerPhone),
      createdAt: order.createdAt,
      cafeId: cafe?.cafeId || ''
    });
  } catch (error) {
    console.error('Track order error:', error);
    try {
      const offlineOrder = offlineStore.getOrderById(req.params.identifier);
      if (offlineOrder) {
        return res.json({
          orderNumber: offlineOrder.orderNumber,
          kotNumber: offlineOrder.kotNumber,
          tableNumber: offlineOrder.tableNumber,
          items: offlineOrder.items,
          subtotal: offlineOrder.subtotal,
          discount: offlineOrder.discount,
          taxAmount: offlineOrder.taxAmount,
          grandTotal: offlineOrder.grandTotal,
          totalAmount: offlineOrder.totalAmount,
          status: offlineOrder.status,
          paymentStatus: offlineOrder.paymentStatus,
          orderSource: offlineOrder.orderSource,
          orderType: offlineOrder.orderType,
          customerName: offlineOrder.customerName,
          customerPhone: maskPhoneNumber(offlineOrder.customerPhone),
          createdAt: offlineOrder.createdAt,
          cafeId: offlineOrder.cafe || ''
        });
      }
    } catch (e) { }
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getOrderStatus = exports.trackOrder;

// Get orders for cafe owner (Live orders / History with POS filter support)
exports.getCafeOrders = async (req, res) => {
  try {
    const { status, date, payment, source, type, tableNumber } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const orders = offlineStore.getOrders(req.user.cafeId, { status, source, type, tableNumber });
      return res.json(orders);
    }

    const filter = { cafe: req.user.cafeId };

    if (status && status !== 'all') filter.status = status;
    if (payment === 'unpaid') filter.paymentStatus = { $ne: 'paid' };
    if (payment === 'paid') filter.paymentStatus = 'paid';
    if (source && source !== 'all') filter.orderSource = source;
    if (type && type !== 'all') filter.orderType = type;
    if (tableNumber) filter.tableNumber = parseInt(tableNumber);

    Object.assign(filter, buildDateFilter(date));

    const orders = await TableOrder.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get cafe orders error:', error);
    try {
      const orders = offlineStore.getOrders(req.user?.cafeId, req.query);
      return res.json(orders || []);
    } catch (e) { }
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order food status (CafeOwner)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.updateOrderStatus(req.params.id, status);
      if (!updated) return res.status(404).json({ message: 'Order not found' });
      return res.json({ message: `Order ${status}`, order: updated });
    }

    const order = await TableOrder.findOne({ _id: req.params.id, cafe: req.user.cafeId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = status.toLowerCase();
    if (status.toLowerCase() === 'served' || status.toLowerCase() === 'completed') {
      order.completedAt = new Date();
    }
    await order.save();
    res.json({ message: `Order ${status}`, order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark order as paid — THIS is what updates revenue (CafeOwner)
exports.markOrderPaid = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const allowed = ['cash', 'upi', 'card', 'other', 'Cash', 'UPI', 'Card'];
    const method = allowed.includes(paymentMethod) ? paymentMethod : 'Cash';

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.updateOrderStatus(req.params.id, null, { paymentStatus: 'Paid', paymentMethod: method });
      if (!updated) return res.status(404).json({ message: 'Order not found' });
      return res.json({ message: 'Payment received!', order: updated });
    }

    const order = await TableOrder.findOne({ _id: req.params.id, cafe: req.user.cafeId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Cannot mark cancelled order as paid' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Order already paid' });

    order.paymentStatus = 'paid';
    order.paymentMethod = method.toLowerCase();
    order.paidAt = new Date();
    await order.save();

    // If order has a session, check if all orders are now paid
    if (order.sessionId) {
      const TableSession = require('../models/TableSession');
      const session = await TableSession.findById(order.sessionId).populate('orders');
      if (session && session.status !== 'closed') {
        const nonCancelled = (session.orders || []).filter(o => o._id.toString() !== order._id.toString() && o.status !== 'cancelled');
        const allOthersPaid = nonCancelled.every(o => (o.paymentStatus || '').toLowerCase() === 'paid');
        if (allOthersPaid) {
          session.paymentStatus = 'paid';
          session.settledAt = new Date();
          session.autoFreeAt = new Date(Date.now() + 60 * 1000);
          session.status = 'settled';
          await session.save();

          // Auto-close table after 60 seconds
          setTimeout(async () => {
            try {
              const s = await TableSession.findById(session._id);
              if (s && s.status !== 'closed') {
                s.status = 'closed';
                s.closedAt = new Date();
                await s.save();
              }
            } catch (err) {}
          }, 60000);
        }
      }
    }

    res.json({ message: 'Payment received!', order });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats — revenue counts ONLY paid orders
exports.getCafeStats = async (req, res) => {
  try {
    const date = req.query.date || 'today';

    if (mongoose.connection.readyState !== 1) {
      const orders = offlineStore.getOrders(req.user.cafeId);
      const activeSessions = offlineStore.getActiveSessions(req.user.cafeId);
      const activeOrders = orders.filter(o => (o.status || '').toLowerCase() !== 'cancelled');
      const paidOrders = activeOrders.filter(o => (o.paymentStatus || '').toLowerCase() === 'paid');
      const paidOrderCount = paidOrders.length;
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount || o.subtotal || 0), 0);
      const totalDiscount = paidOrders.reduce((sum, o) => sum + (o.discountAmount || o.discount || 0), 0);
      const pendingOrders = activeOrders.filter(o => (o.status || '').toLowerCase() === 'pending').length;
      const preparingOrders = activeOrders.filter(o => ['preparing', 'confirmed'].includes((o.status || '').toLowerCase())).length;
      const completedOrders = activeOrders.filter(o => ['served', 'completed'].includes((o.status || '').toLowerCase())).length;
      const unpaidOrders = activeOrders.filter(o => (o.paymentStatus || '').toLowerCase() !== 'paid').length;
      const takeawayOrders = activeOrders.filter(o => (o.orderType || '').toLowerCase() === 'takeaway' || (o.orderSource || '').toLowerCase() === 'takeaway').length;
      const dineInOrders = activeOrders.filter(o => (o.orderType || '').toLowerCase() === 'dine-in').length;
      const avgOrderValue = paidOrderCount > 0 ? Math.round(totalRevenue / paidOrderCount) : 0;

      return res.json({
        totalOrders: activeOrders.length,
        totalRevenue,
        totalDiscount,
        pendingOrders,
        preparingOrders,
        completedOrders,
        unpaidOrders,
        paidOrderCount,
        takeawayOrders,
        dineInOrders,
        avgOrderValue,
        activeSessionsCount: activeSessions.length,
        period: date
      });
    }

    const filter = { cafe: req.user.cafeId, ...buildDateFilter(date) };
    const periodOrders = await TableOrder.find(filter);

    const activeOrders = periodOrders.filter(o => o.status !== 'cancelled');
    const paidOrders = activeOrders.filter(o => o.paymentStatus === 'paid');
    const paidOrderCount = paidOrders.length;

    const totalOrders = activeOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.grandTotal || o.totalAmount), 0);
    const totalDiscount = paidOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const pendingOrders = activeOrders.filter(o => o.status === 'pending').length;
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length;
    const completedOrders = activeOrders.filter(o => o.status === 'served' || o.status === 'completed').length;
    const unpaidOrders = activeOrders.filter(o => o.paymentStatus !== 'paid').length;

    // POS & Operations Metrics
    const takeawayOrders = activeOrders.filter(o => o.orderType === 'takeaway' || o.orderSource === 'takeaway').length;
    const dineInOrders = activeOrders.filter(o => o.orderType === 'dine-in').length;
    const avgOrderValue = paidOrderCount > 0 ? Math.round(totalRevenue / paidOrderCount) : 0;

    let activeSessionsCount = 0;
    try {
      activeSessionsCount = await TableSession.countDocuments({
        cafe: req.user.cafeId,
        status: { $in: ['active', 'billing'] }
      });
    } catch {
      activeSessionsCount = 0;
    }

    res.json({
      totalOrders,
      totalRevenue,
      totalDiscount,
      pendingOrders,
      preparingOrders,
      completedOrders,
      unpaidOrders,
      paidOrderCount,
      takeawayOrders,
      dineInOrders,
      avgOrderValue,
      activeSessionsCount,
      period: date
    });
  } catch (error) {
    console.error('Get stats error:', error);
    try {
      const stats = offlineStore.getStats(req.user?.cafeId, req.query?.date || 'today');
      return res.json(stats);
    } catch (e) { }
    res.status(500).json({ message: 'Server error' });
  }
};
