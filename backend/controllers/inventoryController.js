const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const offlineStore = require('../utils/offlineStore');

// 1. Get Inventory Items (Tracked items, low stock warnings, out of stock)
exports.getInventory = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { status, category } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const list = offlineStore.getInventory ? offlineStore.getInventory(cafeId, { status, category }) : [];
      return res.json(list);
    }

    const filter = { cafe: cafeId };
    if (category && category !== 'all') {
      filter.category = category;
    }

    const items = await MenuItem.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });

    let filtered = items;
    if (status === 'low') {
      filtered = items.filter(i => i.trackStock && i.stockQuantity <= i.lowStockThreshold && i.stockQuantity > 0 && !i.isOutOfStock);
    } else if (status === 'out') {
      filtered = items.filter(i => i.isOutOfStock || (i.trackStock && i.stockQuantity <= 0) || !i.isAvailable);
    } else if (status === 'tracked') {
      filtered = items.filter(i => i.trackStock);
    }

    // Return inventory summary stats
    const totalItems = items.length;
    const trackedCount = items.filter(i => i.trackStock).length;
    const lowStockCount = items.filter(i => i.trackStock && i.stockQuantity <= i.lowStockThreshold && i.stockQuantity > 0 && !i.isOutOfStock).length;
    const outOfStockCount = items.filter(i => i.isOutOfStock || (i.trackStock && i.stockQuantity <= 0) || !i.isAvailable).length;

    res.json({
      summary: {
        totalItems,
        trackedCount,
        lowStockCount,
        outOfStockCount
      },
      items: filtered
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Update Single Item Stock / Configuration
exports.updateStock = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { itemId } = req.params;
    const { delta, stockQuantity, trackStock, lowStockThreshold } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.updateItemStock ? offlineStore.updateItemStock(itemId, req.body) : null;
      if (!updated) return res.status(404).json({ message: 'Item not found' });
      return res.json({ message: 'Stock updated', item: updated });
    }

    const item = await MenuItem.findOne({ _id: itemId, cafe: cafeId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    if (trackStock !== undefined) item.trackStock = Boolean(trackStock);
    if (lowStockThreshold !== undefined) item.lowStockThreshold = Math.max(0, parseInt(lowStockThreshold));

    if (delta !== undefined) {
      item.stockQuantity = Math.max(0, (item.stockQuantity || 0) + parseInt(delta));
    } else if (stockQuantity !== undefined) {
      item.stockQuantity = Math.max(0, parseInt(stockQuantity));
    }

    // Auto update out-of-stock state if stock was incremented or depleted
    if (item.trackStock) {
      if (item.stockQuantity <= 0) {
        item.isOutOfStock = true;
        item.isAvailable = false;
      } else {
        item.isOutOfStock = false;
        item.isAvailable = true;
      }
    }

    await item.save();
    res.json({ message: 'Stock updated successfully', item });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Toggle 86 / Out of Stock
exports.toggle86 = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { itemId } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.toggle86 ? offlineStore.toggle86(itemId) : null;
      if (!updated) return res.status(404).json({ message: 'Item not found' });
      return res.json({ message: `Item ${updated.isOutOfStock ? '86ed' : 'restocked'}`, item: updated });
    }

    const item = await MenuItem.findOne({ _id: itemId, cafe: cafeId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    item.isOutOfStock = !item.isOutOfStock;
    item.isAvailable = !item.isOutOfStock;

    await item.save();
    res.json({
      message: `Item marked as ${item.isOutOfStock ? 'Out of Stock (86)' : 'Available'}`,
      item
    });
  } catch (error) {
    console.error('Toggle 86 error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. Bulk Restock
exports.bulkRestock = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { items } = req.body; // array of { itemId, stockQuantity, trackStock }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: 'Items array is required' });
    }

    if (mongoose.connection.readyState !== 1) {
      if (offlineStore.bulkRestock) offlineStore.bulkRestock(cafeId, items);
      return res.json({ message: `Restocked ${items.length} items successfully` });
    }

    for (const update of items) {
      if (!update.itemId) continue;
      const doc = await MenuItem.findOne({ _id: update.itemId, cafe: cafeId });
      if (!doc) continue;

      if (update.stockQuantity !== undefined) {
        doc.stockQuantity = Math.max(0, parseInt(update.stockQuantity));
        doc.trackStock = true;
        doc.isOutOfStock = doc.stockQuantity === 0;
        doc.isAvailable = doc.stockQuantity > 0;
      }
      if (update.lowStockThreshold !== undefined) {
        doc.lowStockThreshold = Math.max(0, parseInt(update.lowStockThreshold));
      }
      await doc.save();
    }

    res.json({ message: `Restocked ${items.length} items successfully` });
  } catch (error) {
    console.error('Bulk restock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Add New Inventory Item Directly
exports.addInventoryItem = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const {
      name,
      category,
      price,
      stockQuantity,
      lowStockThreshold,
      isVeg,
      description,
      image
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, category, and price are required' });
    }

    const qty = Math.max(0, parseInt(stockQuantity) || 0);
    const threshold = lowStockThreshold !== undefined && !isNaN(parseInt(lowStockThreshold))
      ? Math.max(0, parseInt(lowStockThreshold))
      : 5;

    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(cafeId)) {
      const item = offlineStore.createMenuItem ? offlineStore.createMenuItem({
        cafe: cafeId,
        name: name.trim(),
        description: description || '',
        price: Number(price),
        image: image || '',
        category: category.trim(),
        isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
        preparationTime: 15,
        sortOrder: 0,
        trackStock: true,
        stockQuantity: qty,
        lowStockThreshold: threshold,
        isOutOfStock: qty <= 0,
        isAvailable: qty > 0
      }) : null;
      return res.status(201).json({ message: 'Inventory item created successfully', item });
    }

    const item = new MenuItem({
      cafe: cafeId,
      name: name.trim(),
      description: description || '',
      price: Number(price),
      image: image || '',
      category: category.trim(),
      isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
      preparationTime: 15,
      sortOrder: 0,
      trackStock: true,
      stockQuantity: qty,
      lowStockThreshold: threshold,
      isOutOfStock: qty <= 0,
      isAvailable: qty > 0
    });

    await item.save();
    res.status(201).json({ message: 'Inventory item created successfully', item });
  } catch (error) {
    console.error('Add inventory item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
