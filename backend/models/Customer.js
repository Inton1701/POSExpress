const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    rfid: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    birthday: {
        type: Date,
        required: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'disabled'],
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

module.exports = mongoose.model('Customer', userSchema);
