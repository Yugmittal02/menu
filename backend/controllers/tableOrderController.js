const TableOrder = require('../models/TableOrder');
const Cafe = require('../models/Cafe');
const Coupon = require('../models/Coupon');

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

// Place order (Customer — no auth required)
exports.placeOrder = async (req, res) => {
  try {
    const { cafeId, tableNumber, customerName, customerPhone, items, specialInstructions } = req.body;
    if (!cafeId || !tableNumber || !customerName || !items || items.length === 0)
      return res.status(400).json({ message: 'Cafe ID, table number, customer name, and items are required' });

    const cafe = await Cafe.findOne({ cafeId: cafeId.toUpperCase(), isActive: true });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
    if (tableNumber < 1 || tableNumber > cafe.tableCount)
      return res.status(400).json({ message: `Invalid table number. Must be between 1 and ${cafe.tableCount}` });

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Handle coupon
    let discount = 0, couponCode = '';
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ cafe: cafe._id, code: req.body.couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const validExpiry = !coupon.expiresAt || new Date() <= coupon.expiresAt;
        const validUsage = coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit;
        const validMin = subtotal >= coupon.minOrder;
        if (validExpiry && validUsage && validMin) {
          if (coupon.type === 'percentage') {
            discount = Math.round((subtotal * coupon.value) / 100);
            if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
          } else {
            discount = coupon.value;
          }
          discount = Math.min(discount, subtotal);
          couponCode = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    const totalAmount = subtotal - discount;
    let orderNumber, exists = true;
    while (exists) { orderNumber = generateOrderNumber(); exists = await TableOrder.findOne({ orderNumber }); }

    const order = new TableOrder({
      cafe: cafe._id, tableNumber, customerName,
      customerPhone: customerPhone || '', items,
      subtotal, discount, couponCode, totalAmount,
      specialInstructions: specialInstructions || '', orderNumber,
      paymentStatus: 'unpaid'
    });
    await order.save();

    res.status(201).json({
      message: 'Order placed successfully!',
      order: { orderNumber: order.orderNumber, tableNumber: order.tableNumber, totalAmount: order.totalAmount, status: order.status, items: order.items, createdAt: order.createdAt }
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Track order (Customer — no auth)
exports.trackOrder = async (req, res) => {
  try {
    const order = await TableOrder.findOne({ orderNumber: req.params.orderNumber.toUpperCase() }).populate('cafe', 'cafeId name');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({
      orderNumber: order.orderNumber, tableNumber: order.tableNumber,
      customerName: order.customerName, items: order.items,
      subtotal: order.subtotal || order.totalAmount, discount: order.discount || 0,
      couponCode: order.couponCode || '', totalAmount: order.totalAmount,
      status: order.status, paymentStatus: order.paymentStatus,
      specialInstructions: order.specialInstructions,
      cafeId: order.cafe?.cafeId || '', cafeName: order.cafe?.name || '',
      createdAt: order.createdAt
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders for a cafe (CafeOwner)
exports.getCafeOrders = async (req, res) => {
  try {
    const { status, date, payment } = req.query;
    const filter = { cafe: req.user.cafeId };

    if (status && status !== 'all') filter.status = status;
    if (payment === 'unpaid') filter.paymentStatus = { $ne: 'paid' };
    if (payment === 'paid') filter.paymentStatus = 'paid';

    Object.assign(filter, buildDateFilter(date));

    const orders = await TableOrder.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get cafe orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Valid food status transitions
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'completed', 'cancelled'],
  preparing: ['ready'],
  ready: ['served', 'completed'],
  served: [],
  completed: [],
  cancelled: []
};

// Update order food status (CafeOwner)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await TableOrder.findOne({ _id: req.params.id, cafe: req.user.cafeId });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const allowedNext = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNext.includes(status))
      return res.status(400).json({ message: `Cannot change from "${order.status}" to "${status}"` });

    order.status = status;
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
    const allowed = ['cash', 'upi', 'card', 'other'];
    const method = allowed.includes(paymentMethod) ? paymentMethod : 'cash';

    const order = await TableOrder.findOne({ _id: req.params.id, cafe: req.user.cafeId });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'cancelled') return res.status(400).json({ message: 'Cannot mark cancelled order as paid' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Order already paid' });

    order.paymentStatus = 'paid';
    order.paymentMethod = method;
    order.paidAt = new Date();
    await order.save();

    res.json({ message: 'Payment received!', order });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats — revenue counts ONLY paid orders (not confirm/served)
exports.getCafeStats = async (req, res) => {
  try {
    const date = req.query.date || 'today';
    const filter = { cafe: req.user.cafeId, ...buildDateFilter(date) };

    const periodOrders = await TableOrder.find(filter);

    const activeOrders = periodOrders.filter(o => o.status !== 'cancelled');
    const paidOrders = activeOrders.filter(o => o.paymentStatus === 'paid');
    const paidOrderCount = paidOrders.length;

    const totalOrders = activeOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDiscount = paidOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const pendingOrders = activeOrders.filter(o => o.status === 'pending').length;
    const preparingOrders = activeOrders.filter(o => o.status === 'preparing' || o.status === 'confirmed').length;
    const completedOrders = activeOrders.filter(o => o.status === 'served' || o.status === 'completed').length;
    const unpaidOrders = activeOrders.filter(o => o.paymentStatus !== 'paid').length;

    res.json({
      totalOrders,
      totalRevenue,
      totalDiscount,
      pendingOrders,
      preparingOrders,
      completedOrders,
      unpaidOrders,
      paidOrderCount,
      period: date
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
