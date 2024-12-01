const unitSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    abbreviation: { 
      type: String, 
      required: true 
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
  
  module.exports = mongoose.model('Unit', unitSchema);
  


  