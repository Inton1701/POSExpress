const Brand = require("../models/Brands");
const asyncHandler = require("express-async-handler");

const brand = {
    // Get all brands
    getAllBrands: asyncHandler(async (req, res) => {
        try{
            const brandList = await Brand.find({status: {$ne: 'deleted'} });

            
        // const brandList = brands.map(brand => ({
        //     ...brand._doc,
        //     logo: brand.logo ? `http://localhost:5000/uploads/${brand.logo}` : '',
        // }));

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
    
            // Add full URL for the logo
            // const brandDetails = {
            //     ...brand._doc,
            //     logo: brand.logo ? `http://localhost:5000/uploads/${brand.logo}` : ''
            // };
    
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
                    message: "Brand not found"
                });
            }
    
            // Define fields that can be updated from request body
            const allowedUpdates = ['name', 'status']; // Add other fields if needed
    
            // Update allowed fields
            allowedUpdates.forEach(key => {
                if (req.body[key] !== undefined) {
                    brand[key] = req.body[key];
                }
            });
    
            // Handle new logo upload if available
            if (req.file && req.file.filename !== 'no-logo-icon.png') {
                // Optional: delete old logo if it exists
                if (brand.logo && brand.logo !== 'no-logo-icon.png') {
                    const oldLogoPath = path.join(__dirname, '..', 'public', 'uploads', brand.logo);
                    fs.unlink(oldLogoPath, (err) => {
                        if (err) console.error('Error deleting old logo:', err);
                    });
                }
    
                // Update brand's logo field with new filename
                brand.logo = req.file.filename;
            }
    
            // Save updated brand data
            await brand.save();
    
            // Prepare the response with full image URL (or null if no logo)
            const updatedBrand = {
                ...brand._doc,
                logo: brand.logo ? brand.logo : null,
            };
    
            res.status(200).json({
                success: true,
                message: "Brand updated successfully",
                updatedBrand
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to update brand",
                error: error.message
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
