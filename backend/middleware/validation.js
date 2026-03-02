const { body, param, validationResult } = require('express-validator');

// Validation error handler
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            message: 'Validation failed',
            errors: errors.array().map(e => e.msg)
        });
    }
    next();
};

// Customer registration validation
const validateCustomer = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
        .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters'),
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone is required')
        .matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number'),
    handleValidation
];

// Admin login validation
const validateAdminLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    handleValidation
];

// Product validation
const validateProduct = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required'),
    body('basePrice')
        .notEmpty().withMessage('Price is required')
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    handleValidation
];

// Order validation
const validateOrder = [
    body('items')
        .isArray({ min: 1 }).withMessage('Order must have at least one item'),
    body('items.*.name')
        .notEmpty().withMessage('Item name is required'),
    body('items.*.quantity')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('totalAmount')
        .isFloat({ min: 0 }).withMessage('Total amount must be positive'),
    body('orderType')
        .isIn(['Dine-in', 'Takeaway', 'Delivery']).withMessage('Invalid order type'),
    body('paymentMethod')
        .isIn(['Cash', 'Online', 'UPI', 'Razorpay']).withMessage('Invalid payment method'),
    handleValidation
];

// Coupon validation
const validateCoupon = [
    body('code')
        .trim()
        .notEmpty().withMessage('Coupon code is required')
        .isLength({ min: 3, max: 20 }).withMessage('Invalid coupon code'),
    body('orderTotal')
        .isFloat({ min: 0 }).withMessage('Order total must be positive'),
    handleValidation
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
    param(paramName)
        .isMongoId().withMessage('Invalid ID format'),
    handleValidation
];

module.exports = {
    validateCustomer,
    validateAdminLogin,
    validateProduct,
    validateOrder,
    validateCoupon,
    validateObjectId,
    handleValidation
};
