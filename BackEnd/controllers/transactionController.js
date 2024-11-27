const Transaction = require('../models/Transactions');
const asyncHandler = require("express-async-handler");

const transactionController ={
    getAllTransactions: asyncHandler(async(req, res) => {
        try{
            const transactions = await Transaction.find();
            if(transactions.length <= 0){
                res.status(404).json({success:false, message:'no transactions found'})
            }

            res.status(200).json({success:true, transactions: transactions})
        }catch(error){
            res.status(500).json({success:false, message:error});
        }
    })
     
}
module.exports = transactionController;