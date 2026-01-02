const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware to authenticate and extract user info from JWT token
const extractUserInfo = async (req, res, next) => {
    try {
        // Get token from Authorization header (Bearer token)
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'No token provided. User not authenticated' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id).populate('store');
        
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
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
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
