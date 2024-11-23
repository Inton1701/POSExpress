const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: 'no description yet',
  },
  price: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: "N/A",
  },
  unit: {
    type: String,
    default: "N/A",
  },
  brand: {
    type: String,
    default: "N/A",
  },
  variant: {
    type: String,
    default: "N/A",
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountType: {
    type: String,
    default: "none",
  },
  quantity: {
    type: Number,
    default: 0,
  },
  quantityAlert: {
    type: Number,
    default: 0,
  },
  manufacturedDate: {
    type: Date,
    required: false,
  },
  expiryDate: {
    type: Date,
    required: false,
  },
  image: {
    type: String,
    default: 'no-image-icon.png',

  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted"],
    required: true,
  },
  lastRestock:{
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
