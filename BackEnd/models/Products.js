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
    default: 0,
    required: true,
  },
  sales:{
    type: Number,
    default: 0,
  },
  returns:{
    type: Number,
    default: 0,
  },
  category: {
    type: String,
  },
  unit: {
    type: String,
       default: 'NONE',
  },
  brand: {
    type: String,
       default: 'NONE',
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
    default: null,

  },
  status: {
    type: String,
    enum: ["active", "inactive", "deleted"],
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
  },
  
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
