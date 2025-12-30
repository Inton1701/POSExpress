const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");

const product = {
    // Get all products
    getAllProducts: asyncHandler(async (req, res) => {
        try {
            let query = { status: { $ne: 'deleted' } };
            
            // If user info is provided (from middleware)
            if (req.user) {
                if (req.user.role === 'Co-Admin') {
                    // Co-Admin can only see products in their store or global products
                    query.$or = [
                        { stores: req.user.store._id },
                        { isGlobal: true }
                    ];
                }
                // Admin sees all products (no additional filter)
            }
            
            const products = await Product.find(query).populate('stores', 'storeName address').populate('addons', 'name status');
            res.status(200).json({ success: true, products });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
        }
    }),

    // Create a product
    createProduct: asyncHandler(async (req, res) => {
        try {
            const { sku, name, price, cost, category, discount, discountType, quantity, quantityAlert, taxType, stores, status, addons, isVattable } = req.body;

            // Validate required fields
            if (!sku || !name || !price || !cost) {
                return res.status(400).json({ success: false, message: "SKU, name, price, and cost are required" });
            }

            // Check if SKU already exists
            const existingProduct = await Product.findOne({ sku });
            if (existingProduct) {
                return res.status(400).json({ success: false, message: "SKU already exists" });
            }

            // Determine if product is global or store-specific
            let isGlobal = false;
            let productStores = stores || [];

            if (req.user) {
                if (req.user.role === 'Admin') {
                    // Admin can create global products (no stores specified) or store-specific
                    isGlobal = !stores || stores.length === 0;
                } else if (req.user.role === 'Co-Admin') {
                    // Co-Admin can only create products for their store
                    isGlobal = false;
                    productStores = [req.user.store._id];
                }
            } else {
                // When req.user is not available, use the stores and isGlobal from request body
                isGlobal = req.body.isGlobal !== undefined ? req.body.isGlobal : (!stores || stores.length === 0);
            }

            const createdProduct = await Product.create({
                sku,
                name,
                price,
                cost,
                category,
                discount,
                discountType,
                quantity,
                quantityAlert,
                taxType,
                stores: productStores,
                isGlobal,
                status,
                addons: addons || [],
                isVattable: isVattable || false
            });

            res.status(201).json({ success: true, product: createdProduct });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
        }
    }),

    // Get a single product by ID
    getProduct: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id).populate('stores', 'storeName address contact').populate('addons', 'name status');
            
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            res.status(200).json({ success: true, product });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
        }
    }),

    // Update a product
    updateProduct: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // If updating SKU, check if new SKU already exists
            if (req.body.sku && req.body.sku !== product.sku) {
                const existingProduct = await Product.findOne({ sku: req.body.sku });
                if (existingProduct) {
                    return res.status(400).json({ success: false, message: "SKU already exists" });
                }
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            res.status(200).json({ success: true, product: updatedProduct });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
        }
    }),

    // Delete a product (soft delete)
    deleteProduct: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Soft delete by setting status to 'deleted'
            product.status = 'deleted';
            await product.save();

            res.status(200).json({ success: true, message: 'Product deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
        }
    }),

    // Get products by category
    getProductsByCategory: asyncHandler(async (req, res) => {
        try {
            const category = req.params.category;
            let products;

            if (category === 'all') {
                products = await Product.find({ status: { $ne: 'deleted' } }).populate('stores', 'storeName');
            } else {
                products = await Product.find({ 
                    category: category,
                    status: { $ne: 'deleted' }
                }).populate('stores', 'storeName');
            }

            res.status(200).json({ success: true, products });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch products by category', error: error.message });
        }
    }),

    // Check if SKU exists
    checkSKU: asyncHandler(async (req, res) => {
        try {
            const sku = req.params.sku;
            const existingProduct = await Product.findOne({ sku });
            
            if (existingProduct) {
                res.status(200).json({ exists: true, message: "SKU already exists" });
            } else {
                res.status(200).json({ exists: false });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to check SKU', error: error.message });
        }
    }),

    // Update product stock
    updateStock: asyncHandler(async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);
            
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            const { quantity, quantityAlert } = req.body;
            const prevQuantity = product.quantity;

            if (quantity !== undefined) {
                product.quantity = Number(quantity);
                
                // Update lastRestock if quantity increased
                if (Number(quantity) > prevQuantity) {
                    product.lastRestock = Date.now();
                }

                // Update status based on quantity
                if (product.quantity <= 0) {
                    product.status = 'sold out';
                } else if (product.status === 'sold out') {
                    product.status = 'active';
                }
            }

            if (quantityAlert !== undefined) {
                product.quantityAlert = Number(quantityAlert);
            }

            await product.save();

            res.status(200).json({ 
                success: true, 
                product,
                message: 'Stock updated successfully'
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update stock', error: error.message });
        }
    }),

    // Get low stock products
    getLowStock: asyncHandler(async (req, res) => {
        try {
            const lowStock = await Product.find({
                $and: [
                    { $expr: { $lte: ["$quantity", "$quantityAlert"] } },
                    { quantity: { $gt: 0 } },
                    { status: { $ne: "deleted" } }
                ]
            });

            res.status(200).json({ success: true, products: lowStock });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch low stock products', error: error.message });
        }
    }),

    // Get out of stock products
    getOutOfStock: asyncHandler(async (req, res) => {
        try {
            const outOfStock = await Product.find({
                $and: [
                    { quantity: { $lte: 0 } },
                    { status: { $ne: "deleted" } }
                ]
            });

            res.status(200).json({ success: true, products: outOfStock });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch out of stock products', error: error.message });
        }
    }),

    // Get products by store
    getProductsByStore: asyncHandler(async (req, res) => {
        try {
            const storeId = req.params.storeId;
            const products = await Product.find({
                stores: storeId,
                status: { $ne: 'deleted' }
            }).populate('stores', 'storeName address');

            res.status(200).json({ success: true, products });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch products by store', error: error.message });
        }
    })
};

module.exports = product;
