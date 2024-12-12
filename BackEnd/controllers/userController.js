const User = require("../models/Users");
const History = require("../models/StocksHistory");
const asyncHandler = require("express-async-handler");
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const product = {
    // Get all products
    getAllUsers: asyncHandler(async (req, res) => {
        try {
            const users = await User.find({ status: { $ne: 'Deleted' } }).sort({updatedAt: -1});
            res.status(201).json({ success: true, users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
        }
    }),

   // Add a user
addUser: asyncHandler(async (req, res) => {
    try {
        const { firstName, lastName, email, phone, birthdate, role, password } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !birthdate || !role || !password) {
            return res.status(400).json({ success: false, message: "Please fill out all required fields." });
        }

        // Hash password before saving to the database
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

    
        const image = req.file ? req.file.filename : null;

        // Create a new user in the database
        const createdUser = await User.create({
            firstName, lastName, email, phone, birthdate, role, password: hashedPassword, image
        });

        // Send response
        res.status(201).json({ success: true, createdUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add user', error: error.message });
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
    
            // Validate the incoming values (ensure they are numbers)
            const { entryValue, quantityAlert } = req.body;
            if (isNaN(entryValue) || isNaN(quantityAlert)) {
                return res.status(400).json({ success: false, message: 'Invalid entry value or quantity alert' });
            }
    
            const prevStock = product.quantity;
            const newStock = prevStock + Number(entryValue);
            const newQuantityAlert = Number(quantityAlert);
    
            // Update the product's stock and alert values
            product.quantity = newStock;
            product.quantityAlert = newQuantityAlert;
    
            // Update lastRestock only if entryValue is greater than 0 (indicating a restock)
            if (entryValue > 0) {
                product.lastRestock = Date.now();
            }
    
            // Save the updated product
            const updatedProduct = await product.save();
    
            // Create a history entry for tracking stock changes
            await History.create({
                sku: product.sku,
                product: product.name,
                prevStock: prevStock,
                change: Number(entryValue),
                newStock: newStock,
            });
    
            // Respond with success and updated product data
            res.status(200).json({
                success: true,
                updatedProduct,
                message: 'Stock updated successfully',
            });
        } catch (error) {
            // Error handling
            console.error(error); // Log error for debugging
            res.status(500).json({ success: false, message: 'Failed to update stock', error: error.message });
        }
    }),

    importProducts: asyncHandler(async (req, res) => {

        const products = req.body.products;

        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: 'No products to import' });
        }

        try {
            // Insert valid products into the database
            const insertedProducts = await Product.insertMany(products);

            // Respond with success
            res.json({ success: true, message: `${insertedProducts.length} products successfully imported` });
        } catch (error) {
            console.error('Error importing products:', error);
            res.status(500).json({ success: false, message: 'Failed to import products', error: error.message });
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
            const lowStock = await Product.find({
                $and: [
                    { $expr: { $lte: ["$quantity", "$quantityAlert"] } },  // Check if quantity is less than or equal to quantityAlert
                    { status: { $ne: "deleted" } }  // Check if status is not "deleted"
                ]
            }).sort({createdAt:-1});

            res.status(200).json({ success: true, lowStock });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch low stock products', error: error.message });
        }
    }),

    // Get out of stock products
    getOutOfStock: asyncHandler(async (req, res) => {
        try {
            const noStock = await Product.find({
                $and: [
                    { $expr: { $lte: ["$quantity", 0] } },
                    { status: { $ne: "deleted" } }
                ]
            }).sort({createdAt:-1});

            res.status(200).json({ success: true, noStock });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch out of stock products', error: error.message });
        }
    }),

    generateReports: asyncHandler(async (req,res)=>{
        try{
            const products = await Product.find(
                {}, // Find all products
                {
                    _id: 0,
                    description: 0,
                    variant: 0,
                    discount: 0,
                    discountType: 0,
                    image: 0,
                }
            )
            res.status(200).json({ success:true, products: products })
        }catch(error){
            res.status(500).json({ success: false, message: error.message });
        }
    }),
      getProductsByCategory: asyncHandler(async (req, res) => {
        const category = req.params.id; // Retrieve category from the URL params
        let products;
      
        if (category === 'all') {
          // Fetch all products if category is 'all'
          products = await Product.find();
        } else {
          // Fetch products by the specific category
          products = await Product.find({ category: category }).sort({createdAt:-1});
        }
      
        res.status(200).json({ products: products });
      })
};

module.exports = product;
