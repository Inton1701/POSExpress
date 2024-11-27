const mongoose = require('mongoose');
const unitSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    shortname: { 
      type: String, 
      required: true 
    },
    status:{
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active"
    },
    deletedAt:{
      type: Date,
      default: null,
    }

  },
  {timestamps: true}

);
  
  module.exports = mongoose.model('Unit', unitSchema);
  