const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  abbreviation: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true // Default to true (active)
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true // Ensures every SubCategory has an associated Category
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

module.exports = mongoose.model('SubCategory', subCategorySchema);