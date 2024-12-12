const Product = require("../models/Products");
const Transaction = require('../models/Transactions');
const asyncHandler = require("express-async-handler");
const {printReceipt} = require('./ReceiptController');
// const escpos = require('escpos');
// escpos.USB = require('escpos-usb'); // For USB printers
// const usb = require('usb');


const POSController = {
    // Get product information by SKU
    getProductInfo: asyncHandler(async (req, res) => {
        try {
            const sku = req.params.id;
            const product = await Product.findOne({ sku: sku });
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }
            res.status(200).json({ success: true, product: product });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to check product' });
        }
    }),

    // Without transactions
    createTransaction: asyncHandler(async (req, res) => {
        try {
            const transactionId = await generateTransactionCode();
            const { cart, paymentMethod, discounts, netAmount, VAT, totalAmount, status, employee } = req.body;
    
            if (!cart || !Array.isArray(cart) || cart.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
            }
    
            // Validate cart items stock
            for (const item of cart) {
                const product = await Product.findById(item._id);
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product with ID ${item._id} not found` });
                }
                if (item.quantity > product.quantity) {
                    return res.status(400).json({ success: false, message: `Insufficient quantity for product ${product.name}` });
                }
            }
    
            // Create the transaction object
            const transaction = new Transaction({
                transactionId,
                cart,
                paymentMethod,
                discounts,
                netAmount,
                VAT,
                totalAmount,
                status,
                employee,
                transactionDate: new Date(),
            });
    
            // Save transaction
            const savedTransaction = await transaction.save();
    
            // Update product quantities and sales depending on payment method
            for (const item of cart) {
                const product = await Product.findById(item._id);
    
                // Deduct product quantity and update sales
                await Product.findByIdAndUpdate(item._id, { 
                    $inc: { quantity: -item.quantity, sales: item.quantity } 
                });
            }
    
            // Print the receipt
            printReceipt(savedTransaction, 'normal');
    
            res.status(201).json({ success: true, transaction: savedTransaction });
        } catch (error) {
            console.error("Error creating transaction:", error);
            return res.status(500).json({ success: false, message: 'Failed to create transaction', error: error.message });
        }
    }),
    
    voidTransaction: asyncHandler(async (req, res) => {
        try {
            const { transactionId, employee } = req.body;
    
            const transaction = await Transaction.findOne({ transactionId: transactionId });
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction id not found' });
            }
    
            if (transaction.status === 'void') {
                return res.status(400).json({ success: false, message: 'Transaction is already voided' });
            }
    
            transaction.employee = employee;
            transaction.status = 'Voided';
            transaction.transactionDate = new Date(),
            await transaction.save();
    
            // Restore product quantities and reverse sales
            for (const item of transaction.cart) {
                await Product.findByIdAndUpdate(item._id, { 
                    $inc: { quantity: item.quantity, sales: -item.quantity } 
                });
            }
    
            res.status(200).json({ success: true, message: 'Transaction voided successfully' });
        } catch (error) {
            console.error('Error voiding transaction:', error);
            return res.status(500).json({ success: false, message: 'Failed to void transaction', error: error.message });
        }
    }),

    getTransactionsItems: asyncHandler(async (req, res) => {
        try {
            const transactionId = req.params.id;
    
            // Find the transaction by ID
            const transaction = await Transaction.findOne({ transactionId: transactionId });
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }
    
            // Ensure cart is an array
            if (!Array.isArray(transaction.cart)) {
                return res.status(500).json({ success: false, message: 'Cart is not an array' });
            }
    
            // Return the transaction details including cart items
            res.status(200).json({
                success: true,
                transactionId: transaction.transactionId,
                sku: transaction.sku,
                cart: transaction.cart,
                totalAmount: transaction.totalAmount,
            });
        } catch (error) {
            console.error('Error fetching transaction items:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch transaction items', error: error.message });
        }
    }),
    

    returnTransaction: asyncHandler(async (req, res) => {
        try {
            const transactionId = req.params.id;
            const { returnedItems, employee } = req.body;
    
            // Ensure returnedItems is valid
            if (!returnedItems || !Array.isArray(returnedItems) || returnedItems.length === 0) {
                return res.status(400).json({ success: false, message: 'Returned items cannot be empty' });
            }
    
            // Find the original transaction
            const transaction = await Transaction.findOne({ transactionId: transactionId });
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }
    
            // Validate and update returned items
            for (const item of returnedItems) {
                const originalItem = transaction.cart.find(cartItem => cartItem._id.toString() === item._id);
                if (!originalItem) {
                    return res.status(400).json({ success: false, message: `Item ${item.name} was not part of the original transaction` });
                }
    
                // Assign default values for returnQuantity and price if missing
                item.returnQuantity = item.returnQuantity > 0 ? item.returnQuantity : 0;
                item.price = item.price || originalItem.price;
    
                // Ensure returnQuantity does not exceed the original quantity
                if (item.returnQuantity > originalItem.quantity) {
                    return res.status(400).json({ success: false, message: `Return quantity for item ${item.name} exceeds original quantity` });
                }
            }
    
            // Update product quantities in the database
            const productUpdates = returnedItems.map(async (item) => {
                await Product.findByIdAndUpdate(
                    item._id,
                    { $inc: { 
                        quantity: item.returnQuantity,
                        sales: -item.returnQuantity,
                        returns: item.returnQuantity
                    } }
                );
            });
    
            // Wait for all product updates to complete
            await Promise.all(productUpdates);
    
            // Calculate netAmount, VAT, and totalAmount for return transaction
            let netAmount = 0;
            let VAT = 0;
            let totalAmount = 0;
    
            returnedItems.forEach(item => {
                netAmount += item.returnQuantity * item.price;
                VAT += item.returnQuantity * item.price * 0.12; // Assuming VAT is 12%
            });
    
            totalAmount = netAmount + VAT;
    
            // Create the return transaction record
            const newTransactionId = await generateTransactionCode();
            const returnTransaction = new Transaction({
                transactionId: newTransactionId,
                cart: returnedItems,
                paymentMethod: transaction.paymentMethod,
                discounts: 0, // Adjust if applicable
                netAmount: netAmount,
                VAT: VAT,
                totalAmount: totalAmount,
                status: 'Returned',
                employee,
                transactionDate: new Date(),
            });
    
            // Save the return transaction
            await returnTransaction.save();
    
            // Fetch the saved transaction by its ID
            const savedReturnTransaction = await Transaction.findOne({ transactionId: newTransactionId });
            if (!savedReturnTransaction) {
                return res.status(500).json({ success: false, message: 'Failed to retrieve saved return transaction' });
            }
    
            // Print the return receipt
           printReceipt(savedReturnTransaction, 'return');
   
    
            // Respond with the created return transaction
            res.status(201).json({ success: true, returnTransaction: savedReturnTransaction });
        } catch (error) {
            console.error('Error processing return transaction:', error);
            res.status(500).json({ success: false, message: 'Failed to process return transaction', error: error.message });
        }
    })
  
      

};



// Generate a unique transaction code
const generateTransactionCode = async () => {
    const prefix = "1"; // Fixed prefix

    const generateCode = () => {
        const randomNumbers = Math.floor(100000000000 + Math.random() * 900000000000); // 12 random digits
        return `${prefix}${randomNumbers}`;
    };

    let transactionCode;
    let isDuplicate = true;

    while (isDuplicate) {
        transactionCode = generateCode();
        const existingTransaction = await Transaction.findOne({ transactionId: transactionCode });
        if (!existingTransaction) {
            isDuplicate = false; // Exit loop if no duplicate is found
        }
    }

    return transactionCode;
};

module.exports = POSController;
