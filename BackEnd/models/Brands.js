const mongoose = require('mongoose');
const brandSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true, 
      unique: true 
    },
    logo: {
      type: String,
      default: null,
    },
    status:{
      type: String,
      enum: ['active', 'inactive','deleted'],
      default: 'active' 
    },
    deletedAt:{
      type: Date,
      default: null,
    }

  },{timestamps: true});
  
  module.exports = mongoose.model('Brand', brandSchema);
  