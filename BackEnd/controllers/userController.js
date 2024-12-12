const User = require("../models/Users");
const History = require("../models/StocksHistory");
const asyncHandler = require("express-async-handler");
const jwt = require('jsonwebtoken');
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
    getUser: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.status(200).json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
        }
    }),

    // Update a product
    editUser: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }
    
            // Update other fields
            const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'birthdate', 'role', 'userStatus'];
            allowedUpdates.forEach((key) => {
                if (req.body[key] !== undefined) {
                    user[key] = req.body[key];
                }
            });
    
            // Update password only if it's provided and not empty
            if (req.body.password && req.body.password.trim() !== "") {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(req.body.password, salt);
                user.password = hashedPassword;
            }
    
            // Handle image removal
            if (req.body.imageRemoved === 'true') {
                if (user.image && user.image !== 'no-image-icon.png') {
                    const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', user.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlink(oldImagePath, (err) => {
                            if (err) console.error("Error deleting old image:", err);
                        });
                    }
                }
                user.image = null; // Set to default image
            }
    
            // Handle new image upload
            if (req.file && req.file.filename) {
                if (user.image && user.image !== 'no-image-icon.png') {
                    const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', user.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlink(oldImagePath, (err) => {
                            if (err) console.error("Error deleting old image:", err);
                        });
                    }
                }
                user.image = req.file.filename; // Update image with uploaded file
            }
    
            await user.save();
    
            res.status(200).json({
                success: true,
                message: "User updated successfully",
                updatedUser: {
                    ...user._doc,
                    image: user.image || null,
                },
            });
        } catch (error) {
            console.error("Error in editUser:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    }),

     // Delete user by ID
     deleteUser: asyncHandler(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: "user not found" 
                });
            }
            await User.deleteOne({ _id: req.params.id });
            res.status(200).json({ 
                success: true, 
                message: `user with ID ${req.params.id} has been successfully deleted` 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: "Failed to delete user", 
                error: error.message 
            });
        }
    }),
    login:asyncHandler(async (req, res) => {
        try {
          const { email, password } = req.body;
      
          // Find user by email
          const user = await User.findOne({ email: email });
          if (!user) {
            return res.status(404).json({
              success: false,
              message: "Email not found",
            });
          }
          if(user.userStatus === 'Disabled') {
            return res.status(404).json({
            success: false,
            message: "Your account is disabled",
           })
          }
      
          user.status = 'Online';
          user.login = new Date();
          await user.save();
          // Compare provided password with stored hashed password
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return res.status(401).json({
              success: false,
              message: "Invalid credentials",
            });
          }
      
          // Generate JWT token
          const token = jwt.sign(
            {
              id: user._id,
              role: user.role,
              user: `${user.firstName} ${user.lastName}`,
              email : user.email,
              image: user.image,
            },
            process.env.JWT_SECRET, 
            { expiresIn: "12h" } 
          );
      
          // Respond with token and user role
          res.status(200).json({
            success: true,
            message: "Login successful",
            token: token,
            role: user.role, 
            user: `${user.firstName} ${user.lastName}`,
            id: user._id,
            emails : user.email,
            image: user.image,
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: "An error occurred during login",
            error: error.message,
          });
        }
      }),
      logout: asyncHandler(async (req, res) => {
        try {
          const { id } = req.params; // Correctly destructuring `id` from `req.params`
      
          // Find the user by ID
          const user = await User.findOne({ _id: id });
          if (!user) {
            return res.status(404).json({
              success: false,
              message: "User not found",
            });
          }
      
          // Update user status and logout time
          user.status = 'Offline'; // Corrected to lowercase for consistency
          user.logout = new Date();
          await user.save();
      
          res.status(200).json({
            success: true,
            message: "Logout successful",
          });
        } catch (error) {
          res.status(500).json({
            success: false,
            message: "An error occurred during logout",
            error: error.message,
          });
        }
      })
      

};

module.exports = product;
