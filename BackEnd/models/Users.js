<<<<<<< Updated upstream
<<<<<<< Updated upstream
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
=======
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: { 
            type: String, 
            required: true, 
            unique: true 
        },
        password: { 
            type: String, 
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
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            match: [/.+@.+\..+/, 'Please enter a valid email address'] // Email format validation
        },
        birthDate: { 
            type: Date, 
            required: true 
        },
        role: { 
            type: String, 
            enum: ['Admin', 'Cashier'], 
            required: true 
        }
    },
    { timestamps: true } // Automatically manage `createdAt` and `updatedAt`
);
>>>>>>> Stashed changes
=======
const mongoose = require("mongoose");

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
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    birthDate: { 
        type: Date, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['Admin', 'Cashier'], 
        default: 'Cashier'  
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true 
});
>>>>>>> Stashed changes

module.exports = mongoose.model('User', userSchema);
