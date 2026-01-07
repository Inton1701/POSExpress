const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const Addon = require("../models/Addon");
const TransactionSession = require("../models/TransactionSession");
const asyncHandler = require("express-async-handler");

// Generate unique 9-digit transaction ID
const generateTransactionId = () => {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
};

const transaction = {
  // Get all transactions
  getAllTransactions: asyncHandler(async (req, res) => {
    try {
      let query = {};
      
      // If user is Co-Admin, filter transactions by their store
      if (req.user && req.user.role === 'Co-Admin' && req.user.store) {
        query.store = req.user.store._id || req.user.store;
      }
      // Admin sees all transactions
      
      const transactions = await Transaction.find(query)
        .populate('customerId', 'fullName email rfid balance')
        .sort({ createdAt: -1 });
      res.status(200).json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
  }),

  // Create a transaction
  createTransaction: asyncHandler(async (req, res) => {
    try {
      // Check if transaction session is active
      const session = await TransactionSession.findOne({ isActive: true });
      if (!session) {
        return res.status(403).json({ 
          success: false, 
          message: 'Transaction session is not active. Please start the session first.' 
        });
      }

      const { 
        cart, 
        paymentMethod, 
        discounts, 
        netAmount, 
        VAT, 
        totalAmount, 
        cash, 
        change, 
        employee,
        customerId,
        customerRfid,
        store
      } = req.body;

      console.log('Creating transaction with data:', { cart, paymentMethod, totalAmount, store });

      // Validate required fields
      if (!cart || cart.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is required' });
      }
      if (!paymentMethod) {
        return res.status(400).json({ success: false, message: 'Payment method is required' });
      }
      if (totalAmount === undefined || totalAmount < 0) {
        return res.status(400).json({ success: false, message: 'Invalid total amount' });
      }

      // Generate unique transaction ID
      let transactionId = generateTransactionId();
      
      // Ensure uniqueness
      let existingTransaction = await Transaction.findOne({ transactionId });
      while (existingTransaction) {
        transactionId = generateTransactionId();
        existingTransaction = await Transaction.findOne({ transactionId });
      }

      console.log('Generated transaction ID:', transactionId);

      // Update stock for each item in cart
      const StockHistory = require('../models/StockHistory');
      
      for (const item of cart) {
        if (item.isVariant && item.variantId) {
          // Update variant stock
          const variant = await Variant.findById(item.variantId);
          if (variant) {
            if (variant.quantity < item.quantity) {
              return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock for ${item.name}. Available: ${variant.quantity}, Requested: ${item.quantity}` 
              });
            }
            const prevQuantity = variant.quantity;
            variant.quantity -= item.quantity;
            await variant.save();
            
            // Create stock history entry
            await StockHistory.create({
              sku: variant.sku,
              product: item.name,
              prevStock: prevQuantity,
              change: -item.quantity,
              newStock: variant.quantity,
              reason: 'Purchased',
              updatedBy: employee || 'System',
              transactionType: 'Purchased',
              transactionId: transactionId
            });
          }
        } else if (item.productId) {
          // Update product stock
          const product = await Product.findById(item.productId);
          if (product) {
            if (product.quantity < item.quantity) {
              return res.status(400).json({ 
                success: false, 
                message: `Insufficient stock for ${item.name}. Available: ${product.quantity}, Requested: ${item.quantity}` 
              });
            }
            const prevQuantity = product.quantity;
            product.quantity -= item.quantity;
            await product.save();
            
            // Create stock history entry
            await StockHistory.create({
              sku: product.sku,
              product: product.name,
              prevStock: prevQuantity,
              change: -item.quantity,
              newStock: product.quantity,
              reason: 'Purchased',
              updatedBy: employee || 'System',
              transactionType: 'Purchased',
              transactionId: transactionId
            });
          }
        }

        // Update addon stock if present
        if (item.addons && item.addons.length > 0) {
          for (const addonItem of item.addons) {
            const addon = await Addon.findById(addonItem.addonId);
            if (addon) {
              if (addon.quantity < addonItem.quantity) {
                return res.status(400).json({ 
                  success: false, 
                  message: `Insufficient stock for addon ${addonItem.name}. Available: ${addon.quantity}, Requested: ${addonItem.quantity}` 
                });
              }
              const prevQuantity = addon.quantity;
              addon.quantity -= addonItem.quantity;
              await addon.save();
              
              // Create stock history entry
              await StockHistory.create({
                sku: addon.name,
                product: addon.name,
                prevStock: prevQuantity,
                change: -addonItem.quantity,
                newStock: addon.quantity,
                reason: 'Purchased',
                updatedBy: employee || 'System',
                transactionType: 'Purchased',
                transactionId: transactionId
              });
            }
          }
        }
      }

      // Create transaction with store
      const createdTransaction = await Transaction.create({
        transactionId,
        cart,
        paymentMethod,
        discounts: discounts || 0,
        netAmount,
        VAT: VAT || 0,
        totalAmount,
        cash: cash || 0,
        change: change || 0,
        status: 'Completed',
        employee: employee || 'unknown',
        customerId,
        customerRfid,
        store: store || (req.user && req.user.store ? req.user.store._id || req.user.store : null)
      });

      console.log('Transaction created successfully:', createdTransaction._id);

      res.status(201).json({ 
        success: true, 
        transaction: createdTransaction,
        transactionId 
      });
    } catch (error) {
      console.error('Transaction creation error:', error);
      res.status(500).json({ success: false, message: 'Failed to create transaction', error: error.message });
    }
  }),

  // Get a single transaction by ID
  getTransaction: asyncHandler(async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      res.status(200).json({ success: true, transaction });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch transaction', error: error.message });
    }
  }),

  // Get transaction by transaction ID
  getTransactionByTransactionId: asyncHandler(async (req, res) => {
    try {
      const transaction = await Transaction.findOne({ transactionId: req.params.transactionId });
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      res.status(200).json({ success: true, transaction });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch transaction', error: error.message });
    }
  }),

  // Void a transaction
  voidTransaction: asyncHandler(async (req, res) => {
    try {
      // Check if transaction session is active
      const session = await TransactionSession.findOne({ isActive: true });
      if (!session) {
        return res.status(403).json({ 
          success: false, 
          message: 'Transaction session is not active. Void operations are disabled.' 
        });
      }

      const transaction = await Transaction.findById(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      // Check store access
      if (req.user && req.user.role === 'Co-Admin') {
        const userStoreId = req.user.store._id || req.user.store;
        const transactionStoreId = transaction.store;
        if (userStoreId.toString() !== transactionStoreId?.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied to this transaction' });
        }
      }

      if (transaction.status === 'Voided') {
        return res.status(400).json({ success: false, message: 'Transaction already voided' });
      }

      // Generate unique void transaction ID
      let voidTransactionId = generateTransactionId();
      let existingTransaction = await Transaction.findOne({ transactionId: voidTransactionId });
      while (existingTransaction) {
        voidTransactionId = generateTransactionId();
        existingTransaction = await Transaction.findOne({ transactionId: voidTransactionId });
      }

      console.log('Generated void transaction ID:', voidTransactionId);

      // Restore stock for each item
      const StockHistory = require('../models/StockHistory');
      
      for (const item of transaction.cart) {
        if (item.isVariant && item.variantId) {
          const variant = await Variant.findById(item.variantId);
          if (variant) {
            const prevQuantity = variant.quantity;
            variant.quantity += item.quantity;
            await variant.save();
            console.log(`Restored variant stock: ${variant.sku}, new quantity: ${variant.quantity}`);
            
            // Create stock history entry
            await StockHistory.create({
              sku: variant.sku,
              product: item.name,
              prevStock: prevQuantity,
              change: item.quantity,
              newStock: variant.quantity,
              reason: 'Voided',
              updatedBy: transaction.employee || 'System',
              transactionType: 'Voided',
              transactionId: transaction.transactionId
            });
          }
        } else if (item.productId) {
          const product = await Product.findById(item.productId);
          if (product) {
            const prevQuantity = product.quantity;
            product.quantity += item.quantity;
            await product.save();
            console.log(`Restored product stock: ${product.sku}, new quantity: ${product.quantity}`);
            
            // Create stock history entry
            await StockHistory.create({
              sku: product.sku,
              product: product.name,
              prevStock: prevQuantity,
              change: item.quantity,
              newStock: product.quantity,
              reason: 'Voided',
              updatedBy: transaction.employee || 'System',
              transactionType: 'Voided',
              transactionId: transaction.transactionId
            });
          }
        }

        // Restore addon stock
        if (item.addons && item.addons.length > 0) {
          for (const addonItem of item.addons) {
            const addon = await Addon.findById(addonItem.addonId);
            if (addon) {
              const prevQuantity = addon.quantity;
              addon.quantity += addonItem.quantity;
              await addon.save();
              console.log(`Restored addon stock: ${addon.name}, new quantity: ${addon.quantity}`);
              
              // Create stock history entry
              await StockHistory.create({
                sku: addon.name,
                product: addon.name,
                prevStock: prevQuantity,
                change: addonItem.quantity,
                newStock: addon.quantity,
                reason: 'Voided',
                updatedBy: transaction.employee || 'System',
                transactionType: 'Voided',
                transactionId: transaction.transactionId
              });
            }
          }
        }
      }

      // Create void transaction record with store
      const voidTransactionRecord = await Transaction.create({
        transactionId: voidTransactionId,
        cart: transaction.cart,
        paymentMethod: transaction.paymentMethod,
        discounts: transaction.discounts,
        netAmount: transaction.netAmount,
        VAT: transaction.VAT,
        totalAmount: transaction.totalAmount,
        cash: transaction.cash,
        change: transaction.change,
        status: 'Voided',
        employee: transaction.employee,
        customerId: transaction.customerId,
        customerRfid: transaction.customerRfid,
        store: transaction.store
      });

      // Update original transaction status
      transaction.status = 'Voided';
      await transaction.save();

      console.log('Transaction voided successfully:', voidTransactionId);

      res.status(200).json({ 
        success: true, 
        message: 'Transaction voided successfully', 
        transaction,
        voidTransactionId,
        voidTransaction: voidTransactionRecord
      });
    } catch (error) {
      console.error('Void transaction error:', error);
      res.status(500).json({ success: false, message: 'Failed to void transaction', error: error.message });
    }
  }),

  // Get transactions by date range
  getTransactionsByDateRange: asyncHandler(async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      let query = {};
      
      // If user is Co-Admin, filter transactions by their store
      if (req.user && req.user.role === 'Co-Admin' && req.user.store) {
        query.store = req.user.store._id || req.user.store;
      }
      // Admin sees all transactions
      
      if (startDate && endDate) {
        query.transactionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const transactions = await Transaction.find(query).sort({ transactionDate: -1 });
      res.status(200).json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
    }
  }),

  // Update a transaction
  updateTransaction: asyncHandler(async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      // Check store access
      if (req.user && req.user.role === 'Co-Admin') {
        const userStoreId = req.user.store._id || req.user.store;
        const transactionStoreId = transaction.store;
        if (userStoreId.toString() !== transactionStoreId?.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied to this transaction' });
        }
      }

      const { status, paymentMethod, employee, customerRfid } = req.body;

      // Update allowed fields
      if (status) transaction.status = status;
      if (paymentMethod) transaction.paymentMethod = paymentMethod;
      if (employee) transaction.employee = employee;
      if (customerRfid !== undefined) transaction.customerRfid = customerRfid;

      await transaction.save();

      res.status(200).json({ success: true, transaction, message: 'Transaction updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update transaction', error: error.message });
    }
  }),

  // Delete a transaction
  deleteTransaction: asyncHandler(async (req, res) => {
    try {
      const transaction = await Transaction.findById(req.params.id);
      
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      // Check store access
      if (req.user && req.user.role === 'Co-Admin') {
        const userStoreId = req.user.store._id || req.user.store;
        const transactionStoreId = transaction.store;
        if (userStoreId.toString() !== transactionStoreId?.toString()) {
          return res.status(403).json({ success: false, message: 'Access denied to this transaction' });
        }
      }

      await Transaction.findByIdAndDelete(req.params.id);

      res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete transaction', error: error.message });
    }
  }),

  // Process refund
  refundTransaction: asyncHandler(async (req, res) => {
    try {
      // Check if transaction session is active
      const session = await TransactionSession.findOne({ isActive: true });
      if (!session) {
        return res.status(403).json({ 
          success: false, 
          message: 'Transaction session is not active. Refund operations are disabled.' 
        });
      }

      const { 
        originalTransactionId,
        transactionId,
        refundItems,
        refundAmount,
        paymentMethod,
        customerId,
        customerRfid,
        employee
      } = req.body;

      console.log('Processing refund:', { originalTransactionId, refundAmount, refundItems });

      // Validate required fields
      if (!originalTransactionId || !transactionId) {
        return res.status(400).json({ success: false, message: 'Transaction ID is required' });
      }
      if (!refundItems || refundItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Refund items are required' });
      }
      if (refundAmount === undefined || refundAmount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid refund amount' });
      }

      // Get original transaction
      const originalTransaction = await Transaction.findById(originalTransactionId);
      if (!originalTransaction) {
        return res.status(404).json({ success: false, message: 'Original transaction not found' });
      }

      // Check if already refunded
      if (originalTransaction.status === 'Returned') {
        return res.status(400).json({ success: false, message: 'Transaction already refunded' });
      }

      // Generate unique refund transaction ID
      let refundTransactionId = generateTransactionId();
      let existingTransaction = await Transaction.findOne({ transactionId: refundTransactionId });
      while (existingTransaction) {
        refundTransactionId = generateTransactionId();
        existingTransaction = await Transaction.findOne({ transactionId: refundTransactionId });
      }

      console.log('Generated refund transaction ID:', refundTransactionId);

      // Restore stock for refunded items
      const StockHistory = require('../models/StockHistory');
      
      for (const item of refundItems) {
        if (item.isVariant && item.variantId) {
          // Restore variant stock
          const variant = await Variant.findById(item.variantId);
          if (variant) {
            const prevQuantity = variant.quantity || 0;
            variant.quantity = prevQuantity + item.quantity;
            await variant.save();
            console.log(`Restored variant stock: ${variant.sku}, new quantity: ${variant.quantity}`);
            
            // Create stock history entry
            await StockHistory.create({
              sku: variant.sku,
              product: item.name,
              prevStock: prevQuantity,
              change: item.quantity,
              newStock: variant.quantity,
              reason: 'Returned',
              updatedBy: employee || 'System',
              transactionType: 'Returned',
              transactionId: originalTransactionId
            });
          }
        } else {
          // Restore product stock
          const product = await Product.findById(item._id);
          if (product) {
            const prevQuantity = product.quantity || 0;
            product.quantity = prevQuantity + item.quantity;
            await product.save();
            console.log(`Restored product stock: ${product.sku}, new quantity: ${product.quantity}`);
            
            // Create stock history entry
            await StockHistory.create({
              sku: product.sku,
              product: product.name,
              prevStock: prevQuantity,
              change: item.quantity,
              newStock: product.quantity,
              reason: 'Returned',
              updatedBy: employee || 'System',
              transactionType: 'Returned',
              transactionId: originalTransactionId
            });
          }
        }

        // Restore addon stock if present
        if (item.addons && item.addons.length > 0) {
          for (const addon of item.addons) {
            const addonDoc = await Addon.findById(addon.addonId);
            if (addonDoc) {
              const prevQuantity = addonDoc.quantity || 0;
              addonDoc.quantity = prevQuantity + addon.quantity;
              await addonDoc.save();
              console.log(`Restored addon stock: ${addonDoc.name}, new quantity: ${addonDoc.quantity}`);
              
              // Create stock history entry
              await StockHistory.create({
                sku: addonDoc.name,
                product: addonDoc.name,
                prevStock: prevQuantity,
                change: addon.quantity,
                newStock: addonDoc.quantity,
                reason: 'Returned',
                updatedBy: employee || 'System',
                transactionType: 'Returned',
                transactionId: originalTransactionId
              });
            }
          }
        }
      }

      // If paid via E-wallet, refund to customer balance
      let newCustomerBalance = null;
      if (paymentMethod === 'E-wallet' && customerId) {
        const Customer = require('../models/Customer');
        const customer = await Customer.findById(customerId);
        if (customer) {
          customer.balance = (customer.balance || 0) + refundAmount;
          await customer.save();
          newCustomerBalance = customer.balance;
          console.log(`Refunded ₱${refundAmount} to customer ${customer.fullName}, new balance: ₱${customer.balance}`);

          // Log customer transaction
          const CustomerTransaction = require('../models/CustomerTransactions');
          await CustomerTransaction.create({
            transactionId: refundTransactionId, // Add transaction ID for refund
            rfid: customer.rfid,
            username: customer.username,
            amount: refundAmount,
            transactionType: 'Refund',
            balanceBefore: customer.balance - refundAmount,
            balanceAfter: customer.balance
          });
        }
      }

      // Create refund transaction record
      const refundTransactionRecord = await Transaction.create({
        transactionId: refundTransactionId,
        cart: refundItems,
        paymentMethod,
        discounts: 0,
        netAmount: refundAmount,
        VAT: 0,
        totalAmount: refundAmount,
        cash: 0,
        change: 0,
        status: 'Returned',
        employee: employee || 'unknown',
        customerId,
        customerRfid,
        store: originalTransaction.store
      });

      // Update original transaction
      // Check if this is a full refund or partial refund
      let isFullRefund = true;
      const updatedCart = [];

      for (const originalItem of originalTransaction.cart) {
        const refundItem = refundItems.find(ri => 
          ri._id.toString() === originalItem._id.toString() &&
          ri.isVariant === originalItem.isVariant
        );

        if (refundItem) {
          // Item is being refunded
          if (refundItem.quantity < originalItem.quantity) {
            // Partial refund of this item
            isFullRefund = false;
            const remainingQuantity = originalItem.quantity - refundItem.quantity;
            updatedCart.push({
              ...originalItem.toObject ? originalItem.toObject() : originalItem,
              quantity: remainingQuantity,
              total: originalItem.price * remainingQuantity
            });
          }
          // If refundItem.quantity === originalItem.quantity, item is fully refunded (don't add to updatedCart)
        } else {
          // Item is not being refunded at all
          isFullRefund = false;
          updatedCart.push(originalItem.toObject ? originalItem.toObject() : originalItem);
        }
      }

      if (isFullRefund) {
        // All items refunded, mark as Returned
        originalTransaction.status = 'Returned';
      } else {
        // Partial refund, update cart and amounts but keep Completed status
        originalTransaction.cart = updatedCart;
        
        // Recalculate total amount
        const newTotalAmount = updatedCart.reduce((sum, item) => {
          return sum + (item.price * item.quantity);
        }, 0);
        
        originalTransaction.totalAmount = newTotalAmount;
        originalTransaction.netAmount = newTotalAmount;
      }

      await originalTransaction.save();

      console.log('Refund processed successfully:', refundTransactionId);
      console.log('Original transaction status:', originalTransaction.status);

      res.status(201).json({ 
        success: true, 
        message: 'Refund processed successfully',
        refundTransactionId,
        refundTransaction: refundTransactionRecord,
        newCustomerBalance: newCustomerBalance
      });
    } catch (error) {
      console.error('Refund processing error:', error);
      res.status(500).json({ success: false, message: 'Failed to process refund', error: error.message });
    }
  }),

  // Get Sales Report with product details and profit calculation
  getSalesReport: asyncHandler(async (req, res) => {
    try {
      // Check if there's an active session
      const activeSession = await TransactionSession.findOne({ isActive: true });
      
      let sessionToUse = activeSession;
      let hasActiveSession = !!activeSession;
      
      // If no active session, get the most recent closed session
      if (!activeSession) {
        sessionToUse = await TransactionSession.findOne({ isActive: false })
          .sort({ endedAt: -1 });
        
        if (!sessionToUse) {
          return res.status(200).json({
            success: true,
            summary: {
              todaySales: 0,
              totalProfit: 0,
              totalProductsSold: 0
            },
            productSales: [],
            hasActiveSession: false,
            message: 'No session data available'
          });
        }
      }

      // Fetch transactions from the session period
      const query = {
        status: { $in: ['Completed'] },
        transactionDate: {
          $gte: sessionToUse.startedAt,
          $lte: sessionToUse.endedAt || new Date()
        }
      };

      // If user is Co-Admin, filter transactions by their store
      if (req.user && req.user.role === 'Co-Admin' && req.user.store) {
        query.store = req.user.store._id || req.user.store;
      }
      // Admin sees all transactions

      const transactions = await Transaction.find(query).sort({ transactionDate: -1 });

      // Aggregate sales data by product
      const productSalesMap = {};
      let totalRevenue = 0;
      let totalProfit = 0;
      let totalProductsSold = 0;

      for (const transaction of transactions) {
        for (const item of transaction.cart) {
          const key = `${item.sku || item._id}_${item.name}`;
          
          if (!productSalesMap[key]) {
            // Get product/variant cost
            let cost = 0;
            if (item.isVariant && item.variantId) {
              const variant = await Variant.findById(item.variantId);
              if (variant) {
                // Variant cost can be additional or total
                cost = variant.cost || 0;
                // If variant cost is 0, try to get base product cost
                if (cost === 0 && variant.productId) {
                  const product = await Product.findById(variant.productId);
                  cost = product?.cost || 0;
                }
              }
            } else if (item.productId) {
              const product = await Product.findById(item.productId);
              cost = product?.cost || 0;
            }

            productSalesMap[key] = {
              sku: item.sku || 'N/A',
              name: item.name,
              price: item.price,
              cost: cost,
              quantitySold: 0,
              totalSales: 0,
              totalProfit: 0
            };
          }

          const quantity = item.quantity || 1;
          const itemTotal = item.price * quantity;
          const itemProfit = (item.price - productSalesMap[key].cost) * quantity;

          productSalesMap[key].quantitySold += quantity;
          productSalesMap[key].totalSales += itemTotal;
          productSalesMap[key].totalProfit += itemProfit;

          totalRevenue += itemTotal;
          totalProfit += itemProfit;
          totalProductsSold += quantity;
        }
      }

      const productSales = Object.values(productSalesMap);

      // Calculate period summaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTransactions = transactions.filter(t => 
        new Date(t.transactionDate) >= today
      );
      const todaySales = todayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

      res.status(200).json({
        success: true,
        summary: {
          todaySales,
          totalProfit,
          totalProductsSold
        },
        productSales,
        hasActiveSession,
        sessionInfo: {
          startedAt: sessionToUse.startedAt,
          startedBy: sessionToUse.startedBy,
          endedAt: sessionToUse.endedAt
        }
      });
    } catch (error) {
      console.error('Sales report error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch sales report', error: error.message });
    }
  }),

  // Start transaction session
  startTransactionSession: asyncHandler(async (req, res) => {
    try {
      const { employee, storeId } = req.body;

      // Check if there's already an active session for this store
      const query = storeId ? { isActive: true, storeId } : { isActive: true };
      let session = await TransactionSession.findOne(query);
      
      if (session) {
        return res.status(400).json({ 
          success: false, 
          message: 'A transaction session is already active for this store' 
        });
      }

      // Create new session
      session = await TransactionSession.create({
        isActive: true,
        startedBy: employee || 'System',
        startedAt: new Date(),
        endedBy: null,
        endedAt: null,
        storeId: storeId || null
      });

      res.status(200).json({
        success: true,
        message: 'Transaction session started',
        session
      });
    } catch (error) {
      console.error('Start session error:', error);
      res.status(500).json({ success: false, message: 'Failed to start session', error: error.message });
    }
  }),

  // End transaction session
  endTransactionSession: asyncHandler(async (req, res) => {
    try {
      const { employee } = req.body;

      const session = await TransactionSession.findOne({ isActive: true });
      
      if (!session) {
        return res.status(400).json({ 
          success: false, 
          message: 'No active transaction session found' 
        });
      }

      // Calculate sales summary for this session
      const sessionTransactions = await Transaction.find({
        status: { $in: ['Completed'] },
        transactionDate: {
          $gte: session.startedAt,
          $lte: new Date()
        }
      });

      let totalSales = 0;
      let totalProfit = 0;
      let totalProductsSold = 0;

      for (const transaction of sessionTransactions) {
        totalSales += transaction.totalAmount;
        
        for (const item of transaction.cart) {
          const quantity = item.quantity || 1;
          totalProductsSold += quantity;
          
          // Calculate profit
          let cost = 0;
          if (item.isVariant && item.variantId) {
            const variant = await Variant.findById(item.variantId);
            if (variant) {
              cost = variant.cost || 0;
              if (cost === 0 && variant.productId) {
                const product = await Product.findById(variant.productId);
                cost = product?.cost || 0;
              }
            }
          } else if (item.productId) {
            const product = await Product.findById(item.productId);
            cost = product?.cost || 0;
          }
          
          totalProfit += (item.price - cost) * quantity;
        }
      }

      session.isActive = false;
      session.endedBy = employee || 'System';
      session.endedAt = new Date();
      session.salesSummary = {
        totalSales,
        totalProfit,
        totalProductsSold,
        transactionCount: sessionTransactions.length
      };
      await session.save();

      res.status(200).json({
        success: true,
        message: 'Transaction session ended',
        session
      });
    } catch (error) {
      console.error('End session error:', error);
      res.status(500).json({ success: false, message: 'Failed to end session', error: error.message });
    }
  }),

  // Get transaction session status
  getTransactionSessionStatus: asyncHandler(async (req, res) => {
    try {
      const { storeId } = req.query;
      
      let query = {};
      if (storeId) {
        // Find active session for this store, or the latest session for this store
        query = { storeId };
      }
      
      // First try to find an active session for this store
      let session = await TransactionSession.findOne({ ...query, isActive: true });
      
      // If no active session, get the latest session for this store
      if (!session && storeId) {
        session = await TransactionSession.findOne(query).sort({ createdAt: -1 });
      }
      
      // If still no session, get any latest session
      if (!session) {
        session = await TransactionSession.findOne().sort({ createdAt: -1 });
      }
      
      res.status(200).json({
        success: true,
        session: session || { isActive: false }
      });
    } catch (error) {
      console.error('Get session status error:', error);
      res.status(500).json({ success: false, message: 'Failed to get session status', error: error.message });
    }
  }),

  // Get sales history of ended sessions
  getSalesHistory: asyncHandler(async (req, res) => {
    try {
      const { limit = 50, storeId } = req.query;
      
      const query = { 
        isActive: false,
        endedAt: { $exists: true }
      };
      
      // Filter by storeId if provided
      if (storeId) {
        query.storeId = storeId;
      }
      
      const sessions = await TransactionSession.find(query)
        .sort({ endedAt: -1 })
        .limit(parseInt(limit));
      
      res.status(200).json({
        success: true,
        history: sessions
      });
    } catch (error) {
      console.error('Get sales history error:', error);
      res.status(500).json({ success: false, message: 'Failed to get sales history', error: error.message });
    }
  }),

  getSessionDetails: asyncHandler(async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Get the session
      const session = await TransactionSession.findById(sessionId);
      
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }
      
      // Fetch transactions from this session period
      const query = {
        status: { $in: ['Completed'] },
        transactionDate: {
          $gte: session.startedAt,
          $lte: session.endedAt || new Date()
        }
      };
      
      const transactions = await Transaction.find(query);
      
      // Aggregate product sales
      const productSalesMap = {};
      
      for (const transaction of transactions) {
        for (const item of transaction.cart) {
          const key = `${item.sku || item._id}_${item.name}`;
          
          if (!productSalesMap[key]) {
            // Get product/variant cost
            let cost = 0;
            if (item.isVariant && item.variantId) {
              const variant = await Variant.findById(item.variantId);
              if (variant) {
                cost = variant.cost || 0;
                if (cost === 0 && variant.productId) {
                  const product = await Product.findById(variant.productId);
                  cost = product?.cost || 0;
                }
              }
            } else if (item.productId) {
              const product = await Product.findById(item.productId);
              cost = product?.cost || 0;
            }

            productSalesMap[key] = {
              sku: item.sku || 'N/A',
              name: item.name,
              price: item.price,
              cost: cost,
              quantitySold: 0,
              totalSales: 0,
              totalProfit: 0
            };
          }

          const quantity = item.quantity || 1;
          const itemTotal = item.price * quantity;
          const itemProfit = (item.price - productSalesMap[key].cost) * quantity;

          productSalesMap[key].quantitySold += quantity;
          productSalesMap[key].totalSales += itemTotal;
          productSalesMap[key].totalProfit += itemProfit;
        }
      }
      
      const productSales = Object.values(productSalesMap);
      
      res.status(200).json({
        success: true,
        session,
        productSales
      });
    } catch (error) {
      console.error('Get session details error:', error);
      res.status(500).json({ success: false, message: 'Failed to get session details', error: error.message });
    }
  })
};

module.exports = transaction;
