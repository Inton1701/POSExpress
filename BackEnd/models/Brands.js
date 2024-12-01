const mongoose = require('mongoose');
const brandSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true, 
      unique: true 
    },
    description: { 
      type: String 
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
  
  module.exports = mongoose.model('Brand', brandSchema);
  