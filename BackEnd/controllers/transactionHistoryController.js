const History = require('../models/TransactionHistory');
const asyncHandler = require("express-async-handler");

const th = {
  transactionState: asyncHandler(async (req, res) => {
    try {
      // Check if the schema is empty
      const count = await History.countDocuments();
      
      if (count === 0) {
        // Create an initial transaction
        const initialTransaction = new History({
          openDate: new Date(),
          isOpen: true,
        });
        await initialTransaction.save();
        return res.status(200).json({ success: true, isOpen: true, isInitial: true });
      }

      // If not empty, find the open transaction
      const transaction = await History.findOne({ isOpen: true });
      res.json({ success: true, isOpen: !!transaction, isInitial: false });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching transaction state', error: error.message });
    }
  }),
  openTransaction: asyncHandler(async (req, res) => {
    try {
      const existingOpenTransaction = await History.findOne({ isOpen: true });
      if (existingOpenTransaction) {
        return res.status(400).json({ success: false, message: 'A transaction is already open' });
      }
      const newTransaction = new History({ openDate: new Date() });
      await newTransaction.save();
      res.json({ success: true, message: 'Transaction opened successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error opening transaction' });
    }
  }),
  closeTransaction: asyncHandler(async (req, res) => { // FIX: Added req, res
    try {
      const openTransaction = await History.findOne({ isOpen: true });
      if (!openTransaction) {
        return res
          .status(400)
          .json({ success: false, message: "No open transaction found" });
      }
      openTransaction.closeDate = new Date();
      openTransaction.isOpen = false;
      await openTransaction.save();
      res.status(200).json({ success: true, message: "Transaction closed successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error closing transaction" });
    }
  }),
    transactionHistory: asyncHandler( async()=>{
      try {
        const transactions = await History.find({ isOpen: false })
          .sort({ closeDate: -1 })

        res.json({ success: true, transactions });
      } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching transaction history' });
      }
  })
}
module.exports = th;