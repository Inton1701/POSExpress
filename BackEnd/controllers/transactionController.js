const Transaction = require('../models/Transactions');
const TransactionHistory = require("../models/TransactionHistory");
const asyncHandler = require("express-async-handler");

const transactionController ={
    getAllTransactions: asyncHandler(async(req, res) => {
        try{
            const transactions = await Transaction.find({ status: { $ne: 'Deleted' } }).sort({createdAt:-1});
            if(transactions.length <= 0){
                res.status(404).json({success:false, message:'no transactions found'})
            }

            res.status(200).json({success:true, transactions: transactions})
        }catch(error){
            res.status(500).json({success:false, message:error});
        }
    }),
    getReturnTransactions: asyncHandler(async (req, res) => {
      try {
        // Fetch transactions where status is "Returned" and not "Deleted"
        const transactions = await Transaction.find({
          status: { $eq: 'Returned', $ne: 'Deleted' }
        }).sort({ createdAt: -1 });
    
        if (transactions.length === 0) {
          return res.status(404).json({ success: false, message: 'No transactions found' });
        }
    
        res.status(200).json({ success: true, transactions });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }),
    getVoidedTransactions: asyncHandler(async (req, res) => {
      try {
        // Fetch transactions where status is "Returned" and not "Deleted"
        const transactions = await Transaction.find({
          status: { $eq: 'Voided', $ne: 'Deleted' }
        }).sort({ createdAt: -1 });
    
        if (transactions.length === 0) {
          return res.status(404).json({ success: false, message: 'No transactions found' });
        }
    
        res.status(200).json({ success: true, transactions });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    }),

    getTransactionDetails: asyncHandler(async(req, res) =>{
        try {
            const transactionId  = req.params.id;
        
            // Find the transaction and populate the cart field to get product details
            const transaction = await Transaction.findOne({ transactionId })
              .populate('cart'); // Populate the product field inside cart with full product details
        
            if (!transaction) {
              return res.status(404).json({ success: false, message: 'Transaction not found' });
            }
        
            // Return the transaction details and associated products
            res.status(201).json({
              success: true,
              transaction: {
                transactionId: transaction.transactionId,
                employee: transaction.employee,
                customer: transaction.customer || 'Walk-in',  // Assuming a customer field exists or default to 'Walk-in'
                status: transaction.status,
                createdAt: transaction.createdAt,
                totalAmount: transaction.totalAmount,
                paymentMethod: transaction.paymentMethod,
                products: transaction.cart.map(item => ({
                  name: item.name,  // Assuming 'name' is a field in your Product model
                  sku: item.sku,    // Assuming 'sku' is a field in your Product model
                  quantity: item.quantity,
                  price: item.price,
                  total: item.total
                }))
              },
            });
          } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }),

    deleteTransaction: asyncHandler(async (req, res) => {
        try {
            const transactionId = req.params.id;
            if (!transactionId) {
                return res.status(404).json({ success: false, message: 'Transaction id not found' });
            }
    
            // Use findOneAndUpdate to find a document by transactionId and update its status
            const transaction = await Transaction.findOneAndUpdate(
                { transactionId: transactionId }, // Search condition by transactionId
                { status: "Deleted" }, // Update status to "Deleted"
            
            );
    
    
            return res.status(200).json({ success: true, message: 'Transaction deleted successfully', transaction });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    })
     
}
module.exports = transactionController;