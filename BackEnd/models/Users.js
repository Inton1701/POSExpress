const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true, 
    },
    lastName: { 
        type: String, 
        required: true, 
    },
    phone: { 
        type: String, 
    },
    email: { 
        type: String, 
        unique: true, // Enforce uniqueness for email
        required: true, // Mark as required if needed
    },
    birthdate: { 
        type: Date, 
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
    login: {
        type: Date,
        default: null, 
    },
    logout: {
      type: Date,
      default: null, 
  },
    image: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Online', 'Offline', 'Deleted'],
        default: 'Offline'
    },
    userStatus:{
        type: String,
        enum: ['Enabled', 'Disabled'],
        default: 'Disabled'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
