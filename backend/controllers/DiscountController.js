
const Discount = require("../models/Discount");
const asyncHandler = require("express-async-handler");

const discount = {
    // display discounts
    getAllDiscounts: asyncHandler(async (req, res) => {
        const discountList = await Discount.find();
        res.status(200).json({ success: true, discountList });
    }),

    // Add discount
    createDiscount: asyncHandler(async (req, res) => {
        const { name, type, value, applicableTo, startDate, endDate, active } = req.body;

        if (!name || !type || value === undefined || !applicableTo) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const createdDiscount = await Discount.create({ name, type, value, applicableTo, startDate, endDate, active
        });

        res.status(201).json({ success: true, createdDiscount });
    }),

    // Get discount
    getDiscount: asyncHandler(async (req, res) => {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }
        res.status(200).json({ success: true, discount });
    }),

    // Update discount 
    updateDiscount: asyncHandler(async (req, res) => {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }

        const updatedDiscount = await Discount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, updatedDiscount });
    }),

    // Delete discount 
    deleteDiscount: asyncHandler(async (req, res) => {
        const discount = await Discount.findById(req.params.id);
        if (!discount) {
            return res.status(404).json({ success: false, message: 'Discount not found' });
        }
        await Discount.deleteOne({ _id: req.params.id });
        res.status(204).json(); 
    })
}

module.exports = discount;
