const Product = require('../models/Product');
const Category = require('../models/Category');

exports.getAllProducts = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        if (category && category !== 'All') {
            // Support both slug and ObjectId lookups
            const cat = await Category.findOne({
                $or: [
                    { slug: category.toLowerCase() },
                    { name: new RegExp(`^${category}$`, 'i') }
                ]
            });
            if (cat) {
                query = {
                    $or: [
                        { category: cat._id },
                        { subcategories: new RegExp(`^${category}$`, 'i') }
                    ]
                };
            } else {
                // Fallback: try subcategory match
                query = { subcategories: new RegExp(`^${category}$`, 'i') };
            }
        }

        const products = await Product.find(query)
            .populate('category', 'name slug icon colorFrom colorTo')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug icon colorFrom colorTo');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // If category is sent as a string name/slug, resolve to ObjectId
        if (productData.category && typeof productData.category === 'string' && !productData.category.match(/^[0-9a-fA-F]{24}$/)) {
            const cat = await Category.findOne({
                $or: [
                    { slug: productData.category.toLowerCase() },
                    { name: new RegExp(`^${productData.category}$`, 'i') }
                ]
            });
            if (cat) {
                productData.category = cat._id;
            } else {
                return res.status(400).json({ message: `Category "${productData.category}" not found` });
            }
        }

        const product = new Product(productData);
        await product.save();
        
        const populated = await Product.findById(product._id)
            .populate('category', 'name slug icon colorFrom colorTo');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // If category is sent as a string name/slug, resolve to ObjectId
        if (productData.category && typeof productData.category === 'string' && !productData.category.match(/^[0-9a-fA-F]{24}$/)) {
            const cat = await Category.findOne({
                $or: [
                    { slug: productData.category.toLowerCase() },
                    { name: new RegExp(`^${productData.category}$`, 'i') }
                ]
            });
            if (cat) {
                productData.category = cat._id;
            } else {
                return res.status(400).json({ message: `Category "${productData.category}" not found` });
            }
        }

        const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true })
            .populate('category', 'name slug icon colorFrom colorTo');
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
};

exports.toggleAvailability = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        product.isAvailable = !product.isAvailable;
        await product.save();
        
        const populated = await Product.findById(product._id)
            .populate('category', 'name slug icon colorFrom colorTo');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling availability' });
    }
};

exports.deleteAllProducts = async (req, res) => {
    try {
        const result = await Product.deleteMany({});
        res.json({ message: `Deleted ${result.deletedCount} products` });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting all products' });
    }
};
