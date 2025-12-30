const mongoose = require('mongoose');

const transactionSessionSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: false,
      required: true
    },
    startedBy: {
      type: String,
      default: 'System'
    },
    startedAt: {
      type: Date
    },
    endedBy: {
      type: String
    },
    endedAt: {
      type: Date
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    salesSummary: {
      totalSales: {
        type: Number,
        default: 0
      },
      totalProfit: {
        type: Number,
        default: 0
      },
      totalProductsSold: {
        type: Number,
        default: 0
      },
      transactionCount: {
        type: Number,
        default: 0
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TransactionSession', transactionSessionSchema);
