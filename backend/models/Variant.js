const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    name: { 
      type: String, 
      required: true,
      trim: true
      // Example: "Size", "Color", "Material"
    },
    value: { 
      type: String, 
      required: true,
      trim: true
      // Example: "Small", "Medium", "Large"
    },
    price: {
      type: Number,
      default: 0,
      min: 0
      // Additional price on top of base product price
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
      // Additional cost on top of base product cost
    },
    sku: {
      type: String,
      trim: true
      // Optional unique SKU for this variant (e.g., "PROD001-S")
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
      // Stock quantity for this variant
    },
    quantityAlert: {
      type: Number,
      default: 5,
      min: 0
      // Alert threshold for low stock
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active"
    }
  }, { 
    timestamps: true 
  });
  
  module.exports = mongoose.model('Variant', variantSchema);
  