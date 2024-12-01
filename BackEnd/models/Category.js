const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true 
    },
    description: { 
      type: String 
    },
    isActive: { 
      type: Boolean, 
      default: true // Default to true (active)
    },
  },
  { 
    timestamps: true // Automatically adds `createdAt` and `updatedAt` fields
  }
);

module.exports = mongoose.model('Category', categorySchema);
