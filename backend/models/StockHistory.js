const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
    sku:{
        type: String,
        required: true
    },
    product:{
        type: String,
        required: true
    },
    prevStock:{
        type: Number,
        required: true
    },
    change:{
        type: Number,
        required: true
    },
    newStock:{
        type: Number,
        required: true
    },
    reason:{
        type: String,
        default: 'Stock update'
    },
    transactionType:{
        type: String,
        enum: ['manual', 'Purchased', 'Returned', 'Voided', 'restock'],
        default: 'manual'
    },
    transactionId:{
        type: String,
        default: null
    },
    updatedBy:{
        type: String,
        default: 'Admin'
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    isDeleted:{
        type: Boolean,
        default: false
    }

})
module.exports = mongoose.model('StockHistory', stockHistorySchema);