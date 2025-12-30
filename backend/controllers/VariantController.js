const Variant = require("../models/Variant");
const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");

const variant = {
    // Get all variants for a product
    getProductVariants: asyncHandler(async (req, res) => {
        try {
            const variants = await Variant.find({ 
                productId: req.params.productId,
                status: { $ne: 'deleted' }
            });
            res.status(200).json({ success: true, variants });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch variants', error: error.message });
        }
    }),

    // Create variant(s) for a product
    createVariants: asyncHandler(async (req, res) => {
        try {
            const { productId, variants } = req.body;

            // Validate product exists
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Validate variants array
            if (!variants || !Array.isArray(variants) || variants.length === 0) {
                return res.status(400).json({ success: false, message: 'Variants array is required' });
            }

            const createdVariants = [];

            for (const variantData of variants) {
                const { name, value, price, cost, sku, status, quantity, quantityAlert } = variantData;

                // Auto-generate SKU if not provided
                const variantSku = sku || `${product.sku}-${value.substring(0, 3).toUpperCase()}`;

                // Check if variant SKU already exists (excluding deleted variants)
                const existingVariant = await Variant.findOne({ 
                    sku: variantSku, 
                    status: { $ne: 'deleted' } 
                });
                if (existingVariant) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Variant SKU ${variantSku} already exists` 
                    });
                }

                const variant = await Variant.create({
                    productId,
                    name,
                    value,
                    price: price || 0,
                    cost: cost || 0,
                    sku: variantSku,
                    status: status || 'active',
                    quantity: quantity || 0,
                    quantityAlert: quantityAlert || 5
                });

                createdVariants.push(variant);
            }

            res.status(201).json({ 
                success: true, 
                message: 'Variants created successfully',
                variants: createdVariants 
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create variants', error: error.message });
        }
    }),

    // Update a variant
    updateVariant: asyncHandler(async (req, res) => {
        try {
            const variant = await Variant.findById(req.params.id);
            
            if (!variant) {
                return res.status(404).json({ success: false, message: 'Variant not found' });
            }

            // If updating SKU, check if new SKU already exists
            if (req.body.sku && req.body.sku !== variant.sku) {
                const existingVariant = await Variant.findOne({ sku: req.body.sku });
                if (existingVariant) {
                    return res.status(400).json({ success: false, message: "Variant SKU already exists" });
                }
            }

            const updatedVariant = await Variant.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            res.status(200).json({ success: true, variant: updatedVariant });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update variant', error: error.message });
        }
    }),

    // Delete a variant (soft delete)
    deleteVariant: asyncHandler(async (req, res) => {
        try {
            const variant = await Variant.findById(req.params.id);
            
            if (!variant) {
                return res.status(404).json({ success: false, message: 'Variant not found' });
            }

            variant.status = 'deleted';
            await variant.save();

            res.status(200).json({ success: true, message: 'Variant deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete variant', error: error.message });
        }
    }),

    // Find variant by SKU
    getVariantBySku: asyncHandler(async (req, res) => {
        try {
            const variant = await Variant.findOne({ 
                sku: req.params.sku,
                status: { $ne: 'deleted' }
            }).populate('productId');

            if (!variant) {
                return res.status(404).json({ success: false, message: 'Variant not found' });
            }

            res.status(200).json({ success: true, variant });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch variant', error: error.message });
        }
    }),

    // Get all variants
    getAllVariants: asyncHandler(async (req, res) => {
        try {
            const variants = await Variant.find({ status: { $ne: 'deleted' } })
                .populate('productId', 'name sku price');
            res.status(200).json({ success: true, variants });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch variants', error: error.message });
        }
    })
};

module.exports = variant;
