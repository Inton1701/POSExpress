const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({

    googleID: {
       type: String,
       required: true,
    },
    status:{
        type: boolean,
        default: true
    },
    filepath:{
        type: String,
    }

},
{timestamps: true}
)

module.exports = mongoose.model('Config', configSchema);