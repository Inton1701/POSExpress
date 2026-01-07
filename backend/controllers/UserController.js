const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
    );
};

const user = {
    // Get all users
    getAllUsers: asyncHandler(async (req, res) => {
        try {
            const users = await User.find().select('-password').populate('store', 'storeName address contact');
            res.status(200).json({ success: true, users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
        }
    }),

    // Create a user
    createUser: asyncHandler(async (req, res) => {
        try {
            let { username, password, role, store, rfid } = req.body;

            // Validate required fields
            if (!username || !password || !role) {
                return res.status(400).json({ success: false, message: "Username, password, and role are required" });
            }

            // Role-based validation and store assignment
            if (req.user) {
                if (req.user.role === 'Co-Admin') {
                    // Co-Admin can only create Cashiers
                    if (role !== 'Cashier') {
                        return res.status(403).json({ 
                            success: false, 
                            message: "Co-Admin can only create Cashier users" 
                        });
                    }
                    // Automatically assign to Co-Admin's store
                    store = req.user.store._id;
                } else if (req.user.role === 'Admin') {
                    // Admin can create Co-Admin, Cashier, and Accounting
                    if (role !== 'Co-Admin' && role !== 'Cashier' && role !== 'Admin' && role !== 'Accounting') {
                        return res.status(400).json({ 
                            success: false, 
                            message: "Invalid role. Must be Admin, Co-Admin, Cashier, or Accounting" 
                        });
                    }
                    // Admin must specify store
                    if (!store) {
                        return res.status(400).json({ 
                            success: false, 
                            message: "Store is required for user assignment" 
                        });
                    }
                } else {
                    return res.status(403).json({ 
                        success: false, 
                        message: "You don't have permission to create users" 
                    });
                }
            } else {
                // If no user context (e.g., initial setup), require store
                if (!store) {
                    return res.status(400).json({ success: false, message: "Store is required" });
                }
            }

            // GLOBAL USERNAME CHECK: Check if username exists in Users OR Customers
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Username already exists (used by another user)" });
            }
            
            // Check in Customer collection
            const Customer = require("../models/Customer");
            const existingCustomerWithUsername = await Customer.findOne({ username });
            if (existingCustomerWithUsername) {
                return res.status(400).json({ success: false, message: "Username already exists (used by a customer)" });
            }

            // GLOBAL RFID CHECK: Check if RFID exists in Users OR Customers
            if (rfid) {
                const existingUserWithRFID = await User.findOne({ rfid });
                if (existingUserWithRFID) {
                    return res.status(400).json({ success: false, message: "RFID already exists (used by another user)" });
                }
                
                const existingCustomerWithRFID = await Customer.findOne({ rfid });
                if (existingCustomerWithRFID) {
                    return res.status(400).json({ success: false, message: "RFID already exists (used by a customer)" });
                }
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const createdUser = await User.create({
                username,
                password: hashedPassword,
                role,
                store,
                rfid: rfid || undefined // Only set if provided
            });

            // Populate store information
            await createdUser.populate('store', 'storeName address contact');

            // Return user without password
            const userResponse = {
                _id: createdUser._id,
                username: createdUser.username,
                role: createdUser.role,
                store: createdUser.store,
                createdAt: createdUser.createdAt,
                updatedAt: createdUser.updatedAt
            };

            res.status(201).json({ success: true, user: userResponse });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
        }
    }),

    // Login user
    loginUser: asyncHandler(async (req, res) => {
        try {
            const { username, password, rfid } = req.body;

            let user;

            // Login with RFID
            if (rfid) {
                user = await User.findOne({ rfid }).populate('store', 'storeName address contact');
                
                if (!user) {
                    return res.status(401).json({ success: false, message: 'Invalid RFID' });
                }
            } 
            // Login with username and password
            else if (username && password) {
                user = await User.findOne({ username }).populate('store', 'storeName address contact');
                
                if (!user) {
                    return res.status(401).json({ success: false, message: 'Invalid username or password' });
                }

                // Check password using bcrypt
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ success: false, message: 'Invalid username or password' });
                }
            } 
            // Missing required fields
            else {
                return res.status(400).json({ success: false, message: "Username and password, or RFID are required" });
            }

            // Return user without password
            const userResponse = {
                _id: user._id,
                username: user.username,
                role: user.role,
                store: user.store,
                rfid: user.rfid,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };

            // Generate JWT token
            const token = generateToken(user._id);

            res.status(200).json({ 
                success: true, 
                user: userResponse, 
                token: token,
                message: 'Login successful' 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Login failed', error: error.message });
        }
    }),

    // Get a single user by ID
    getUser: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('-password').populate('store', 'storeName address contact');
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.status(200).json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
        }
    }),

    // Update a user
    updateUser: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // GLOBAL USERNAME CHECK: If updating username, check if new username exists in Users OR Customers
            if (req.body.username && req.body.username !== user.username) {
                const existingUser = await User.findOne({ username: req.body.username });
                if (existingUser) {
                    return res.status(400).json({ success: false, message: "Username already exists (used by another user)" });
                }
                
                // Check in Customer collection
                const Customer = require("../models/Customer");
                const existingCustomerWithUsername = await Customer.findOne({ username: req.body.username });
                if (existingCustomerWithUsername) {
                    return res.status(400).json({ success: false, message: "Username already exists (used by a customer)" });
                }
            }

            // GLOBAL RFID CHECK: If updating RFID, check if new RFID exists in Users OR Customers
            if (req.body.rfid && req.body.rfid !== user.rfid) {
                const existingUserWithRFID = await User.findOne({ rfid: req.body.rfid });
                if (existingUserWithRFID) {
                    return res.status(400).json({ success: false, message: "RFID already exists (used by another user)" });
                }
                
                // Check in Customer collection
                const existingCustomerWithRFID = await Customer.findOne({ rfid: req.body.rfid });
                if (existingCustomerWithRFID) {
                    return res.status(400).json({ success: false, message: "RFID already exists (used by a customer)" });
                }
            }

            // Validate role if being updated
            if (req.body.role) {
                const validRoles = ['Admin', 'Cashier', 'Co-Admin', 'Accounting'];
                if (!validRoles.includes(req.body.role)) {
                    return res.status(400).json({ success: false, message: "Invalid role. Must be Admin, Cashier, Co-Admin, or Accounting" });
                }
            }

            // Handle password change with current password verification
            if (req.body.newPassword && req.body.currentPassword) {
                // Verify current password
                const isPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password);
                if (!isPasswordValid) {
                    return res.status(400).json({ success: false, message: "Current password is incorrect" });
                }
                
                // Hash new password
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.newPassword, salt);
            } else if (req.body.password) {
                // Legacy password update (for admin updating other users)
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            // Update other fields (exclude password fields from body)
            const allowedUpdates = ['username', 'email', 'role', 'store', 'rfid'];
            allowedUpdates.forEach(key => {
                if (req.body[key] !== undefined) {
                    user[key] = req.body[key];
                }
            });
            
            user.updatedAt = Date.now();
            await user.save();

            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(200).json({ success: true, user: userResponse, message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
        }
    }),

    // Delete a user
    deleteUser: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            await User.findByIdAndDelete(req.params.id);

            res.status(200).json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
        }
    }),

    // Update print preferences
    updatePrintPreferences: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const { selectedPrinter, printMode } = req.body;

            // Validate printMode if provided
            if (printMode && !['auto', 'manual', 'off'].includes(printMode)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid print mode. Must be auto, manual, or off' 
                });
            }

            // Update print preferences
            if (!user.printPreferences) {
                user.printPreferences = {};
            }
            
            if (selectedPrinter !== undefined) {
                user.printPreferences.selectedPrinter = selectedPrinter;
            }
            if (printMode !== undefined) {
                user.printPreferences.printMode = printMode;
            }

            user.updatedAt = Date.now();
            await user.save();

            res.status(200).json({ 
                success: true, 
                printPreferences: user.printPreferences,
                message: 'Print preferences updated successfully' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update print preferences', 
                error: error.message 
            });
        }
    }),

    // Get print preferences
    getPrintPreferences: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select('printPreferences');
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.status(200).json({ 
                success: true, 
                printPreferences: user.printPreferences || { selectedPrinter: null, printMode: 'manual' }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to fetch print preferences', 
                error: error.message 
            });
        }
    }),

    // Verify password for POS lock/unlock
    verifyPassword: asyncHandler(async (req, res) => {
        try {
            const { userId, password } = req.body;

            if (!userId || !password) {
                return res.status(400).json({ success: false, message: 'User ID and password are required' });
            }

            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            
            if (isMatch) {
                res.status(200).json({ success: true, message: 'Password verified' });
            } else {
                res.status(401).json({ success: false, message: 'Invalid password' });
            }
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to verify password', 
                error: error.message 
            });
        }
    }),

    // Verify RFID for user confirmation
    verifyUserRFID: asyncHandler(async (req, res) => {
        try {
            const { userId, rfid } = req.body;

            if (!userId || !rfid) {
                return res.status(400).json({ success: false, message: 'User ID and RFID are required' });
            }

            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (!user.rfid) {
                return res.status(400).json({ success: false, message: 'User does not have an RFID assigned' });
            }

            if (user.rfid === rfid) {
                res.status(200).json({ success: true, message: 'RFID verified' });
            } else {
                res.status(401).json({ success: false, message: 'Invalid RFID' });
            }
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to verify RFID', 
                error: error.message 
            });
        }
    }),

    // Verify admin credentials for system actions (shutdown, reboot)
    verifyAdminCredentials: asyncHandler(async (req, res) => {
        try {
            const { password, rfid } = req.body;

            if (!password && !rfid) {
                return res.status(400).json({ success: false, message: 'Password or RFID is required' });
            }

            let user;

            if (password) {
                // Find all admins and Co-Admins
                const admins = await User.find({ 
                    role: { $in: ['Admin', 'Co-Admin'] },
                    status: 'active'
                });

                // Check password against all admin users
                for (const admin of admins) {
                    const isPasswordValid = await bcrypt.compare(password, admin.password);
                    if (isPasswordValid) {
                        user = admin;
                        break;
                    }
                }

                if (!user) {
                    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
                }
            } else if (rfid) {
                // Find admin by RFID
                user = await User.findOne({ 
                    rfid: rfid,
                    role: { $in: ['Admin', 'Co-Admin'] },
                    status: 'active'
                });

                if (!user) {
                    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
                }
            }

            res.status(200).json({ 
                success: true, 
                message: 'Admin verified',
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to verify admin credentials', 
                error: error.message 
            });
        }
    })
};

module.exports = user;
