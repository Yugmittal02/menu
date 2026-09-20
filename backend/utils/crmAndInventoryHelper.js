const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Customer = require('../models/Customer');
const offlineStore = require('./offlineStore');

/**
 * Automatically decrements stock for any ordered item that has `trackStock: true`.
 * If stock reaches 0 or below, automatically marks the item as out of stock (86).
 */
async function decrementStock(cafeId, items) {
  if (!items || !Array.isArray(items) || items.length === 0) return;

  try {
    if (mongoose.connection.readyState !== 1) {
      if (offlineStore.decrementStock) {
        offlineStore.decrementStock(cafeId, items);
      }
      return;
    }

    for (const it of items) {
      const query = { cafe: cafeId };
      if (it.menuItemId) {
        query._id = it.menuItemId;
      } else {
        query.name = it.name;
      }

      const menuItem = await MenuItem.findOne(query);
      if (menuItem && menuItem.trackStock) {
        const qty = it.quantity || 1;
        menuItem.stockQuantity = Math.max(0, (menuItem.stockQuantity || 0) - qty);
        if (menuItem.stockQuantity <= 0) {
          menuItem.isOutOfStock = true;
          menuItem.isAvailable = false;
        }
        await menuItem.save();
      }
    }
  } catch (err) {
    console.error('Stock decrement error:', err.message);
  }
}

/**
 * Automatically creates or updates the Customer CRM record when an order is placed.
 * Updates total spend, order count, favorite items, and assigns VIP/Regular tags.
 */
async function updateCustomerCRM(cafeId, { customerName, customerPhone, customerEmail = '', items = [], totalAmount = 0 }) {
  const phone = customerPhone ? customerPhone.trim() : '';
  if (!phone) return;

  try {
    if (mongoose.connection.readyState !== 1) {
      if (offlineStore.updateCustomerFromOrder) {
        offlineStore.updateCustomerFromOrder(cafeId, { customerName, customerPhone, customerEmail, items, totalAmount });
      }
      return;
    }

    let customer = await Customer.findOne({ cafe: cafeId, phone });
    const now = new Date();

    if (!customer) {
      customer = new Customer({
        cafe: cafeId,
        name: customerName ? customerName.trim() : 'Guest',
        phone,
        email: customerEmail ? customerEmail.trim() : '',
        totalOrders: 1,
        totalSpend: Math.round(totalAmount),
        avgOrderValue: Math.round(totalAmount),
        firstVisit: now,
        lastVisit: now,
        favoriteItems: (items || []).map(i => ({ name: i.name, count: i.quantity || 1 })),
        tags: []
      });
    } else {
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpend = (customer.totalSpend || 0) + Math.round(totalAmount);
      customer.avgOrderValue = Math.round(customer.totalSpend / customer.totalOrders);
      customer.lastVisit = now;
      if (customerName && customerName !== 'Guest') {
        customer.name = customerName.trim();
      }

      // Update favorite items
      const favMap = new Map();
      (customer.favoriteItems || []).forEach(f => favMap.set(f.name, f.count));
      (items || []).forEach(i => {
        const cur = favMap.get(i.name) || 0;
        favMap.set(i.name, cur + (i.quantity || 1));
      });
      customer.favoriteItems = Array.from(favMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }

    // Assign automatic loyalty tags
    const tags = new Set(customer.tags || []);
    if (customer.totalSpend >= 2000) tags.add('VIP');
    if (customer.totalOrders >= 3) tags.add('Regular');
    customer.tags = Array.from(tags);

    await customer.save();
  } catch (err) {
    console.error('Customer CRM update error:', err.message);
  }
}

module.exports = {
  decrementStock,
  updateCustomerCRM
};
