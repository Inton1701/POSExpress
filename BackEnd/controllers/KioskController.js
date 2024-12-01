const KioskTransaction = require('../models/KioskTransaction');
const Product = require('../models/Products');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

const KioskController = {
    // Get product information by productId
    getProductInfo: asyncHandler(async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            res.status(200).json({ success: true, product });
        } catch (error) {
            console.error('Error fetching product info:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch product information' });
        }
    }),

    // Create a new transaction
    createTransaction: asyncHandler(async (req, res) => {
        try {
            const transactionId = await generateTransactionCode();
            const { cart } = req.body;

            if (!cart || !Array.isArray(cart) || cart.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart cannot be empty' });
            }

            let totalAmount = 0;

            for (const item of cart) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: `Product with ID ${item.productId} not found` });
                }
                if (item.quantity > product.quantity) {
                    return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
                }

                // Calculate total amount
                totalAmount += item.quantity * product.price;
            }

            const transaction = new KioskTransaction({
                transactionId,
                productId: cart.map((item) => item.productId),
                quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
                totalAmount,
                status: 'Pending',
            });

            // Save the transaction
            const savedTransaction = await transaction.save();

            // Update product quantities
            for (const item of cart) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: -item.quantity } });
            }

            // Print receipt
            printReceipt(savedTransaction, 'normal');

            res.status(201).json({ success: true, transaction: savedTransaction });
        } catch (error) {
            console.error('Error creating transaction:', error);
            return res.status(500).json({ success: false, message: 'Failed to create transaction', error: error.message });
        }
    }),

    // Get transaction details
    getTransactionDetails: asyncHandler(async (req, res) => {
        try {
            const transactionId = req.params.id;
            const transaction = await KioskTransaction.findOne({ transactionId }).populate('productId');
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }
            res.status(200).json({ success: true, transaction });
        } catch (error) {
            console.error('Error fetching transaction details:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch transaction details', error: error.message });
        }
    }),
};

// Receipt Printing
const printReceipt = (transaction, type = 'normal') => {
    try {
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);

        device.open(() => {
            printer
                .align('CT')
                .text('Kiosk Store')
                .text('Thank You for Your Purchase!')
                .text('--------------------------------')
                .text(`Transaction ID: ${transaction.transactionId}`)
                .text(`Date: ${new Date().toLocaleString()}`)
                .text('--------------------------------');

            // Print product details
            transaction.productId.forEach((product, index) => {
                const quantity = transaction.quantity[index];
                printer.text(`${product.name} x${quantity} = ${product.price * quantity}`);
            });

            printer.text('--------------------------------')
                .text(`Total: ${transaction.totalAmount.toFixed(2)}`)
                .text('--------------------------------')
                .text('Please Visit Again!')
                .cut()
                .close();
        });
    } catch (error) {
        console.error('Error printing receipt:', error);
    }
};

// Generate unique transaction code
const generateTransactionCode = async () => {
    const prefix = 'K';
    const generateCode = () => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
    let transactionCode;
    let isDuplicate = true;

    while (isDuplicate) {
        transactionCode = generateCode();
        const existingTransaction = await KioskTransaction.findOne({ transactionId: transactionCode });
        if (!existingTransaction) {
            isDuplicate = false;
        }
    }
    return transactionCode;
};

module.exports = KioskController;
