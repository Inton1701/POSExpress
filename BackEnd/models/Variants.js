const mongoose = require('mongoose');
const variantSchema = new mongoose.Schema({
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    options: [String],
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  module.exports = mongoose.model('Variant', variantSchema);
  