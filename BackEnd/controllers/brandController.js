const Brand = require("../models/Brands");
const asyncHandler = require("express-async-handler");

const brand = {
    // Get all brands
    getAllBrands: asyncHandler(async (req, res) => {
        const brandList = await Brand.find();
        res.status(200).json({ brandList });
    }),

    // Add brand
    addBrand: asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const createdBrand = await Brand.create({ name, description });
        res.status(201).json({ createdBrand });
    }),

    // Get brand by ID
    getBrand: asyncHandler(async (req, res) => {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            res.status(404).json({ message: "Brand not found" });
            return;
        }
        res.status(200).json({ brand });
    }),

    // Update brand by ID
    editBrand: asyncHandler(async (req, res) => {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            res.status(404).json({ message: "Brand not found" });
            return;
        }
        const updatedBrand = await Brand.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ updatedBrand });
    }),

    // Delete brand by ID
    deleteBrand: asyncHandler(async (req, res) => {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            res.status(404).json({ message: "Brand not found" });
            return;
        }
        await Brand.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: '${req.params.id} is successfully deleted' });
    })
}

module.exports = brand;