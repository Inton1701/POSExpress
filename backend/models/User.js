const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['Admin', 'Cashier', 'Co-Admin', 'Accounting'], 
      required: true 
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    rfid: {
      type: String,
      unique: true,
      sparse: true // Allows multiple null values
    },
    printPreferences: {
      selectedPrinter: {
        type: String,
        default: null
      },
      printMode: {
        type: String,
        enum: ['auto', 'manual', 'off'],
        default: 'manual'
      }
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
  
  module.exports = mongoose.model('User', userSchema);
  