const mongoose = require('mongoose');

const kioskTransactionSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed'], 
    default: 'Pending' 
  },
  transactionDate: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model('KioskTransaction', kioskTransactionSchema);
