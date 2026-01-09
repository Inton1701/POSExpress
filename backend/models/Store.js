const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        default: "N/A",
    },
    contact: {
        type: String,
        default: "N/A"
    },
    tin: {
        type: String,
        default: "N/A"
    },
    coAdmins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sessionMode: {
        type: String,
        enum: ['manual', 'scheduled'],
        default: 'manual'
    },
    scheduleStartTime: {
        type: String,
        default: null
    },
    scheduleEndTime: {
        type: String,
        default: null
    },
    // Google Drive backup settings
    driveFolderId: {
        type: String,
        default: ''
    },
    lastBackupTime: {
        type: Date,
        default: null
    },
    backupSchedule: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'daily'
        },
        time: {
            type: String,
            default: '02:00'
        },
        dayOfWeek: {
            type: String,
            default: '0'
        },
        dayOfMonth: {
            type: Number,
            default: 1
        },
        options: {
            products: { type: Boolean, default: true },
            addons: { type: Boolean, default: true },
            transactions: { type: Boolean, default: true },
            customers: { type: Boolean, default: true },
            users: { type: Boolean, default: true }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now() ,
    }

})
module.exports = mongoose.model("Store", storeSchema);