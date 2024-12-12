const Brand = require("../models/Brands");
const asyncHandler = require("express-async-handler");
const fs = require('fs');
const path = require('path');

const brand = {
    // Get all brands
    getAllBrands: asyncHandler(async (req, res) => {
        try{
            const brandList = await Brand.find({status: {$ne: 'deleted'} }).sort({createdAt: -1});

            
            res.status(200).json({ success: true, brandList });
        }catch(error){
            res.status(500).json({ success: false, message: error.message });
        }
   
    }),

    // Add brand
    addBrand: asyncHandler(async (req, res) => {
        try {
            const { name, status } = req.body;
    
            // Check required fields
            if (!name || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and status are required',
                });
            }
    
            // Handle uploaded file
            const logo = req.file ? req.file.filename :'no-image-icon.png';
    
            // Save to database
            const newBrand = await Brand.create({
                name,
                logo,
                status,
            });
    
            return res.status(201).json({
                success: true,
                message: 'Brand added successfully',
                brand: newBrand,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                success: false,
                message: 'Failed to add brand',
                error: error.message,
            });
        }
    }),

    // Get brand by ID
    getBrand: asyncHandler(async (req, res) => {
        try {
            const brand = await Brand.findById(req.params.id);
    
            if (!brand) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Brand not found" 
                });
            }
    
   
            res.status(200).json({ 
                success: true, 
                brand: brand 
            });
    
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: "Failed to retrieve brand", 
                error: error.message 
            });
        }
    }),
    
    // Update brand by ID
    editBrand: asyncHandler(async (req, res) => {
        try {
            const brand = await Brand.findById(req.params.id);
            if (!brand) {
                return res.status(404).json({
                    success: false,
                    message: "Brand not found",
                });
            }
    
            // Update other fields
            const allowedUpdates = ['name', 'status'];
            allowedUpdates.forEach((key) => {
                if (req.body[key] !== undefined) {
                    brand[key] = req.body[key];
                }
            });
    

            if (req.body.logoRemoved === 'true') {
                if (brand.logo && brand.logo !== 'no-image-icon.png') {
                    const oldLogoPath = path.join(__dirname, '..', 'public', 'uploads', brand.logo);
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlink(oldLogoPath, (err) => {
                            if (err) console.error("Error deleting old logo:", err);
                        });
                    }
                }
                brand.logo = 'no-image-icon.png'; // Set to default logo
            }
    
            // Handle new file upload
            if (req.file && req.file.filename) {
                if (brand.logo && brand.logo !== 'no-image-icon.png') {
                    const oldLogoPath = path.join(__dirname, '..', 'public', 'uploads', brand.logo);
                    if (fs.existsSync(oldLogoPath)) {
                        fs.unlink(oldLogoPath, (err) => {
                            if (err) console.error("Error deleting old logo:", err);
                        });
                    }
                }
                brand.logo = req.file.filename; // Update logo with uploaded file
            }
    
            await brand.save();
    
            res.status(200).json({
                success: true,
                message: "Brand updated successfully",
                updatedBrand: {
                    ...brand._doc,
                    logo: brand.logo || 'no-image-icon.png',
                },
            });
        } catch (error) {
            console.error("Error in editBrand:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    }),
    

    // Delete brand by ID
    deleteBrand: asyncHandler(async (req, res) => {
        try {
            const brand = await Brand.findById(req.params.id);
            if (!brand) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Brand not found" 
                });
            }

            await Brand.deleteOne({ _id: req.params.id });
            res.status(200).json({ 
                success: true, 
                message: `Brand with ID ${req.params.id} has been successfully deleted` 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: "Failed to delete brand", 
                error: error.message 
            });
        }
    }),
};

module.exports = brand;
