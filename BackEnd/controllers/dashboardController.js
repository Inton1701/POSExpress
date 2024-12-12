const Product = require("../models/Products");
const Transaction = require("../models/Transactions");
const TransactionHistory = require("../models/TransactionHistory");
const asyncHandler = require("express-async-handler");

const dashboard = {
    salesData:  asyncHandler(async (req, res) => {
        try {
            // Fetch transactions from the TransactionHistory collection that have both openDate and closeDate
            const transactionsHistory = await TransactionHistory.find({
                openDate: { $exists: true },
                closeDate: { $exists: true },
            }).sort({ openDate: 1 }); // Sort by openDate for proper date range handling
    
            if (!transactionsHistory || transactionsHistory.length === 0) {
                return res.status(200).json({
                    success: true,
                    salesDatas: [],
                });
            }
    
            // Aggregate sales data for each transaction period in TransactionHistory
            const salesDatas = await Promise.all(
                transactionsHistory.map(async (history) => {
                    const { openDate, closeDate } = history;
    
                    // Format the date range to include the time in the response
                    const formattedRange = `${openDate.toISOString().split('T')[0]} ${openDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${closeDate.toISOString().split('T')[0]} ${closeDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
    
                    // Fetch sales data for each period defined by openDate and closeDate
                    const periodSalesData = await Transaction.aggregate([
                        {
                            $match: {
                                status: "Completed", // Match only completed transactions
                                createdAt: { $gte: openDate, $lte: closeDate }, // Filter by date range
                            },
                        },
                        {
                            $unwind: "$cart", // Decompose the cart array into individual items
                        },
                        {
                            $lookup: {
                                from: "products", // Match products
                                localField: "cart.sku",
                                foreignField: "sku",
                                as: "productInfo",
                            },
                        },
                        {
                            $unwind: "$productInfo", // Decompose the productInfo array
                        },
                        {
                            $group: {
                                _id: formattedRange, // Use the formatted date range as the _id
                                totalSales: { $sum: "$totalAmount" },
                                totalProfit: {
                                    $sum: {
                                        $multiply: [
                                            { $subtract: ["$cart.price", "$productInfo.cost"] },
                                            "$cart.quantity",
                                        ],
                                    },
                                },
                            },
                        },
                        {
                            $sort: { _id: 1 }, // Sort by date range (optional, already ordered by openDate)
                        },
                    ]);
    
                    return periodSalesData;
                })
            );
    
            // Flatten the array of sales data and return it as a single dataset
            const flattenedSalesData = salesDatas.flat();
    
            res.status(200).json({ success: true, salesDatas: flattenedSalesData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Failed to fetch sales data" });
        }
    }),

    dashboardStatistics: asyncHandler(async (req, res) => {
        try {
            // Fetch the open transaction period
            const openTransaction = await TransactionHistory.findOne({ isOpen: true });
    
            let startDate;
            let endDate = new Date(); // Use the current date for ongoing transactions
            let isOpenTransaction = true;
    
            if (openTransaction) {
                // If there's an open transaction, use its open date
                startDate = openTransaction.openDate;
            } else {
                // If no open transaction exists, use the latest closed transaction for reference
                const lastClosedTransaction = await TransactionHistory.findOne({ isOpen: false }).sort({ closeDate: -1 });
    
                if (!lastClosedTransaction) {
                    // No transactions exist
                    return res.status(200).json({
                        success: true,
                        statistics: {
                            totalTransactions: 0,
                            totalCompletedTransactions: 0,
                            totalVoidedTransactions: 0,
                            totalReturnedTransactions: 0,
                            totalSalesAmount: 0,
                            totalProfitAmount: 0,
                            totalLossAmount: 0,
                            totalItemsSold: 0,
                            dateRange: null,
                        },
                    });
                }
    
                // Use the closed transaction's openDate and closeDate as the range
                startDate = lastClosedTransaction.openDate;
                endDate = lastClosedTransaction.closeDate;
                isOpenTransaction = false;
            }
    
            // Fetch statistics based on the date range
            const totalTransactions = await Transaction.countDocuments({
                createdAt: { $gte: startDate, $lte: endDate },
            });
    
            const totalCompletedTransactions = await Transaction.countDocuments({
                status: "Completed",
                createdAt: { $gte: startDate, $lte: endDate },
            });
    
            const totalVoidedTransactions = await Transaction.countDocuments({
                status: "Voided",
                createdAt: { $gte: startDate, $lte: endDate },
            });
    
            const totalReturnedTransactions = await Transaction.countDocuments({
                status: "Returned",
                createdAt: { $gte: startDate, $lte: endDate },
            });
    
            const totalSalesAmount = await Transaction.aggregate([
                { $match: { status: "Completed", createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
            ]).then((result) => (result[0]?.totalSales || 0));
    
            const totalProfitAmount = await Transaction.aggregate([
                { $match: { status: "Completed", createdAt: { $gte: startDate, $lte: endDate } } },
                { $unwind: "$cart" },
                {
                    $lookup: {
                        from: "products",
                        localField: "cart.sku",
                        foreignField: "sku",
                        as: "productInfo",
                    },
                },
                { $unwind: "$productInfo" },
                {
                    $group: {
                        _id: null,
                        totalProfit: {
                            $sum: {
                                $multiply: [
                                    { $subtract: ["$cart.price", "$productInfo.cost"] },
                                    "$cart.quantity",
                                ],
                            },
                        },
                    },
                },
            ]).then((result) => (result[0]?.totalProfit || 0));
    
            const totalItemsSold = await Transaction.aggregate([
                { $match: { status: "Completed", createdAt: { $gte: startDate, $lte: endDate } } },
                { $unwind: "$cart" },
                { $group: { _id: null, totalItems: { $sum: "$cart.quantity" } } },
            ]).then((result) => (result[0]?.totalItems || 0));
    
            const totalLossAmount = await Transaction.aggregate([
                { $match: { status: { $in: ["Voided", "Returned"] }, createdAt: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: null, totalLoss: { $sum: "$totalAmount" } } },
            ]).then((result) => (result[0]?.totalLoss || 0));
    
            // Return the statistics with the relevant date range
            res.status(200).json({
                success: true,
                statistics: {
                    totalTransactions,
                    totalCompletedTransactions,
                    totalVoidedTransactions,
                    totalReturnedTransactions,
                    totalSalesAmount,
                    totalProfitAmount,
                    totalLossAmount,
                    totalItemsSold,
                    dateRange: {
                        startDate,
                        endDate,
                    },
                    isOpenTransaction,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics" });
        }
    }),
    getFastMoving: asyncHandler( async(req, res)=>{
        try {
            const products = await Product.find({ sales: { $gt: 0 } }) // Filter for products with sales > 0
              .select('sku name price sales quantity price') // Select necessary fields
              .sort({ sales: -1 }); // Sort by sales in descending order
        
            // Calculate total sales for each product
            const result = products.map(product => ({
              sku: product.sku,
              name: product.name,
              price: product.price,
              sales: product.sales,
              quantity: product.quantity,
              totalSales: product.sales * product.price,
            }));
        
            res.json(result);
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
          }
    })
    
    
};

module.exports = dashboard;
