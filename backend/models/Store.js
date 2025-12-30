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