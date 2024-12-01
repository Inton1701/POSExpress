const Variant = require("../models/Variants");
const asyncHandler = require("express-async-handler");

const variantController = {
    // Get all variants
    getAllVariants: asyncHandler(async (req, res) => {
        const variantList = await Variant.find().populate("productId");
        res.status(200).json({ variantList });
    }),

    // Get a specific variant 
    getVariant: asyncHandler(async (req, res) => {
        const variant = await Variant.findById(req.params.id).populate("productId");
        if (!variant) {
            res.status(404);
            throw new Error("Variant not found");
        }
        res.status(200).json({ variant });
    }),

    // Add a new variant
    addVariant: asyncHandler(async (req, res) => {
        const { productId, name, options } = req.body;
        
        if (!productId || !name || !options) {
            return res.status(400).json({ message: "All fields are required" });
        }
        
        const newVariant = await Variant.create({
            productId,
            name,
            options
        });
        
        res.status(201).json({ newVariant });
    }),

    // Edit an existing variant
    editVariant: asyncHandler(async (req, res) => {
        const variant = await Variant.findById(req.params.id);
        if (!variant) {
            res.status(404);
            throw new Error("Variant not found");
        }
        
        const updatedVariant = await Variant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        
        res.status(200).json({ updatedVariant });
    }),

    // Delete a variant 
    deleteVariant: asyncHandler(async (req, res) => {
        const variant = await Variant.findById(req.params.id);
        if (!variant) {
            res.status(404);
            throw new Error("Variant not found");
        }
        
        await Variant.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Variant ${req.params.id} successfully deleted' });
    })
};

module.exports = variantController;
