const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const offlineStore = require('../utils/offlineStore');

// Get all menu items for a cafe (public)
exports.getMenuByCafe = async (req, res) => {
  const rawId = (req.params.cafeId || '').trim();
  try {
    const Cafe = require('../models/Cafe');
    if (mongoose.connection.readyState === 1) {
      const orClauses = [
        { slug: rawId.toLowerCase() },
        { cafeId: rawId.toUpperCase() }
      ];
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        orClauses.push({ _id: rawId });
      }

      let cafe = await Cafe.findOne({
        $or: orClauses,
        isActive: true
      });

      if (!cafe) {
        // Check offlineStore
        cafe = offlineStore.findCafe(c =>
          (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
          c.isActive !== false
        );
        if (cafe) {
          const items = offlineStore.getMenuItems(cafe._id || cafe.cafeId);
          return res.json(items.filter(i => i.isAvailable !== false));
        }

        // Smart demo fallback
        if (['cafe', 'demo', 'sample', 'default'].includes(rawId.toLowerCase())) {
          const allCafes = offlineStore.getCafes();
          const demoCafe = allCafes.find(c => c.isActive !== false) || allCafes[0];
          if (demoCafe) {
            const items = offlineStore.getMenuItems(demoCafe._id || demoCafe.cafeId);
            return res.json(items.filter(i => i.isAvailable !== false));
          }
        }

        return res.status(404).json({ message: 'Cafe not found' });
      }

      const items = await MenuItem.find({ cafe: cafe._id, isAvailable: true })
        .sort({ sortOrder: 1, category: 1, name: 1 });

      res.json(items);
    } else {
      let cafe = offlineStore.findCafe(c =>
        (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
        c.isActive !== false
      );

      if (!cafe && ['cafe', 'demo', 'sample', 'default'].includes(rawId.toLowerCase())) {
        const allCafes = offlineStore.getCafes();
        cafe = allCafes.find(c => c.isActive !== false) || allCafes[0];
      }

      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

      const items = offlineStore.getMenuItems(cafe._id || cafe.cafeId);
      return res.json(items.filter(i => i.isAvailable !== false));
    }
  } catch (error) {
    console.error('Get menu error:', error);
    try {
      const cafe = offlineStore.findCafe(c =>
        (c.slug === rawId.toLowerCase() || c.cafeId === rawId.toUpperCase() || c._id === rawId) &&
        c.isActive !== false
      );
      if (cafe) {
        const items = offlineStore.getMenuItems(cafe._id || cafe.cafeId);
        return res.json(items.filter(i => i.isAvailable !== false));
      }
    } catch (e) {}
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all menu items for cafe owner (including unavailable)
exports.getMyMenu = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user.cafeId)) {
      const items = offlineStore.getMenuItems(req.user.cafeId);
      return res.json(items);
    }
    const items = await MenuItem.find({ cafe: req.user.cafeId })
      .sort({ category: 1, sortOrder: 1, name: 1 });
    res.json(items);
  } catch (error) {
    console.error('Get my menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add menu item (CafeOwner)
exports.addMenuItem = async (req, res) => {
  try {
    const { name, description, price, image, category, isVeg, preparationTime, sortOrder, trackStock, stockQuantity, lowStockThreshold } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, price, and category are required' });
    }

    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user.cafeId)) {
      const item = offlineStore.createMenuItem({
        cafe: req.user.cafeId,
        name,
        description: description || '',
        price: Number(price),
        image: image || '',
        category,
        isVeg: isVeg !== undefined ? isVeg : true,
        preparationTime: preparationTime || 15,
        sortOrder: sortOrder || 0,
        trackStock: Boolean(trackStock),
        stockQuantity: Number(stockQuantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5
      });
      return res.status(201).json({ message: 'Menu item added', item });
    }

    const item = new MenuItem({
      cafe: req.user.cafeId,
      name,
      description: description || '',
      price: Number(price),
      image: image || '',
      category,
      isVeg: isVeg !== undefined ? isVeg : true,
      preparationTime: preparationTime || 15,
      sortOrder: sortOrder || 0,
      trackStock: Boolean(trackStock),
      stockQuantity: Number(stockQuantity) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5
    });

    await item.save();
    res.status(201).json({ message: 'Menu item added', item });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update menu item (CafeOwner)
exports.updateMenuItem = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user.cafeId)) {
      const item = offlineStore.updateMenuItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ message: 'Menu item not found' });
      return res.json({ message: 'Menu item updated', item });
    }

    const item = await MenuItem.findOne({ _id: req.params.id, cafe: req.user.cafeId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    const allowedFields = [
      'name', 'description', 'price', 'image', 'category', 'isVeg',
      'preparationTime', 'sortOrder', 'trackStock', 'stockQuantity',
      'lowStockThreshold', 'isAvailable', 'isOutOfStock'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    res.json({ message: 'Menu item updated', item });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete menu item (CafeOwner)
exports.deleteMenuItem = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user.cafeId)) {
      offlineStore.deleteMenuItem(req.params.id);
      return res.json({ message: 'Menu item deleted' });
    }

    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, cafe: req.user.cafeId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle item availability (CafeOwner)
exports.toggleAvailability = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(req.user.cafeId)) {
      const item = offlineStore.toggleMenuItemAvailability(req.params.id);
      if (!item) return res.status(404).json({ message: 'Menu item not found' });
      return res.json({ message: `Item ${item.isAvailable ? 'available' : 'unavailable'}`, isAvailable: item.isAvailable });
    }

    const item = await MenuItem.findOne({ _id: req.params.id, cafe: req.user.cafeId });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({ message: `Item ${item.isAvailable ? 'available' : 'unavailable'}`, isAvailable: item.isAvailable });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get menu categories for a cafe (public)
exports.getCategories = async (req, res) => {
  try {
    const Cafe = require('../models/Cafe');
    const cafe = await Cafe.findOne({ cafeId: req.params.cafeId.toUpperCase(), isActive: true });
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

    const categories = await MenuItem.distinct('category', { cafe: cafe._id, isAvailable: true });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
