const userSchema = new mongoose.Schema({
  username: { 
      type: String, 
      required: true, 
      unique: true 
  },
  password: { 
      type: String, 
      required: true 
  },
  role: { 
      type: String, 
      enum: ['Admin', 'Cashier'], 
      required: true 
  },
  firstName: { 
      type: String, 
      required: true 
  },
  lastName: { 
      type: String, 
      required: true 
  },
  birthdate: { 
      type: Date, 
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

module.exports = mongoose.model('User', userSchema);
