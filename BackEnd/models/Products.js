const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
     type: String,
     required: true 
    },
  description: { 
    type: String 
    },
  price: { 
    type: Number, 
    required: true 
    },
  cost:{
    type: Number,
    required: true
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category' 
    },
  subcategoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subcategory' 
    },
  unitId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit' 
    },
  brandId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Brand' 
    },
  discountId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Discount' 
    },
  stock: { 
    type: Number, 
    default: 0 
    },
  stockAlert: {
    type: Number,
    default: 10
    },  
  barcode: {
    type: String, 
    unique: true, 
    required: true
    },
  manufacturedDate: {
    type: Date,
    },
  expiryDate: {
    type: Date, 
    },
  imageUrl: { 
    type: String 
    },
  status: { 
    type: String, 
    default: 'active' 
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

module.exports = mongoose.model('Product', productSchema);
