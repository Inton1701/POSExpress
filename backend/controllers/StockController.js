const Product = require("../models/Product");
const Variant = require("../models/Variant");
const Addon = require("../models/Addon");
const StockHistory = require("../models/StockHistory");
const asyncHandler = require("express-async-handler");

const stock = {
    // Get all stock (products and variants)
    getAllStock: asyncHandler(async (req, res) => {
        try {
            const products = await Product.find({ status: { $ne: 'deleted' } }).populate('stores', 'storeName');
            const variants = await Variant.find({ status: { $ne: 'deleted' } }).populate('productId', 'name sku stores isGlobal');
            const addons = await Addon.find({ status: { $ne: 'deleted' } }).populate('stores', 'storeName');
            
            // Combine products and their variants for stock view
            const stockData = [];
            
            for (const product of products) {
                const productVariants = variants.filter(v => v.productId._id.toString() === product._id.toString());
                
                if (productVariants.length > 0) {
                    // Product has variants - show each variant as separate stock item
                    productVariants.forEach(variant => {
                        stockData.push({
                            _id: variant._id,
                            sku: variant.sku,
                            name: `${product.name} - ${variant.value}`,
                            productName: product.name,
                            variantValue: variant.value,
                            price: product.price + variant.price,
                            quantity: variant.quantity || 0,
                            quantityAlert: variant.quantityAlert || 5,
                            status: variant.status,
                            hasVariant: true,
                            variantId: variant._id,
                            productId: product._id,
                            stores: product.stores || [],
                            isGlobal: product.isGlobal || false
                        });
                    });
                } else {
                    // Product without variants
                    stockData.push({
                        _id: product._id,
                        sku: product.sku,
                        name: product.name,
                        productName: product.name,
                        variantValue: null,
                        price: product.price,
                        quantity: product.quantity || 0,
                        quantityAlert: product.quantityAlert || 5,
                        status: product.status,
                        hasVariant: false,
                        productId: product._id,
                        stores: product.stores || [],
                        isGlobal: product.isGlobal || false
                    });
                }
            }
            
            // Add add-ons to stock data
            addons.forEach(addon => {
                stockData.push({
                    _id: addon._id,
                    sku: null,
                    name: addon.name,
                    productName: addon.name,
                    variantValue: null,
                    price: 0,
                    quantity: addon.quantity || 0,
                    quantityAlert: addon.quantityAlert || 5,
                    status: addon.status,
                    hasVariant: false,
                    isAddon: true,
                    addonId: addon._id,
                    stores: addon.stores || [],
                    isGlobal: addon.isGlobal || false
                });
            });
            
            res.status(200).json({ success: true, stock: stockData });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch stock', error: error.message });
        }
    }),

    // Get all stock history
    getAllStockHistory: asyncHandler(async (req, res) => {
        try {
            const history = await StockHistory.find({ isDeleted: false })
                .sort({ updatedAt: -1 })
                .limit(500);
            
            // Enhance history with current product names
            const enhancedHistory = await Promise.all(history.map(async (entry) => {
                let currentProductName = entry.product; // Default to stored name
                
                try {
                    // Try to find current product/variant by SKU to get updated name
                    const variant = await Variant.findOne({ sku: entry.sku, status: { $ne: 'deleted' } })
                        .populate('productId', 'name');
                    
                    if (variant && variant.productId) {
                        currentProductName = `${variant.productId.name} - ${variant.value}`;
                    } else {
                        // Try to find as product
                        const product = await Product.findOne({ sku: entry.sku, status: { $ne: 'deleted' } });
                        if (product) {
                            currentProductName = product.name;
                        } else {
                            // Try to find as addon
                            const addon = await Addon.findOne({ sku: entry.sku, status: { $ne: 'deleted' } });
                            if (addon) {
                                currentProductName = addon.name;
                            }
                        }
                    }
                } catch (lookupError) {
                    console.error('Error looking up current product name:', lookupError);
                    // Keep the stored name if lookup fails
                }
                
                return {
                    ...entry.toObject(),
                    product: currentProductName
                };
            }));
            
            res.status(200).json({ success: true, history: enhancedHistory });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch stock history', error: error.message });
        }
    }),

    // Get stock history by SKU
    getStockHistoryBySku: asyncHandler(async (req, res) => {
        try {
            const history = await StockHistory.find({ 
                sku: req.params.sku,
                isDeleted: false 
            }).sort({ updatedAt: -1 });
            
            res.status(200).json({ success: true, history });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch stock history', error: error.message });
        }
    }),

    // Update stock (for product, variant, or addon)
    updateStock: asyncHandler(async (req, res) => {
        try {
            const { sku, newQuantity, reason, isVariant, variantId, productId, isAddon, addonId, updatedBy } = req.body;

            let prevQuantity, name, updatedItem;

            if (isAddon && addonId) {
                // Update addon stock
                const addon = await Addon.findById(addonId);
                if (!addon) {
                    return res.status(404).json({ success: false, message: 'Add-on not found' });
                }

                prevQuantity = addon.quantity || 0;
                addon.quantity = newQuantity;
                await addon.save();
                
                updatedItem = addon;
                name = addon.name;
            } else if (isVariant && variantId) {
                // Update variant stock
                const variant = await Variant.findById(variantId).populate('productId', 'name');
                if (!variant) {
                    return res.status(404).json({ success: false, message: 'Variant not found' });
                }

                prevQuantity = variant.quantity || 0;
                variant.quantity = newQuantity;
                await variant.save();
                
                updatedItem = variant;
                name = `${variant.productId.name} - ${variant.value}`;
            } else {
                // Update product stock
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }

                prevQuantity = product.quantity || 0;
                product.quantity = newQuantity;
                
                // Update status based on quantity
                if (product.quantity <= 0) {
                    product.status = 'sold out';
                } else if (product.status === 'sold out') {
                    product.status = 'active';
                }
                
                await product.save();
                updatedItem = product;
                name = product.name;
            }

            // Create stock history entry
            const change = newQuantity - prevQuantity;
            await StockHistory.create({
                sku: sku,
                product: name,
                prevStock: prevQuantity,
                change: change,
                newStock: newQuantity,
                reason: reason || 'Manual adjustment',
                updatedBy: updatedBy || 'Admin',
                transactionType: 'manual'
            });

            res.status(200).json({ 
                success: true, 
                message: 'Stock updated successfully',
                item: updatedItem
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update stock', error: error.message });
        }
    }),

    // Restock (add quantity)
    restock: asyncHandler(async (req, res) => {
        try {
            const { sku, quantityToAdd, isVariant, variantId, productId, isAddon, addonId, updatedBy } = req.body;

            let prevQuantity, newQuantity, name, updatedItem;

            if (isAddon && addonId) {
                // Restock addon
                const addon = await Addon.findById(addonId);
                if (!addon) {
                    return res.status(404).json({ success: false, message: 'Add-on not found' });
                }

                prevQuantity = addon.quantity || 0;
                newQuantity = prevQuantity + quantityToAdd;
                addon.quantity = newQuantity;
                await addon.save();
                
                updatedItem = addon;
                name = addon.name;
            } else if (isVariant && variantId) {
                // Restock variant
                const variant = await Variant.findById(variantId).populate('productId', 'name');
                if (!variant) {
                    return res.status(404).json({ success: false, message: 'Variant not found' });
                }

                prevQuantity = variant.quantity || 0;
                newQuantity = prevQuantity + quantityToAdd;
                variant.quantity = newQuantity;
                await variant.save();
                
                updatedItem = variant;
                name = `${variant.productId.name} - ${variant.value}`;
            } else {
                // Restock product
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }

                prevQuantity = product.quantity || 0;
                newQuantity = prevQuantity + quantityToAdd;
                product.quantity = newQuantity;
                product.lastRestock = Date.now();
                
                // Update status
                if (product.status === 'sold out') {
                    product.status = 'active';
                }
                
                await product.save();
                updatedItem = product;
                name = product.name;
            }

            // Create stock history entry
            await StockHistory.create({
                sku: sku,
                product: name,
                prevStock: prevQuantity,
                change: quantityToAdd,
                newStock: newQuantity,
                reason: 'Restock',
                updatedBy: updatedBy || 'Admin',
                transactionType: 'manual'
            });

            res.status(200).json({ 
                success: true, 
                message: 'Restocked successfully',
                item: updatedItem
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to restock', error: error.message });
        }
    }),

    // Set quantity alert threshold
    setQuantityAlert: asyncHandler(async (req, res) => {
        try {
            const { threshold, isVariant, variantId, productId } = req.body;

            if (isVariant && variantId) {
                // Set alert for variant
                const variant = await Variant.findById(variantId);
                if (!variant) {
                    return res.status(404).json({ success: false, message: 'Variant not found' });
                }

                variant.quantityAlert = threshold;
                await variant.save();

                res.status(200).json({ 
                    success: true, 
                    message: 'Alert threshold updated for variant',
                    variant
                });
            } else {
                // Set alert for product
                const product = await Product.findById(productId);
                if (!product) {
                    return res.status(404).json({ success: false, message: 'Product not found' });
                }

                product.quantityAlert = threshold;
                await product.save();

                res.status(200).json({ 
                    success: true, 
                    message: 'Alert threshold updated for product',
                    product
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to set alert', error: error.message });
        }
    })
};

module.exports = stock;
