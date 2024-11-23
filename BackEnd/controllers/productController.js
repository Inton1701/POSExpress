const Product = require("../models/Products");
const History = require("../models/StocksHistory");
const asyncHandler = require("express-async-handler");
const fs = require('fs');
const path = require('path');

const product = {
    // Get all products
    getAllProducts: asyncHandler(async (req, res) => {
        try {
            const products = await Product.find({ status: { $ne: 'deleted' } });
            res.json({ success: true, products });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
        }
    }),

    // check sku
    checkSKU: asyncHandler(async (req, res) => {
        try {
            const sku = req.params.id;
            const existingProduct = await Product.findOne({ sku: sku });
            if (existingProduct) {
                res.status(200).json({ exists: true, message: "SKU already exists." });
            } else {
                res.status(200).json({ exists: false });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to check SKU', error: error.message });
        }
    }),

    // Add a product
    addProduct: asyncHandler(async (req, res) => {
        try {
            const {
                sku, name, description, price, cost, category, unit, brand, variant, discount,
                discountType, manufacturedDate, expiryDate, status
            } = req.body;

            if (!sku || !name || !price || !cost || !status) {
                return res.status(400).json({ success: false, message: "Please fill out all required fields." });
            }

            const image = req.file ? req.file.filename : null;

            const createdProduct = await Product.create({
                sku, name, description, price, cost, category, unit, brand, variant, discount,
                discountType, manufacturedDate, expiryDate, image, status
            });

            res.status(201).json({ success: true, createdProduct });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to add product', error: error.message });
        }
    }),

    // Get a single product by ID
    getProduct: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            res.status(200).json({ success: true, product });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
        }
    }),

    // Update a product
    editProduct: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Define fields that can be updated from request body
            const allowedUpdates = [
                'sku', 'name', 'description', 'price', 'cost', 'category',
                'unit', 'brand', 'variant', 'discount', 'discountType',
                'manufacturedDate', 'expiryDate', 'status'
            ];

            // Update allowed fields
            allowedUpdates.forEach(key => {
                if (req.body[key] !== undefined) {
                    product[key] = req.body[key];
                }
            });

            // Handle new image upload if 
            
            if(req.file.filename !== 'no-image-icon.png'){
                if (req.file) {
                    // Optional: delete old image if it exists
                    if (product.image) {
                        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', product.image);
                        fs.unlink(oldImagePath, (err) => {
                            if (err) console.error('Error deleting old image:', err);
                        });
                    }
    
                    // Update product's image field with new filename
                    product.image = req.file.filename;
                }
            }   
            

            // Save updated product data
            await product.save();

            // Prepare the response with full image URL
            const updatedProduct = {
                ...product._doc,
                image: product.image ? product.image : null,
            };

            res.status(200).json({ success: true, updatedProduct });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
        }
    }),

    // Update stock
    editStock: asyncHandler(async (req, res) => {
        try {
            // Check if the product exists
            const product = await Product.findById(req.params.id);

            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Validate the incoming values
            const { entryValue, quantityAlert } = req.body;
            if (isNaN(entryValue) || isNaN(quantityAlert)) {
                return res.status(400).json({ success: false, message: 'Invalid entry value or quantity alert' });
            }

            const prevStock = product.quantity;
            const newStock = prevStock + Number(entryValue);
            const newQuantityAlert = Number(quantityAlert);

            // Update product fields
            product.quantity = newStock;
            product.quantityAlert = newQuantityAlert;
            if (entryValue >  0) {
                product.lastRestock = Date.now();
            }

            // Save the updated product
            const updatedProduct = await product.save();

            // Create a history entry
            const storeHistory = await History.create({
                sku: product.sku,
                product: product.name,
                prevStock: prevStock,
                change: Number(entryValue),
                newStock: newStock,
            });

            res.status(200).json({
                success: true,
                updatedProduct,
                message: 'Stock updated successfully',
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update stock', error: error.message });
        }
    }),

    // Delete a product
    deleteProduct: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
            await Product.findByIdAndDelete(req.params.id);
            res.status(200).json({ success: true, message: 'Product deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
        }
    }),

    // Get low stock products
    getLowStock: asyncHandler(async (req, res) => {
        try {
            const productList = await Product.find({
                $and: [
                    { $expr: { $lte: ["$quantity", "$quantityAlert"] } },  // Check if quantity is less than or equal to quantityAlert
                    { status: { $ne: "deleted" } }  // Check if status is not "deleted"
                ]
            });

            res.status(200).json({ success: true, productList });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch low stock products', error: error.message });
        }
    }),

    // Get out of stock products
    getOutOfStock: asyncHandler(async (req, res) => {
        try {
            const productList = await Product.find({
                $and: [
                    { quantity: 0 },
                    { status: { $ne: "deleted" } }
                ]
            });

            res.status(200).json({ success: true, productList });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch out of stock products', error: error.message });
        }
    })
};

module.exports = product;
