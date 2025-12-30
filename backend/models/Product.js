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
  taxType: {
    type: String,
    enum: ["vatable", "none-vatable",],
    default: "vatable",
    required: true
  },
  isVattable: {
    type: Boolean,
    default: false
  },
  stores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  isGlobal: {
    type: Boolean,
    default: false
  },
  addons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Addon'
  }],
  status: {
    type: String,
    enum: ["active", "inactive", "deleted","sold out"],
    required: true,
    default: "active",
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
