productController
const Product = require("../models/Products");
const asyncHandler = require("express-async-handler");

const product = {
    // Get products
    getAllProducts: asyncHandler(async (req, res) => {
        const productList = await Product.find().populate('categoryId subcategoryId unitId brandId discountId');
        res.status(200).json({ success: true, productList });
    }),

    // Add product
    addProduct: asyncHandler(async (req, res) => {
        const { name, description, price, cost, categoryId, subcategoryId, unitId, brandId, discountId, stock, stockAlert, barcode, manufacturedDate, expiryDate, imageUrl, status
        } = req.body;

        if (!name || !price || !cost || !barcode) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const createdProduct = await Product.create({
            name, description, price, cost, categoryId, subcategoryId, unitId, brandId, discountId, stock, stockAlert, barcode, manufacturedDate, expiryDate, imageUrl,  status
        });

        res.status(201).json({ success: true, createdProduct });
    }),

    // Get product 
    getProduct: asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id).populate('categoryId subcategoryId unitId brandId discountId');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, product });
    }),

    // Update product 
    editProduct: asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, updatedProduct });
    }),

    // Delete product by ID
    deleteProduct: asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        await Product.deleteOne({ _id: req.params.id });
        res.status(204).json(); 
    })
}

module.exports = product;