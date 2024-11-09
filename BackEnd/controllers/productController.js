const Product = require("../models/Products");
const asyncHandler = require("express-async-handler");

const product = {
    // Get all products
    getAllProducts: asyncHandler(async (req, res) => {

        try {
            const products = await Product.find();
            // Map product data to include the correct image URL
            const productList = products.map(product => ({
              ...product._doc,
              image: product.image ? `http://localhost:5000/uploads/${product.image}` : '',
     
            }));
     
            res.json({ success: true, productList });
          } catch (error) {
            res.status(500).json({ success: false, message: error.message });
          }
    }),

    // Add a product
    addProduct: asyncHandler(async (req, res) => {
        const {
            sku, name, description, price, cost, category, subcategory, unit, brand, variant, discount,
            discountType, manufacturedDate, expiryDate, status
        } = req.body;

        if (!sku || !name || !price || !cost || !status) {
            return res.status(400).json({ success: false, message: "Please fill out all required fields." });
        }

        const image = req.file ? req.file.filename : null;

        const createdProduct = await Product.create({
            sku, name, description, price, cost, category, subcategory, unit, brand, variant, discount,
            discountType, manufacturedDate, expiryDate, image, status
        });

        res.status(201).json({ success: true, createdProduct });
    }),

    // Get a single product by ID
    getProduct: asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, product });
    }),

    // Update a product
    editProduct: asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, updatedProduct });
    }),

    // Delete a product
    deleteProduct: asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    }),
};

module.exports = product;
