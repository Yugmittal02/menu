const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Customer registration (simple, for order tracking)
exports.registerCustomer = async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }
        
        let user = await User.findOne({ phone, role: 'customer' });
        
        if (user) {
            // Returning customer
            if (user.password && password) {
                const isMatch = await user.comparePassword(password);
                if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });
            } else if (user.password && !password) {
                return res.status(400).json({ message: 'Password required for this account' });
            }
            
            // Log login activity
            user.activity.push({ type: 'login', description: 'Logged in', timestamp: new Date() });
            await user.save();
            
            const token = jwt.sign(
                { userId: user._id, role: user.role }, 
                process.env.JWT_SECRET, 
                { expiresIn: '365d' }
            );
            // Return only safe user fields (never expose password hash, activity, cart)
            const safeUser = { _id: user._id, name: user.name, phone: user.phone, role: user.role, addresses: user.addresses };
            return res.json({ token, user: safeUser, message: 'Welcome back!' });
        }

        // New customer
        user = new User({ 
            name, 
            phone, 
            role: 'customer',
            password: password || undefined,
            activity: [{ type: 'signup', description: 'Account created', timestamp: new Date() }]
        });
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '365d' }
        );
        
        // Return only safe user fields (never expose password hash, activity, cart)
        const safeUser = { _id: user._id, name: user.name, phone: user.phone, role: user.role, addresses: user.addresses };
        res.status(201).json({ token, user: safeUser, message: 'Welcome!' });
    } catch (error) {
        // Handle duplicate key error on phone (stale unique index)
        if (error.code === 11000 && error.keyPattern?.phone) {
            // Try to find and login existing user instead
            try {
                const existingUser = await User.findOne({ phone: req.body.phone });
                if (existingUser) {
                    const token = jwt.sign(
                        { userId: existingUser._id, role: existingUser.role },
                        process.env.JWT_SECRET,
                        { expiresIn: '365d' }
                    );
                    const safeUser = { _id: existingUser._id, name: existingUser.name, phone: existingUser.phone, role: existingUser.role, addresses: existingUser.addresses };
                    return res.json({ token, user: safeUser, message: 'Welcome back!' });
                }
            } catch (innerError) {
                console.error('Fallback login error:', innerError);
            }
        }
        console.error('registerCustomer error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin login with password
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );
        
        res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role }, message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create admin (for initial setup)
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) return res.status(400).json({ message: 'Admin already exists' });

        const admin = new User({ 
            name, email, password, 
            phone: phone || '0000000000',
            role: 'admin' 
        });
        await admin.save();
        
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// ---- Cart Sync ----

// Save cart to DB
exports.syncCart = async (req, res) => {
    try {
        const { cart } = req.body;
        await User.findByIdAndUpdate(req.user.userId, { cart: cart || [] });
        res.json({ message: 'Cart synced' });
    } catch (error) {
        res.status(500).json({ message: 'Error syncing cart', error: error.message });
    }
};

// Get cart from DB
exports.getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('cart');
        res.json(user?.cart || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};

// ---- Activity Log ----

// Log an activity
exports.logActivity = async (req, res) => {
    try {
        const { type, description, orderId, amount } = req.body;
        await User.findByIdAndUpdate(req.user.userId, {
            $push: { activity: { type, description, orderId, amount, timestamp: new Date() } }
        });
        res.json({ message: 'Activity logged' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging activity', error: error.message });
    }
};

// Get activity log
exports.getActivity = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('activity');
        const sorted = (user?.activity || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(sorted);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity', error: error.message });
    }
};
