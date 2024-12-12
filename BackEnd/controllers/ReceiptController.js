const escpos = require('escpos');
escpos.USB = require('escpos-usb'); // For USB printers
const PDFDocument = require('pdfkit');
const Transaction = require('../models/Transactions');
const Receipt = require('../models/Receipt');
const path = require('path');
const fs = require('fs');

// Helper function to wrap text
const wrapText = (text, width) => {
    const wrappedLines = [];
    while (text.length > width) {
        let wrapIndex = text.lastIndexOf(" ", width);
        if (wrapIndex === -1) wrapIndex = width; // No spaces, cut at max width
        wrappedLines.push(text.slice(0, wrapIndex));
        text = text.slice(wrapIndex).trim();
    }
    if (text.length > 0) wrappedLines.push(text);
    return wrappedLines;
};

// Default receipt settings
const getDefaultReceiptSettings = () => ({
    storeName: 'POSExpress',
    storeAddress: 'Default Store Address',
    storeSecondAddress: '',
    contact: '',
    message: 'Thank you for shopping with us!',
});

const printReceipt = async (transaction, type = "normal", isTest = false) => {
    let receiptSettings = await Receipt.findOne();
    if (!receiptSettings) {
        receiptSettings = getDefaultReceiptSettings();
    } else {
        receiptSettings = {
            storeName: receiptSettings.storeName || 'POSExpress',
            storeAddress: receiptSettings.storeAddress || 'Default Store Address',
            storeSecondAddress: receiptSettings.storeSecondAddress || '',
            contact: receiptSettings.contact || '',
            message: receiptSettings.message || 'Thank you for shopping with us!',
        };
    }

    // Test print mode for actual printing of just receipt settings and "Test Print"
    if (isTest) {
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);

        device.open(() => {
            printer.align("CT").style("NORMAL");
            printer.text(receiptSettings.storeName); // Store Name
            printer.text(receiptSettings.storeAddress); // Store Address
            if (receiptSettings.storeSecondAddress) {
                printer.text(receiptSettings.storeSecondAddress); // Second Address if available
            }
            if (receiptSettings.contact) {
                printer.text(`Contact: ${receiptSettings.contact}`); // Store Contact if available
            }

            printer.text("--------------------------------");

            printer.text("Test Print");

            printer.text("--------------------------------");

            if (receiptSettings.message) {
                printer.align("CT").text(receiptSettings.message); // Footer message
            }
            printer.text("Thank you for your purchase!");

            printer.cut().close();
        });

        return; // Exit to prevent further execution
    }

    // Function to print the receipt
    try {
        const device = new escpos.USB();
        const printer = new escpos.Printer(device);

        device.open(() => {
            // Print header info
            printer.align("CT").style("NORMAL");
            printer.text(receiptSettings.storeName);
            printer.text(receiptSettings.storeAddress);
            if (receiptSettings.storeSecondAddress) {
                printer.text(receiptSettings.storeSecondAddress);
            }
            if (receiptSettings.contact) {
                printer.text(`Contact: ${receiptSettings.contact}`);
            }

            printer.text("--------------------------------");

            // Print receipt title dynamically
            let title = "SALES RECEIPT";
            if (transaction.status === "Returned") title = "RETURN RECEIPT";
            if (transaction.status === "Voided") title = "VOIDED RECEIPT";
            printer.text(title);
            printer.text("--------------------------------");

            // Print transaction details
            printer.align("LT");
            printer.text(`Transaction ID: ${transaction.transactionId}`);
            printer.text(`Date: ${new Date().toLocaleString()}`);
            printer.text(`Employee: ${transaction.employee}`);
            printer.text(`Payment Method: ${transaction.paymentMethod}`);
            printer.text("Items:");
            printer.text("--------------------------------");

            // Print cart items
            transaction.cart.forEach((item) => {
                const wrappedNameLines = wrapText(item.name, 32);

                // Print product name
                wrappedNameLines.forEach((line) => {
                    printer.text(line);
                });

                // Print price, quantity, and total
                const price = `${item.price.toFixed(2)}`.padStart(10);
                const quantity = `x${item.quantity}`.padStart(10);
                const totalValue = (item.quantity * item.price).toFixed(2).padStart(10);
                printer.text(`${price}${quantity}${totalValue}`);
            });

            // Print totals
            const VAT = transaction.VAT || 0;
            const VATExemptSales = transaction.VATExemptSales || 0;
            const VATSales = transaction.netAmount - VAT;
            const additionalTax = VATSales * 0.12;

            printer.text("--------------------------------");
            printer.text(`Subtotal: `.padEnd(24) + `${transaction.netAmount.toFixed(2).padStart(7)}`);
            printer.text(`VAT Sales: `.padEnd(24) + `${VATSales.toFixed(2).padStart(7)}`);
            printer.text(`VAT-Exempt Sales: `.padEnd(24) + `${VATExemptSales.toFixed(2).padStart(7)}`);
            printer.text(`12% VAT: `.padEnd(24) + `${additionalTax.toFixed(2).padStart(7)}`);
            printer.text(`Total: `.padEnd(24) + `${transaction.totalAmount.toFixed(2).padStart(7)}`);

            printer.text("--------------------------------");

            // Print footer message dynamically
            if (receiptSettings.message) {
                printer.align("CT").text(receiptSettings.message);
            }
   
            if (transaction.type === "return") {
                printer.align("CT").text("Refund Processed Successfully!");
            }

            printer.cut().close();
        });
    } catch (error) {
        console.error('Failed to load or resize image:', error);
    }
};

