const Customer = require("../models/Customer");
const CustomerTransaction = require("../models/CustomerTransactions");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const customer = {
    // Get all customers
    getAllCustomers: asyncHandler(async (req, res) => {
        try {
            const customers = await Customer.find();
            res.status(200).json({ success: true, customers });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
        }
    }),

    // Create a customer
    createCustomer: asyncHandler(async (req, res) => {
        try {
            const { rfid, username, password, fullName, birthday, balance } = req.body;

            // Validate required fields
            if (!rfid || !username || !password || !fullName || !birthday) {
                return res.status(400).json({ success: false, message: "RFID, username, password, full name, and birthday are required" });
            }

            // Check if RFID already exists
            const existingCustomer = await Customer.findOne({ rfid });
            if (existingCustomer) {
                return res.status(400).json({ success: false, message: "RFID already exists" });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const createdCustomer = await Customer.create({
                rfid,
                username,
                password: hashedPassword,
                fullName,
                birthday,
                balance
            });

            res.status(201).json({ success: true, customer: createdCustomer });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create customer', error: error.message });
        }
    }),

    // Get a single customer by ID
    getCustomer: asyncHandler(async (req, res) => {
        try {
            const customer = await Customer.findById(req.params.id);
            
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            res.status(200).json({ success: true, customer });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch customer', error: error.message });
        }
    }),

    // Get customer by RFID
    getCustomerByRFID: asyncHandler(async (req, res) => {
        try {
            const customer = await Customer.findOne({ rfid: req.params.rfid });
            
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            res.status(200).json({ success: true, customer });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch customer', error: error.message });
        }
    }),

    // Update a customer
    updateCustomer: asyncHandler(async (req, res) => {
        try {
            const customer = await Customer.findById(req.params.id);
            
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            // If updating RFID, check if new RFID already exists
            if (req.body.rfid && req.body.rfid !== customer.rfid) {
                const existingCustomer = await Customer.findOne({ rfid: req.body.rfid });
                if (existingCustomer) {
                    return res.status(400).json({ success: false, message: "RFID already exists" });
                }
            }

            // Hash password if it's being updated
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                req.body.password = await bcrypt.hash(req.body.password, salt);
            }

            // Update fields
            Object.keys(req.body).forEach(key => {
                customer[key] = req.body[key];
            });
            customer.updatedAt = Date.now();
            await customer.save();

            res.status(200).json({ success: true, customer });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
        }
    }),

    // Update customer balance
    updateBalance: asyncHandler(async (req, res) => {
        try {
            const customer = await Customer.findById(req.params.id);
            
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            const { amount } = req.body;
            
            if (amount === undefined || isNaN(amount)) {
                return res.status(400).json({ success: false, message: 'Invalid amount' });
            }

            const balanceBefore = customer.balance;
            const balanceAfter = Number(amount);

            // Prevent negative balance
            if (balanceAfter < 0) {
                return res.status(400).json({ success: false, message: 'Insufficient balance' });
            }

            customer.balance = balanceAfter;
            customer.updatedAt = Date.now();
            await customer.save();

            res.status(200).json({ 
                success: true, 
                customer,
                balanceBefore,
                balanceAfter,
                message: 'Balance updated successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update balance', error: error.message });
        }
    }),

    // Delete a customer
    deleteCustomer: asyncHandler(async (req, res) => {
        try {
            const customer = await Customer.findById(req.params.id);
            
            if (!customer) {
                return res.status(404).json({ success: false, message: 'Customer not found' });
            }

            await Customer.findByIdAndDelete(req.params.id);

            res.status(200).json({ success: true, message: 'Customer deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
        }
    }),

    // Log a customer transaction
    logTransaction: asyncHandler(async (req, res) => {
        try {
            const { rfid, username, amount, transactionType } = req.body;
            if (!rfid || !username || transactionType === undefined) {
                return res.status(400).json({ success: false, message: "Missing required fields" });
            }
            // Fetch customer to get current balance
            const customer = await Customer.findOne({ rfid });
            let balanceBefore = undefined;
            let balanceAfter = undefined;
            if (customer) {
                balanceBefore = customer.balance;
                // For cash-in/cash-out, estimate balanceAfter
                if (transactionType === "Cash-in") {
                    balanceAfter = balanceBefore + (typeof amount === "number" ? amount : 0);
                } else if (transactionType === "Cash-out") {
                    balanceAfter = balanceBefore - (typeof amount === "number" ? amount : 0);
                } else {
                    balanceAfter = balanceBefore;
                }
            }

            // Generate transaction ID
            const timestamp = Date.now();
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const transactionId = `CT-${timestamp}-${randomNum}`;

            const transaction = await CustomerTransaction.create({
                transactionId,
                rfid,
                username,
                amount,
                transactionType,
                balanceBefore,
                balanceAfter,
            });
            res.status(201).json({ success: true, transaction });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to log transaction", error: error.message });
        }
    }),

    // Get transactions by RFID
    getTransactionsByRFID: asyncHandler(async (req, res) => {
        try {
            const { rfid } = req.params;
            const transactions = await CustomerTransaction.find({ rfid }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, transactions });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch transactions", error: error.message });
        }
    }),

    // Get all customer transactions with customer details
    getAllCustomerTransactions: asyncHandler(async (req, res) => {
        try {
            const transactions = await CustomerTransaction.find().sort({ createdAt: -1 });
            
            // Populate customer details for each transaction
            const transactionsWithCustomerInfo = await Promise.all(
                transactions.map(async (transaction) => {
                    const customer = await Customer.findOne({ rfid: transaction.rfid });
                    return {
                        _id: transaction._id,
                        transactionId: transaction.transactionId,
                        rfid: transaction.rfid,
                        customerUsername: customer ? customer.username : 'Unknown',
                        customerFullName: customer ? customer.fullName : 'Unknown',
                        amount: transaction.amount,
                        transactionType: transaction.transactionType,
                        balanceBefore: transaction.balanceBefore,
                        balanceAfter: transaction.balanceAfter,
                        createdAt: transaction.createdAt,
                        updatedAt: transaction.updatedAt
                    };
                })
            );

            res.status(200).json({ success: true, transactions: transactionsWithCustomerInfo });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch transactions", error: error.message });
        }
    }),

    // Login customer with username and password
    loginCustomer: asyncHandler(async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Username and password are required' });
            }

            // Find customer by username
            const customer = await Customer.findOne({ username });
            
            if (!customer) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            // Check if customer is disabled
            if (customer.status === 'disabled') {
                return res.status(403).json({ success: false, message: 'Customer account is disabled' });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, customer.password);
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Invalid username or password' });
            }

            // Return customer without password
            const customerResponse = {
                _id: customer._id,
                rfid: customer.rfid,
                username: customer.username,
                fullName: customer.fullName,
                birthday: customer.birthday,
                balance: customer.balance,
                status: customer.status,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt
            };

            res.status(200).json({ success: true, customer: customerResponse, message: 'Login successful' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Login failed', error: error.message });
        }
    }),

    // Verify customer password (for transaction confirmation) - Returns 200 to avoid logout
    verifyCustomerPassword: asyncHandler(async (req, res) => {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(200).json({ success: false, verified: false, message: 'Username and password are required' });
            }

            // Find customer by username
            const customer = await Customer.findOne({ username });
            
            if (!customer) {
                return res.status(200).json({ success: false, verified: false, message: 'Invalid username or password' });
            }

            // Check if customer is disabled
            if (customer.status === 'disabled') {
                return res.status(200).json({ success: false, verified: false, message: 'Customer account is disabled' });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, customer.password);
            if (!isPasswordValid) {
                return res.status(200).json({ success: false, verified: false, message: 'Invalid password' });
            }

            // Return success without customer data (just verification result)
            res.status(200).json({ success: true, verified: true, message: 'Password verified successfully' });
        } catch (error) {
            res.status(500).json({ success: false, verified: false, message: 'Verification failed', error: error.message });
        }
    }),

    // Void customer transaction (Cash-in/Cash-out)
    voidCustomerTransaction: asyncHandler(async (req, res) => {
        try {
            const { userId, transactionId, password, rfid } = req.body;

            if (!userId || !transactionId) {
                return res.status(400).json({ success: false, message: 'User ID and Transaction ID are required' });
            }

            if (!password && !rfid) {
                return res.status(400).json({ success: false, message: 'Password or RFID is required for verification' });
            }

            // Verify user credentials
            let user;
            if (password) {
                user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ success: false, message: 'Invalid password' });
                }
            } else if (rfid) {
                user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                if (user.rfid !== rfid.trim()) {
                    return res.status(401).json({ success: false, message: 'Invalid RFID' });
                }
            }

            // Find the transaction
            const transaction = await CustomerTransaction.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }

            // Check if already voided
            if (transaction.status === 'voided') {
                return res.status(400).json({ success: false, message: 'Transaction is already voided' });
            }

            // Cannot void balance inquiry or already voided transactions
            if (transaction.transactionType === 'Balance Inquiry' || transaction.transactionType === 'Voided') {
                return res.status(400).json({ success: false, message: 'Cannot void this type of transaction' });
            }

            // Find the customer - try by customerId first, then by username, then by rfid
            let customer;
            if (transaction.customerId) {
                customer = await Customer.findById(transaction.customerId);
            }
            if (!customer && transaction.customerUsername) {
                customer = await Customer.findOne({ username: transaction.customerUsername });
            }
            if (!customer && transaction.username) {
                customer = await Customer.findOne({ username: transaction.username });
            }
            if (!customer && transaction.rfid) {
                customer = await Customer.findOne({ rfid: transaction.rfid });
            }
            
            if (!customer) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Customer not found',
                    debug: {
                        customerId: transaction.customerId,
                        customerUsername: transaction.customerUsername,
                        username: transaction.username,
                        rfid: transaction.rfid
                    }
                });
            }

            // Calculate adjustment based on transaction type
            let balanceAdjustment = 0;
            if (transaction.transactionType === 'Cash-in') {
                // Deduct the added funds
                balanceAdjustment = -transaction.amount;
            } else if (transaction.transactionType === 'Cash-out') {
                // Refund the withdrawn amount
                balanceAdjustment = transaction.amount;
            }

            // Check if customer has sufficient balance for deduction
            if (balanceAdjustment < 0 && customer.balance < Math.abs(balanceAdjustment)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Customer has insufficient balance to void this transaction' 
                });
            }

            // Update customer balance
            customer.balance += balanceAdjustment;
            await customer.save();

            // Mark transaction as voided
            transaction.status = 'voided';
            transaction.voidedBy = user.username;
            transaction.voidedAt = new Date();
            await transaction.save();

            // Create a void transaction record
            const voidTransactionId = `CT${Date.now()}`
            const voidTransaction = await CustomerTransaction.create({
                transactionId: voidTransactionId,
                rfid: customer.rfid,
                username: customer.username,
                amount: balanceAdjustment, // Use signed value, not absolute
                transactionType: 'Voided',
                balanceBefore: transaction.balanceAfter,
                balanceAfter: customer.balance,
                status: 'active'
            });

            res.status(200).json({ 
                success: true, 
                message: 'Transaction voided successfully',
                customer: {
                    username: customer.username,
                    balance: customer.balance
                },
                voidTransaction
            });
        } catch (error) {
            console.error('Void transaction error:', error);
            res.status(500).json({ success: false, message: 'Failed to void transaction', error: error.message });
        }
    }),
};

module.exports = customer;
