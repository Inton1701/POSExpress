const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Reference to an associated Order document
    transactionId: {
       type: String,
        required: true
       },

    // List of items in the transaction cart
    cart: [
      {
        _id: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        sku: {
          type: String,
          required: false,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1, 
        },
        total:{
          type: Number,
          min: 0,
        },
        isVariant: {
          type: Boolean,
          default: false
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          required: false
        },
        productId: {
          type: mongoose.Schema.Types.Mixed,
          required: false
        },
        addons: [{
          addonId: mongoose.Schema.Types.ObjectId,
          name: String,
          price: Number,
          quantity: Number
        }]
      },
    ],

    // Payment method used for the transaction
    paymentMethod: {
      type: String,
      enum: ['Cash', 'E-wallet'],
      required: true,
    },

    // Discounts applied to the transaction
    discounts: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0, // Ensure non-negative values
    },

    // Net amount (subtotal - discounts)
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // VAT applied to the transaction
    VAT: {
      type: Number,
      required: true,
      default: 0.0,
      min: 0,
    },

    // Total amount paid by the customer
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    cash:{
      type: Number,
      min: 0,

    },
    change: {
      type: Number, 
      min: 0,
    },

    status: {
      type: String,
      enum: ['Completed', 'Canceled', 'Voided', 'Deleted','Returned'],
      default: 'Completed',
    },
    employee: {
      type: String,
      default: 'unknown',
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    customerRfid: {
      type: String
    },
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: false
    },

    // Date and time of the transaction
    transactionDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model('Transaction', transactionSchema);
