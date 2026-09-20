const mongoose = require('mongoose');
const TableOrder = require('../models/TableOrder');
const TableSession = require('../models/TableSession');
const Cafe = require('../models/Cafe');
const offlineStore = require('../utils/offlineStore');
const { decrementStock, updateCustomerCRM } = require('../utils/crmAndInventoryHelper');
const { calculateOrderAmounts, recalculateSessionTotals } = require('../utils/billingEngine');

// Helper: Generate collision-resistant order number: ORD-YYMMDD-XXXX
const generateOrderNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return `ORD-${dateStr}-${rand}`;
};

// Helper: Generate KOT Number
const generateKotNumber = (prefix = 'KOT') => {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

// Helper: Generate Invoice Number
const generateInvoiceNumber = (prefix = 'INV') => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${dateStr}-${num}`;
};

// Helper: Generate session code
const generateSessionCode = (tableNum) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SES-T${tableNum}-${rand}`;
};

// 1. Place POS Order (Staff Dine-in / Counter Order)
exports.placePosOrder = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const cafe = offlineStore.findCafe(cafeId) || { name: 'Cafe', tableCount: 10, taxPercent: 5 };
      const {
        orderSource = 'counter',
        orderType = 'dine-in',
        tableNumber,
        customerName = 'Guest',
        customerPhone = '',
        customerAddress = '',
        items,
        notes = '',
        specialInstructions = '',
        discount = 0,
        paymentMethod = '',
        isPaid = false,
        placedBy = 'Staff'
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one item' });
      }

      let tblNum = 0;
      if (orderType === 'dine-in') {
        tblNum = parseInt(tableNumber, 10);
        if (!tblNum || isNaN(tblNum) || tblNum < 1 || tblNum > (cafe.tableCount || 100)) {
          return res.status(400).json({ message: `A valid table number between 1 and ${cafe.tableCount || 100} is required for dine-in orders` });
        }
      }

      const { subtotal, discount: disc, taxableAmount, taxAmount, grandTotal } = calculateOrderAmounts({
        items,
        discount,
        taxPercent: cafe.taxPercent !== undefined ? cafe.taxPercent : 5
      });

      let session = null;
      if (orderType === 'dine-in' && tblNum > 0) {
        const activeSessions = offlineStore.getActiveSessions(cafeId);
        if (req.body.sessionId) {
          session = activeSessions.find(s => s._id === req.body.sessionId);
          if (session && session.tableNumber !== tblNum) {
            return res.status(400).json({
              message: `Session table (${session.tableNumber}) does not match order table (${tblNum})`
            });
          }
        }
        if (!session) {
          session = activeSessions.find(s => s.tableNumber === tblNum);
        }
        if (!session) {
          session = offlineStore.openSession({
            cafe: cafeId,
            tableNumber: tblNum,
            guestName: customerName,
            guestPhone: customerPhone,
            pax: req.body.pax || 2
          });
        }
      }

      const kotNumber = generateKotNumber(cafe.kotPrefix || 'KOT');
      const invoiceNumber = generateInvoiceNumber(cafe.invoicePrefix || 'INV');

      const order = offlineStore.createOrder({
        cafe: cafeId,
        tableNumber: tblNum,
        customerName,
        customerPhone,
        customerAddress,
        items,
        subtotal,
        discount: disc,
        taxAmount,
        grandTotal,
        totalAmount: grandTotal,
        notes,
        specialInstructions,
        orderSource,
        orderType,
        sessionId: session ? session._id : null,
        kotNumber,
        invoiceNumber: isPaid ? invoiceNumber : '',
        placedBy,
        status: isPaid ? 'Served' : 'Confirmed',
        paymentStatus: isPaid ? 'Paid' : 'Unpaid',
        paymentMethod: isPaid ? (paymentMethod || 'Cash') : ''
      });

      return res.status(201).json({
        message: 'Order created successfully',
        order,
        session
      });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

    const {
      orderSource = 'counter',
      orderType = 'dine-in',
      tableNumber,
      customerName = 'Guest',
      customerPhone = '',
      customerAddress = '',
      items,
      notes = '',
      specialInstructions = '',
      discount = 0,
      paymentMethod = '',
      isPaid = false,
      placedBy = 'Staff'
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Financial integrity checks
    for (const it of items) {
      if (!it.name || typeof it.price !== 'number' || it.price < 0 || isNaN(it.price)) {
        return res.status(400).json({ message: 'Invalid item price. Prices must be non-negative numbers.' });
      }
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item quantity. Quantities must be positive integers.' });
      }
    }

    let tblNum = 0;
    if (orderType === 'dine-in') {
      tblNum = parseInt(tableNumber, 10);
      if (!tblNum || isNaN(tblNum) || tblNum < 1 || tblNum > cafe.tableCount) {
        return res.status(400).json({ message: `A valid table number between 1 and ${cafe.tableCount} is required for dine-in orders` });
      }
    }

    // Calculate amounts using central billingEngine
    const { subtotal, discount: disc, taxableAmount, taxAmount, grandTotal } = calculateOrderAmounts({
      items,
      discount,
      taxPercent: cafe.taxPercent || 0
    });

    // Generate identifiers
    let orderNumber, exists = true;
    while (exists) {
      orderNumber = generateOrderNumber();
      exists = await TableOrder.findOne({ orderNumber });
    }

    const kotNumber = generateKotNumber(cafe.kotPrefix || 'KOT');
    const invoiceNumber = generateInvoiceNumber(cafe.invoicePrefix || 'INV');

    let session = null;
    let targetSessionId = req.body.sessionId || null;

    // Handle TableSession for Dine-In
    if (orderType === 'dine-in' && tblNum > 0) {
      if (targetSessionId) {
        session = await TableSession.findOne({ _id: targetSessionId, cafe: cafeId });
        if (session && session.tableNumber !== tblNum) {
          return res.status(400).json({
            message: `Session table (${session.tableNumber}) does not match order table (${tblNum})`
          });
        }
      }

      // If no session provided or not found, check for an existing active session on this table
      if (!session) {
        session = await TableSession.findOne({
          cafe: cafeId,
          tableNumber: tblNum,
          status: { $in: ['active', 'billing'] }
        });
      }

      // If still no session, create one automatically with retry loop for collision safety
      if (!session) {
        let sessionCode, codeExists = true;
        while (codeExists) {
          sessionCode = generateSessionCode(tblNum);
          codeExists = await TableSession.findOne({ sessionCode });
        }
        session = new TableSession({
          cafe: cafeId,
          tableNumber: tblNum,
          sessionCode,
          customerName: customerName || `Table ${tblNum} Guest`,
          customerPhone: customerPhone || '',
          pax: req.body.pax || 1,
          status: 'active',
          orders: []
        });
        await session.save();
      }

      targetSessionId = session._id;
    }

    // Determine initial order status
    let initialStatus = 'confirmed';
    if (cafe.autoAcceptOrders) initialStatus = 'preparing';

    const order = new TableOrder({
      cafe: cafeId,
      tableNumber: tblNum,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      discount: disc,
      totalAmount: grandTotal,
      taxAmount,
      grandTotal,
      notes,
      specialInstructions,
      orderNumber,
      orderSource,
      orderType,
      sessionId: targetSessionId,
      kotNumber,
      kotPrintedAt: new Date(),
      invoiceNumber: isPaid ? invoiceNumber : '',
      invoicePrintedAt: isPaid ? new Date() : null,
      placedBy,
      status: initialStatus,
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      paymentMethod: isPaid ? (paymentMethod || 'cash') : '',
      paidAt: isPaid ? new Date() : null
    });

    await order.save();

    // Attach order to session and authoritatively recalculate running totals
    if (session) {
      session.orders.push(order._id);
      const sessionOrders = await TableOrder.find({
        _id: { $in: session.orders },
        status: { $ne: 'cancelled' }
      });
      const sessionCalc = recalculateSessionTotals({ orders: sessionOrders }, cafe);
      session.subtotal = sessionCalc.subtotal;
      session.discount = sessionCalc.discount;
      session.taxAmount = sessionCalc.taxAmount;
      session.grandTotal = sessionCalc.grandTotal;
      await session.save();
    }

    // Phase 2: Auto-decrement stock & Update Customer CRM
    decrementStock(cafeId, items);
    updateCustomerCRM(cafeId, { customerName, customerPhone, items, totalAmount: grandTotal });

    res.status(201).json({
      message: 'Order created successfully',
      order,
      session
    });
  } catch (error) {
    console.error('Place POS order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Quick Takeaway Order (Counter Express)
exports.quickTakeaway = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const cafe = offlineStore.findCafe(cafeId) || { name: 'Cafe', taxPercent: 5 };
      const {
        customerName = 'Takeaway Guest',
        customerPhone = '',
        customerAddress = '',
        items,
        notes = '',
        discount = 0,
        paymentMethod = 'cash',
        isPaid = true
      } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must contain items' });
      }

      const subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      const disc = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
      const taxableAmount = Math.max(0, subtotal - disc);
      const taxAmount = Math.round((taxableAmount * (cafe.taxPercent || 5)) / 100);
      const grandTotal = taxableAmount + taxAmount;

      const kotNumber = generateKotNumber(cafe.kotPrefix || 'KOT');
      const invoiceNumber = generateInvoiceNumber(cafe.invoicePrefix || 'INV');

      const order = offlineStore.createOrder({
        cafe: cafeId,
        tableNumber: 0,
        customerName,
        customerPhone,
        customerAddress,
        items,
        subtotal,
        discount: disc,
        taxAmount,
        grandTotal,
        totalAmount: grandTotal,
        notes,
        orderSource: 'takeaway',
        orderType: 'takeaway',
        kotNumber,
        invoiceNumber,
        placedBy: 'Counter Staff',
        status: isPaid ? 'Completed' : 'Confirmed',
        paymentStatus: isPaid ? 'Paid' : 'Unpaid',
        paymentMethod: isPaid ? paymentMethod : ''
      });

      return res.status(201).json({
        message: 'Takeaway order processed successfully',
        order
      });
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

    const {
      customerName = 'Takeaway Guest',
      customerPhone = '',
      customerAddress = '',
      items,
      notes = '',
      discount = 0,
      paymentMethod = 'cash',
      isPaid = true
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain items' });
    }

    // Financial integrity checks
    for (const it of items) {
      if (!it.name || typeof it.price !== 'number' || it.price < 0 || isNaN(it.price)) {
        return res.status(400).json({ message: 'Invalid item price. Prices must be non-negative numbers.' });
      }
      if (!Number.isInteger(it.quantity) || it.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid item quantity. Quantities must be positive integers.' });
      }
    }

    const subtotal = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const disc = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));
    const taxableAmount = Math.max(0, subtotal - disc);
    const taxAmount = Math.round((taxableAmount * (cafe.taxPercent || 0)) / 100);
    const grandTotal = taxableAmount + taxAmount;

    let orderNumber, exists = true;
    while (exists) {
      orderNumber = generateOrderNumber();
      exists = await TableOrder.findOne({ orderNumber });
    }

    const kotNumber = generateKotNumber(cafe.kotPrefix || 'KOT');
    const invoiceNumber = generateInvoiceNumber(cafe.invoicePrefix || 'INV');

    const order = new TableOrder({
      cafe: cafeId,
      tableNumber: 0,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      discount: disc,
      totalAmount: grandTotal,
      taxAmount,
      grandTotal,
      notes,
      orderNumber,
      orderSource: 'takeaway',
      orderType: 'takeaway',
      kotNumber,
      kotPrintedAt: new Date(),
      invoiceNumber,
      invoicePrintedAt: isPaid ? new Date() : null,
      placedBy: 'Counter Staff',
      status: isPaid ? 'completed' : 'confirmed',
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      paymentMethod: isPaid ? paymentMethod : '',
      paidAt: isPaid ? new Date() : null,
      completedAt: isPaid ? new Date() : null
    });

    await order.save();

    // Phase 2: Auto-decrement stock & Update Customer CRM
    decrementStock(cafeId, items);
    updateCustomerCRM(cafeId, { customerName, customerPhone, customerAddress, items, totalAmount: grandTotal });

    res.status(201).json({
      message: 'Takeaway order processed successfully',
      order
    });
  } catch (error) {
    console.error('Quick takeaway error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Get KOT Data for Printing
exports.getKotData = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const orderId = req.params.orderId;

    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(orderId)) {
      const order = offlineStore.getOrderById(orderId);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      const cafe = offlineStore.findCafe(c => (c._id === cafeId || c.cafeId === cafeId)) || { name: 'Cafe', phone: '' };

      return res.json({
        kotNumber: order.kotNumber || generateKotNumber(cafe.kotPrefix || 'KOT'),
        printedAt: new Date(),
        tableNumber: order.tableNumber,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        orderSource: order.orderSource,
        placedBy: order.placedBy || 'Staff',
        customerName: order.customerName,
        items: order.items,
        notes: order.notes,
        specialInstructions: order.specialInstructions,
        cafe: {
          name: cafe.name,
          phone: cafe.phone
        }
      });
    }

    try {
      const order = await TableOrder.findOne({ _id: orderId, cafe: cafeId });
      if (!order) {
        const offOrder = offlineStore.getOrderById(orderId);
        if (offOrder) {
          const cafe = offlineStore.findCafe(c => (c._id === cafeId || c.cafeId === cafeId)) || { name: 'Cafe', phone: '' };
          return res.json({
            kotNumber: offOrder.kotNumber || generateKotNumber(cafe.kotPrefix || 'KOT'),
            printedAt: new Date(),
            tableNumber: offOrder.tableNumber,
            orderNumber: offOrder.orderNumber,
            orderType: offOrder.orderType,
            orderSource: offOrder.orderSource,
            placedBy: offOrder.placedBy || 'Staff',
            customerName: offOrder.customerName,
            items: offOrder.items,
            notes: offOrder.notes,
            specialInstructions: offOrder.specialInstructions,
            cafe: { name: cafe.name, phone: cafe.phone }
          });
        }
        return res.status(404).json({ message: 'Order not found' });
      }

      const cafe = await Cafe.findById(cafeId);

      // If KOT number not yet generated, create it
      if (!order.kotNumber) {
        order.kotNumber = generateKotNumber(cafe?.kotPrefix || 'KOT');
      }
      order.kotPrintedAt = new Date();
      await order.save();

      res.json({
        kotNumber: order.kotNumber,
        printedAt: order.kotPrintedAt,
        tableNumber: order.tableNumber,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        orderSource: order.orderSource,
        placedBy: order.placedBy,
        customerName: order.customerName,
        items: order.items,
        notes: order.notes,
        specialInstructions: order.specialInstructions,
        cafe: {
          name: cafe?.name || 'Cafe',
          phone: cafe?.phone || ''
        }
      });
    } catch (dbErr) {
      const offOrder = offlineStore.getOrderById(orderId);
      if (offOrder) {
        const cafe = offlineStore.findCafe(c => (c._id === cafeId || c.cafeId === cafeId)) || { name: 'Cafe', phone: '' };
        return res.json({
          kotNumber: offOrder.kotNumber || generateKotNumber(cafe.kotPrefix || 'KOT'),
          printedAt: new Date(),
          tableNumber: offOrder.tableNumber,
          orderNumber: offOrder.orderNumber,
          orderType: offOrder.orderType,
          orderSource: offOrder.orderSource,
          placedBy: offOrder.placedBy || 'Staff',
          customerName: offOrder.customerName,
          items: offOrder.items,
          notes: offOrder.notes,
          specialInstructions: offOrder.specialInstructions,
          cafe: { name: cafe.name, phone: cafe.phone }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('Get KOT data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Get Invoice / Bill Data (by Session ID or Order ID)
exports.getInvoiceData = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { sessionId } = req.params;
    const { orderId } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const cafe = offlineStore.findCafe(cafeId) || { name: 'Cafe', currency: '₹', taxPercent: 5, taxLabel: 'GST' };
      if (sessionId && sessionId !== 'order') {
        const session = offlineStore.getSessionById(sessionId);
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const validOrders = (session.orders || []).filter(o => (o.status || '').toLowerCase() !== 'cancelled');
        const itemMap = new Map();
        validOrders.forEach(ord => {
          (ord.items || []).forEach(it => {
            const key = `${it.name}-${it.price}`;
            if (itemMap.has(key)) {
              const existing = itemMap.get(key);
              existing.quantity += it.quantity;
              existing.total += (it.price * it.quantity);
            } else {
              itemMap.set(key, {
                name: it.name,
                price: it.price,
                quantity: it.quantity,
                total: it.price * it.quantity
              });
            }
          });
        });

        const consolidatedItems = Array.from(itemMap.values());
        const subtotal = session.subtotal || consolidatedItems.reduce((s, i) => s + i.total, 0);
        const discount = session.discount || session.discountAmount || 0;
        const taxable = Math.max(0, subtotal - discount);
        const taxAmount = session.taxAmount || Math.round((taxable * (cafe.taxPercent || 5)) / 100);
        const grandTotal = session.grandTotal || (taxable + taxAmount);

        return res.json({
          invoiceNumber: session.invoiceNumber || generateInvoiceNumber(cafe.invoicePrefix || 'INV'),
          invoiceDate: session.paidAt || session.closedAt || new Date(),
          sessionCode: session.sessionCode,
          tableNumber: session.tableNumber,
          customerName: session.customerName || session.guestName,
          customerPhone: session.customerPhone || session.guestPhone,
          pax: session.pax,
          orderType: 'dine-in',
          items: consolidatedItems,
          subtotal,
          discount,
          taxPercent: cafe.taxPercent || 5,
          taxLabel: cafe.taxLabel || 'GST',
          taxAmount,
          grandTotal,
          paymentStatus: session.paymentStatus,
          paymentMethod: session.paymentMethod || 'Cash',
          openedAt: session.openedAt,
          closedAt: session.closedAt,
          cafe: {
            name: cafe.name,
            phone: cafe.phone,
            email: cafe.email,
            address: cafe.address,
            city: cafe.city,
            currency: cafe.currency || '₹',
            footerText: cafe.footerText || 'Thank you for visiting!'
          }
        });
      } else if (orderId) {
        const order = offlineStore.getOrderById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        return res.json({
          invoiceNumber: order.invoiceNumber || generateInvoiceNumber(cafe.invoicePrefix || 'INV'),
          invoiceDate: order.paidAt || order.createdAt,
          orderNumber: order.orderNumber,
          tableNumber: order.tableNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          orderType: order.orderType,
          items: (order.items || []).map(it => ({
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            total: it.price * it.quantity
          })),
          subtotal: order.subtotal || order.totalAmount,
          discount: order.discount || 0,
          taxPercent: cafe.taxPercent || 5,
          taxLabel: cafe.taxLabel || 'GST',
          taxAmount: order.taxAmount || 0,
          grandTotal: order.grandTotal || order.totalAmount,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod || 'Cash',
          cafe: {
            name: cafe.name,
            phone: cafe.phone,
            email: cafe.email,
            address: cafe.address,
            city: cafe.city,
            currency: cafe.currency || '₹',
            footerText: cafe.footerText || 'Thank you for visiting!'
          }
        });
      }
    }

    const cafe = await Cafe.findById(cafeId);
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

    let invoiceData = null;

    if (sessionId && sessionId !== 'order') {
      // Session bill
      const session = await TableSession.findOne({ _id: sessionId, cafe: cafeId }).populate('orders');
      if (!session) return res.status(404).json({ message: 'Session not found' });

      // Consolidate all items across valid orders
      const validOrders = (session.orders || []).filter(o => o.status !== 'cancelled');
      const itemMap = new Map();

      validOrders.forEach(ord => {
        (ord.items || []).forEach(it => {
          const key = `${it.name}-${it.price}`;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key);
            existing.quantity += it.quantity;
            existing.total += (it.price * it.quantity);
          } else {
            itemMap.set(key, {
              name: it.name,
              price: it.price,
              quantity: it.quantity,
              total: it.price * it.quantity
            });
          }
        });
      });

      const consolidatedItems = Array.from(itemMap.values());
      const subtotal = session.subtotal || consolidatedItems.reduce((s, i) => s + i.total, 0);
      const discount = session.discount || 0;
      const taxable = Math.max(0, subtotal - discount);
      const taxAmount = session.taxAmount || Math.round((taxable * (cafe.taxPercent || 0)) / 100);
      const grandTotal = session.grandTotal || (taxable + taxAmount);

      const invoiceNumber = generateInvoiceNumber(cafe.invoicePrefix || 'INV');

      invoiceData = {
        invoiceNumber,
        invoiceDate: session.paidAt || session.closedAt || new Date(),
        sessionCode: session.sessionCode,
        tableNumber: session.tableNumber,
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        pax: session.pax,
        orderType: 'dine-in',
        items: consolidatedItems,
        subtotal,
        discount,
        taxPercent: cafe.taxPercent || 0,
        taxLabel: cafe.taxLabel || 'GST',
        taxAmount,
        grandTotal,
        paymentStatus: session.paymentStatus,
        paymentMethod: session.paymentMethod || 'cash',
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        cafe: {
          name: cafe.name,
          phone: cafe.phone,
          email: cafe.email,
          address: cafe.address,
          city: cafe.city,
          currency: cafe.currency || '₹',
          footerText: cafe.footerText || 'Thank you for visiting!'
        }
      };
    } else if (orderId) {
      // Standalone order bill (Takeaway / Single Order)
      const order = await TableOrder.findOne({ _id: orderId, cafe: cafeId });
      if (!order) return res.status(404).json({ message: 'Order not found' });

      if (!order.invoiceNumber) {
        order.invoiceNumber = generateInvoiceNumber(cafe.invoicePrefix || 'INV');
        await order.save();
      }

      invoiceData = {
        invoiceNumber: order.invoiceNumber,
        invoiceDate: order.paidAt || order.createdAt,
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderType: order.orderType,
        items: order.items.map(it => ({
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          total: it.price * it.quantity
        })),
        subtotal: order.subtotal || order.totalAmount,
        discount: order.discount || 0,
        taxPercent: cafe.taxPercent || 0,
        taxLabel: cafe.taxLabel || 'GST',
        taxAmount: order.taxAmount || 0,
        grandTotal: order.grandTotal || order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod || 'cash',
        cafe: {
          name: cafe.name,
          phone: cafe.phone,
          email: cafe.email,
          address: cafe.address,
          city: cafe.city,
          currency: cafe.currency || '₹',
          footerText: cafe.footerText || 'Thank you for visiting!'
        }
      };
    } else {
      return res.status(400).json({ message: 'Session ID or Order ID is required' });
    }

    res.json(invoiceData);
  } catch (error) {
    console.error('Get invoice data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Mark Invoice Printed
exports.markInvoicePrinted = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const now = new Date();

    if (mongoose.connection.readyState !== 1) {
      return res.json({ message: 'Invoice marked as printed', timestamp: now });
    }

    if (sessionId) {
      await TableOrder.updateMany(
        { sessionId, cafe: req.user.cafeId },
        { $set: { invoicePrintedAt: now } }
      );
    }
    res.json({ message: 'Invoice marked as printed', timestamp: now });
  } catch (error) {
    console.error('Mark invoice printed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
