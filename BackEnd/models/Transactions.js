const mongoose = require('mongoose');
const transactionSchema = new mongoose.Schema({
    orderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Order', 
      required: true 
    },
    paymentMethod: { 
      type: String, 
      required: true 
    },
    discounts: {
        type: number,
        required: true,
        default: 0.00
    },
    tax:{
        type: Number,
        required: true,
        default: 0.00
    },
    amount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Pending', 'Completed', 'Failed'], 
      default: 'Pending' 
    },
    barcode: { 
      type: String 
    },
    transactionDate: { 
      type: Date, 
      default: Date.now 
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
  
  module.exports = mongoose.model('Transaction', transactionSchema);
  