// Exported functions for controllers
const testPrint = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findOne({ transactionId: String(transactionId) });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        await printReceipt(transaction, "normal", true); // Test print with actual printer
        res.status(200).json({ success: true, message: 'Test receipt printed to printer successfully' });
    } catch (error) {
        console.error("Error testing receipt:", error);
        res.status(500).json({ success: false, message: 'Error testing receipt' });
    }
};

const generatePDFReceipt = async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await Transaction.findOne({ transactionId: String(transactionId) });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        let receiptSettings = await Receipt.findOne();
        if (!receiptSettings) {
            receiptSettings = getDefaultReceiptSettings();
        }

        const doc = new PDFDocument({
            size: [136.8, 600], // 48mm width, adjust height as needed
            margins: { top: 10, left: 10, bottom: 10, right: 10 }, // Margins for bond paper layout
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="receipt-${transaction.transactionId}.pdf"`);
        doc.pipe(res);

        // Store name and address
        doc.fontSize(8).text(receiptSettings.storeName, { align: 'center' });
        doc.fontSize(8).text(receiptSettings.storeAddress, { align: 'center' });

        // Print receipt title dynamically
        let title = "SALES RECEIPT";
        if (transaction.status === "Returned") title = "RETURN RECEIPT";
        if (transaction.status === "Voided") title = "VOIDED RECEIPT";

        doc.text("------------------------------------------", { align: 'center' });
        doc.fontSize(8).text(title, { align: 'center' });
        doc.text("------------------------------------------", { align: 'center' });

        // Print transaction details
        doc.fontSize(8);
        doc.text(`Transaction ID: ${transaction.transactionId}`);
        doc.text(`Date: ${new Date().toLocaleString()}`);
        doc.text(`Employee: ${transaction.employee}`);
        doc.text(`Payment Method: ${transaction.paymentMethod}`);
        doc.text("------------------------------------------", { align: 'center' });

        // Define receipt width (for dynamic adjustments)
        const receiptWidth = 136.8; // Width in points for a 48mm receipt

        // Define column positions for price, quantity, and total value
        const priceX = 10; // Start position for the price
        const quantityX = receiptWidth / 2 - 10; // Center position for the quantity
        const totalValueX = receiptWidth - 50; // Right-aligned position for the total value

        // Print cart items with proper alignment
        transaction.cart.forEach((item) => {
            const wrappedNameLines = wrapText(item.name, 32); // Wrap text for narrow width

            // Print product name (on separate lines if wrapped)
            wrappedNameLines.forEach((line) => {
                doc.text(line, priceX, doc.y); // Print name at the same x as price
            });

            // Move to the next line after the product name
            const currentY = doc.y;

            // Print price, quantity, and total value
            const price = `${item.price.toFixed(2)}`;
            const quantity = `x${item.quantity}`;
            const totalValue = `${(item.quantity * item.price).toFixed(2)}`;

            // Ensure values are aligned properly in their respective columns
            doc.text(price, priceX, currentY);
            doc.text(quantity, quantityX, currentY, { width: 60, align: 'center' });
            doc.text(totalValue, totalValueX, currentY, { width: 50, align: 'right' });

            // Skip a line after each item
            doc.moveDown(0.3);
        });

        // Print totals and footer message (same way)
        doc.text(`Subtotal: ${transaction.netAmount.toFixed(2)}`, { align: 'right' });
        doc.text(`VAT: ${transaction.VAT.toFixed(2)}`, { align: 'right' });
        doc.text(`Total: ${transaction.totalAmount.toFixed(2)}`, { align: 'right' });

        doc.text(receiptSettings.message, { align: 'center' });

        // End PDF and send response
        doc.end();
    } catch (error) {
        console.error("Error generating PDF receipt:", error);
        res.status(500).json({ success: false, message: 'Error generating PDF receipt' });
    }
};

module.exports = {
    printReceipt,
    testPrint,
    generatePDFReceipt,
};
