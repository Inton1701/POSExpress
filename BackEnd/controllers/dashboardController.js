const Product = require("../models/Products");
const Transaction = require("../models/KioskTransaction");
const asyncHandler = require("express-async-handler");

const dashboardController = {
    // Stock monitoring ito guys
    monitorStock: asyncHandler(async (io) => {
        const products = await Product.find();
        products.forEach(product => {
            if (product.stock <= 5) {
                io.emit('stockAlert', { message: `Low stock for ${product.name}: Only ${product.stock} left!` });
            }
            io.emit('productQuantityUpdate', { productId: product._id, stock: product.stock });
        });
    }),

    // Dashboard summary
    getDashboardSummary: asyncHandler(async (req, res) => {
        // Total Purchase Due for pending purchases
        const pendingPurchaseTransactions = await Transaction.find({ status: 'Pending', type: 'Purchase' });
        const totalPurchaseDue = pendingPurchaseTransactions.reduce((total, transaction) => total + transaction.amount, 0);

        // Total Sales Due for pending sales
        const pendingSalesTransactions = await Transaction.find({ status: 'Pending', type: 'Sale' });
        const totalSalesDue = pendingSalesTransactions.reduce((total, transaction) => total + transaction.amount, 0);

        // Total Sales Amount for completed transactions
        const completedSalesTransactions = await Transaction.find({ status: 'Completed', type: 'Sale' });
        const totalSalesAmount = completedSalesTransactions.reduce((total, transaction) => total + transaction.amount, 0);

        // Total Expense Amount for completed transactions
        let totalExpenseAmount = 0;
        for (const transaction of completedSalesTransactions) {
            const products = await Product.find({ _id: transaction.productId });
            totalExpenseAmount += products.reduce((sum, product) => sum + product.cost, 0);
        }

        res.status(200).json({ totalPurchaseDue, totalSalesDue, totalSalesAmount, totalExpenseAmount});
    }),

    // Daily, weekly, or monthly analytics 
    getSalesReport: asyncHandler(async (req, res) => {
        const period = req.params.period;
        const now = new Date();
        let matchStage = {};

        switch (period) {
            case 'daily':
                matchStage = {
                    transactionDate: {
                        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
                    }
                };
                break;
            case 'weekly':
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() - now.getDay());
                matchStage = {
                    transactionDate: {
                        $gte: firstDayOfWeek,
                        $lt: new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate() + 7)
                    }
                };
                break;
            case 'monthly':
                matchStage = {
                    transactionDate: {
                        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                        $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
                    }
                };
                break;
            default:
                return res.status(400).json({ message: "Invalid period. Choose 'daily', 'weekly', or 'monthly'." });
        }

        const salesReport = await Transaction.aggregate([
            { $match: { status: 'Completed', type: 'Sale', ...matchStage } },
            { $group: {
                _id: null, 
                totalSales: { $sum: "$amount" },
                completedTransactions: { $sum: 1 }
            }}
        ]);

        res.status(200).json({
            period,
            totalSales: salesReport.length ? salesReport[0].totalSales : 0,
            completedTransactions: salesReport.length ? salesReport[0].completedTransactions : 0
        });
    })
};

module.exports = dashboardController;