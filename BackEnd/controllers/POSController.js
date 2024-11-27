const Product = require("../models/Products");
const Transaction = require("../models/Transactions");
const asyncHandler = require("express-async-handler");
const escpos = require("escpos"); // Import escpos library
const USB = require("escpos-usb"); // USB connection for Xprinter


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
      return res.status(500).json({ success: false, message: "Failed to check product" });
    }
  }),

  // Create a transaction
  createTransaction: asyncHandler(async (req, res) => {
    try {
      const transactionId = await generateTransactionCode();
      const { cart, paymentMethod, discounts, netAmount, VAT, totalAmount, status, employee } = req.body;

      if (!cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ success: false, message: "Cart cannot be empty" });
      }

      // Validate stock for each product in the cart
      for (const item of cart) {
        const product = await Product.findById(item._id);
        if (!product) {
          return res.status(404).json({ success: false, message: `Product with ID ${item._id} not found` });
        }
        if (item.quantity > product.stock) {
          return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
        }
      }

      // Create transaction
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
      });

      // Save transaction
      const savedTransaction = await transaction.save();

      // Update product stock
      for (const item of cart) {
        await Product.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
      }

      // After saving the transaction, send the receipt to the printer
      const devices = escpos.USB.findPrinter(); // Discover connected USB printers
      if (!devices || devices.length === 0) {
        console.error("No USB printers found");
        return res.status(500).json({ success: false, message: "No USB printers found" });
      }

      const device = devices[0]; // Use the first detected USB printer
      const printer = new escpos.Printer(device);

      device.open((error) => {
        if (error) {
          console.error("Failed to open USB device:", error);
          return res.status(500).json({ success: false, message: "Failed to connect to printer" });
        }

        // Format the receipt
        const receiptData = formatReceipt({
          transactionId,
          cart,
          paymentMethod,
          totalAmount,
          VAT,
          netAmount,
          employee,
        });

        // Print the receipt
        printer
          .text(receiptData.header)
          .text(receiptData.body)
          .text(receiptData.footer)
          .cut()
          .close(() => console.log("Receipt printed successfully."));
      });

      res.status(201).json({ success: true, transaction: savedTransaction });
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res.status(500).json({ success: false, message: "Failed to create transaction", error: error.message });
    }
  }),
};

// Helper Function: Generate a unique transaction code
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

// Helper Function: Format receipt content
const formatReceipt = ({ transactionId, cart, paymentMethod, totalAmount, VAT, netAmount, employee }) => {
  const header = `
    Gabay Agriculture Store
    ------------------------
    Transaction ID: ${transactionId}
    Cashier: ${employee || "N/A"}
    Payment Method: ${paymentMethod}
    ------------------------
  `;

  const body = cart
    .map((item) => `${item.name} x${item.quantity} - $${item.price.toFixed(2)}`)
    .join("\n");

  const footer = `
    ------------------------
    VAT: $${VAT.toFixed(2)}
    Total: $${totalAmount.toFixed(2)}
    Net Amount: $${netAmount.toFixed(2)}
    ------------------------
    Thank you for shopping with us!
  `;

  return { header, body, footer };
};

module.exports = POSController;
