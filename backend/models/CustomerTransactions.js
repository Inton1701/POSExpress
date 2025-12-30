const mongoose = require('mongoose');
const customerTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        required: true,
    },
    rfid: {
        type: String,
        required: true,
        // unique: true, // REMOVE unique, allow multiple transactions per RFID
    },
    username: { 
      type: String, 
      required: true, 
    },
    amount:{

        type: Number,
        required: true,
    },
    transactionType: {
        type: String,
        enum: ["Cash-in","Balance Inquiry", "Purchased", "Voided","Cash-out", "Refund"],
    },
    balanceBefore: {
        type: Number,
        required: false,
    },
    balanceAfter: {
        type: Number,
        required: false,
    },
    status: {
        type: String,
        enum: ['active', 'voided'],
        default: 'active'
    },
    voidedBy: {
        type: String,
        required: false
    },
    voidedAt: {
        type: Date,
        required: false
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  module.exports = mongoose.model('CustomerTransaction', customerTransactionSchema);
