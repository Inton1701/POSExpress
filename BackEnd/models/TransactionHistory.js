const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
    openDate:{ 
        type: Date,
        required: true 
    },
    closeDate:{
         type: Date 
    },
    isOpen:{ 
        type: Boolean,
        default: true 
    },
  });

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema);
