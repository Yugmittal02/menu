const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const TableOrder = require('../models/TableOrder');
const offlineStore = require('../utils/offlineStore');

// 1. Get Customers (Search, Filter by Tag, Sort)
exports.getCustomers = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { search = '', tag = '', sort = 'spend' } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const list = offlineStore.getCustomers ? offlineStore.getCustomers(cafeId, { search, tag, sort }) : [];
      return res.json(list);
    }

    const query = { cafe: cafeId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (tag && tag !== 'all') {
      query.tags = tag;
    }

    let sortOption = { totalSpend: -1 };
    if (sort === 'orders') sortOption = { totalOrders: -1 };
    if (sort === 'recent') sortOption = { lastVisit: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const customers = await Customer.find(query).sort(sortOption).limit(200);
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get Customer Detail with Order History
exports.getCustomerDetail = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const customer = offlineStore.getCustomerById ? offlineStore.getCustomerById(id, cafeId) : null;
      if (!customer) return res.status(404).json({ message: 'Customer not found' });
      return res.json(customer);
    }

    const customer = await Customer.findOne({ _id: id, cafe: cafeId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    // Fetch order history by phone number or name
    const orders = await TableOrder.find({
      cafe: cafeId,
      $or: [
        { customerPhone: customer.phone },
        { customerName: customer.name }
      ]
    }).sort({ createdAt: -1 }).limit(50);

    res.json({
      customer,
      orders
    });
  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update Customer Tags / Notes / Profile
exports.updateCustomer = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;
    const { name, email, tags, notes } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.updateCustomer ? offlineStore.updateCustomer(id, { name, email, tags, notes }, cafeId) : null;
      if (!updated) return res.status(404).json({ message: 'Customer not found' });
      return res.json({ message: 'Customer updated successfully', customer: updated });
    }

    const customer = await Customer.findOne({ _id: id, cafe: cafeId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (name) customer.name = name.trim();
    if (email !== undefined) customer.email = email.trim();
    if (tags !== undefined) customer.tags = tags;
    if (notes !== undefined) customer.notes = notes;

    await customer.save();
    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Delete Customer
exports.deleteCustomer = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const deleted = offlineStore.deleteCustomer ? offlineStore.deleteCustomer(id, cafeId) : false;
      if (!deleted) return res.status(404).json({ message: 'Customer not found' });
      return res.json({ message: 'Customer deleted' });
    }

    const customer = await Customer.findOneAndDelete({ _id: id, cafe: cafeId });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    res.json({ message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Sync CRM from past orders
exports.syncCustomers = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;

    if (mongoose.connection.readyState !== 1) {
      const count = offlineStore.syncCustomers ? offlineStore.syncCustomers(cafeId) : 0;
      return res.json({ message: `Synced ${count} customers from order history`, count });
    }

    const orders = await TableOrder.find({
      cafe: cafeId,
      status: { $ne: 'cancelled' },
      customerPhone: { $exists: true, $ne: '' }
    });

    const customerMap = new Map();

    for (const ord of orders) {
      const phone = ord.customerPhone.trim();
      if (!phone) continue;

      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          cafe: cafeId,
          name: ord.customerName.trim() || 'Guest',
          phone,
          totalOrders: 0,
          totalSpend: 0,
          firstVisit: ord.createdAt,
          lastVisit: ord.createdAt,
          favoriteMap: new Map(),
          tags: []
        });
      }

      const rec = customerMap.get(phone);
      rec.totalOrders += 1;
      rec.totalSpend += (ord.grandTotal || ord.totalAmount || ord.subtotal || 0);
      if (new Date(ord.createdAt) < new Date(rec.firstVisit)) rec.firstVisit = ord.createdAt;
      if (new Date(ord.createdAt) > new Date(rec.lastVisit)) rec.lastVisit = ord.createdAt;

      (ord.items || []).forEach(it => {
        const count = rec.favoriteMap.get(it.name) || 0;
        rec.favoriteMap.set(it.name, count + it.quantity);
      });
    }

    let syncedCount = 0;
    for (const [phone, data] of customerMap.entries()) {
      const avgOrderValue = data.totalOrders > 0 ? Math.round(data.totalSpend / data.totalOrders) : 0;

      // Assign VIP / Regular tags based on dining frequency & spend
      const tags = [];
      if (data.totalSpend >= 2000) tags.push('VIP');
      if (data.totalOrders >= 3) tags.push('Regular');

      const favoriteItems = Array.from(data.favoriteMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      await Customer.findOneAndUpdate(
        { cafe: cafeId, phone },
        {
          $set: {
            name: data.name,
            totalOrders: data.totalOrders,
            totalSpend: data.totalSpend,
            avgOrderValue,
            firstVisit: data.firstVisit,
            lastVisit: data.lastVisit,
            favoriteItems
          },
          $addToSet: { tags: { $each: tags } }
        },
        { upsert: true, new: true }
      );
      syncedCount++;
    }

    res.json({ message: `Synced ${syncedCount} customers successfully`, count: syncedCount });
  } catch (error) {
    console.error('Sync customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
