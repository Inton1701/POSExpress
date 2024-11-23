const StockHistory = require("../models/StocksHistory");
const asyncHandler = require("express-async-handler");

const history = {
    // Get all stock history
    getAllHistory: asyncHandler(async (req, res) => {
        const history = await StockHistory.find({ isDeleted: false });
        res.json({ success: true, history });
    }),

    // Get stock history by id
    getHistory: asyncHandler(async (req, res) => {
        const history = await StockHistory.findById(req.params.id);
        if (!history) {
            return res.status(404).json({ success: false, message: 'History not found' });
        }
        res.status(200).json({ success: true, history });
    }),

    // Add new stock history
    addHistory: asyncHandler(async (req, res) => {
        const { sku, product, prevStock, changes, newStock } = req.body;

        if (!sku || !product || !prevStock || !changes || !newStock) {
            return res.status(400).json({ success: false, message: "Please fill out all required fields." });
        }

        const createHistory = await StockHistory.create({ sku, product, prevStock, changes, newStock });

        res.status(201).json({ success: true, createHistory });
    }),

  
};

module.exports = history;
