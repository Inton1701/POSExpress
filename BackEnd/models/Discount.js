const mongoose = require('mongoose');
const discountSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: ['Percentage', 'Flat'], 
      required: true 
    },
    value: { 
      type: Number, 
      required: true 
    },
    applicableTo: { 
      type: String, 
      enum: ['Product', 'Order'], 
      required: true 
    },
    startDate: { 
      type: Date, 
      default: Date.now 
    },
    endDate: { 
      type: Date 
    },
    active: { 
      type: Boolean, 
      default: true 
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
  
  module.exports = mongoose.model('Discount', discountSchema);
  