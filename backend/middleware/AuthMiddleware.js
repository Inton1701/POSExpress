const User = require("../models/User");

// Middleware to extract user info from request
// In a real app, you would validate JWT tokens here
const extractUserInfo = async (req, res, next) => {
    try {
        // For now, we expect userId in headers or body
        // In production, extract from JWT token
        const userId = req.headers['x-user-id'] || req.body.userId;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const user = await User.findById(userId).populate('store');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Attach user info to request
        req.user = {
            id: user._id,
            username: user.username,
            role: user.role,
            store: user.store
        };

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authentication failed', error: error.message });
    }
};

// Check if user is Admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }
};

// Check if user is Co-Admin or Admin
const isCoAdminOrAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Co-Admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Co-Admin or Admin only.' });
    }
};

// Check if user has access to store
const canAccessStore = (storeId) => {
    return (req, res, next) => {
        if (req.user.role === 'Admin') {
            // Admin can access any store
            next();
        } else if (req.user.role === 'Co-Admin' && req.user.store._id.toString() === storeId) {
            // Co-Admin can only access their own store
            next();
        } else {
            res.status(403).json({ success: false, message: 'Access denied to this store.' });
        }
    };
};

// Check if user is Accounting
const isAccounting = (req, res, next) => {
    if (req.user && req.user.role === 'Accounting') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Accounting only.' });
    }
};

// Check if user can manage customers (Admin, Co-Admin, or Accounting)
const canManageCustomers = (req, res, next) => {
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Co-Admin' || req.user.role === 'Accounting')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
    }
};

module.exports = {
    extractUserInfo,
    isAdmin,
    isCoAdminOrAdmin,
    canAccessStore,
    isAccounting,
    canManageCustomers
};
