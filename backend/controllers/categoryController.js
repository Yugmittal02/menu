const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all categories (public)
exports.getAllCategories = async (req, res) => {
    try {
        const filter = {};
        // By default only show active categories for public
        if (!req.user || req.user.role !== 'admin') {
            filter.isActive = true;
        }
        const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });

        // Get product counts for each category
        const categoriesWithCounts = await Promise.all(
            categories.map(async (cat) => {
                const productCount = await Product.countDocuments({ category: cat._id, isAvailable: true });
                return { ...cat.toObject(), productCount };
            })
        );

        res.json(categoriesWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get category by slug (public)
exports.getCategoryBySlug = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        
        const productCount = await Product.countDocuments({ category: category._id, isAvailable: true });
        res.json({ ...category.toObject(), productCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create category (admin)
exports.createCategory = async (req, res) => {
    try {
        const { name, description, image, icon, colorFrom, colorTo, sortOrder, isActive, isQuickPick } = req.body;
        
        if (!name) return res.status(400).json({ message: 'Category name is required' });

        const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existing) return res.status(400).json({ message: 'Category already exists' });

        const category = new Category({
            name, description, image, icon,
            colorFrom, colorTo, sortOrder,
            isActive: isActive !== undefined ? isActive : true,
            isQuickPick: isQuickPick || false
        });
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update category (admin)
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete category (admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        // Check if any products use this category
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(400).json({
                message: `Cannot delete — ${productCount} products are using this category. Reassign them first.`
            });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
