<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt"); // For password hashing

const userController = {
    // Register a new user
    registerUser: asyncHandler(async (req, res) => {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "Username already exists" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user
        const newUser = await User.create({
            username,
            password: hashedPassword,
            role,
        });

        res.status(201).json({ message: "User registered successfully", newUser });
    }),

    // User login
    loginUser: asyncHandler(async (req, res) => {
        const { username, password } = req.body;
=======
const Users = require("../models/Users");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Import JWT for "Remember Me" functionality
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
const Users = require("../models/Users");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes

const userController = {
    // User registration
    registerUser: asyncHandler(async (req, res) => {
        const { firstName, lastName, email, birthDate, role, username, password } = req.body;

        // Check if all required fields are provided
=======

const userController = {
    
    registerUser: asyncHandler(async (req, res) => {
        const { firstName, lastName, email, birthDate, role, username, password } = req.body;

        
>>>>>>> Stashed changes
=======

const userController = {
   
    registerUser: asyncHandler(async (req, res) => {
        const { firstName, lastName, email, birthDate, role, username, password } = req.body;

       
>>>>>>> Stashed changes
        if (!firstName || !lastName || !email || !birthDate || !role || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Check if the email already exists
=======
        
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
        const userExists = await Users.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Check if the username already exists
=======
        
>>>>>>> Stashed changes
=======
      
>>>>>>> Stashed changes
        const usernameExists = await Users.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: "Username already exists" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with the provided details
=======
        
        const hashedPassword = await bcrypt.hash(password, 10);

        
>>>>>>> Stashed changes
=======
       
        const hashedPassword = await bcrypt.hash(password, 10);

        
>>>>>>> Stashed changes
        const createdUser = await Users.create({
            firstName,
            lastName,
            email,
            birthDate,
            role,
            username,
            password: hashedPassword
        });

        res.status(201).json({
            status: "success",
            data: createdUser,
            message: "User registered successfully"
        });
    }),

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // User login 
    loginUser: asyncHandler(async (req, res) => {
        const { username, password, rememberMe } = req.body;
>>>>>>> Stashed changes

=======
=======
>>>>>>> Stashed changes
    // User login
    loginUser: asyncHandler(async (req, res) => {
        const { username, password } = req.body;

<<<<<<< Updated upstream
      
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
=======
   
    loginUser: asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        
>>>>>>> Stashed changes
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Compare the provided password with the hashed password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }),

    // Get user by ID
    getUserById: asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    }),

    // Update user by ID
    updateUserById: asyncHandler(async (req, res) => {
        const { username, password, role } = req.body;

        // Find user by ID
        const user = await User.findById(req.params.id);
=======
=======
        
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
=======
      
>>>>>>> Stashed changes
        const user = await Users.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
        
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Generate a JWT token for "Remember Me" functionality
        let token;
        if (rememberMe) {
            token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' }); // Token expires in 30 days
        } else {
            token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
        }

        // Redirect based on user role (Admin or Cashier)
        const dashboard = user.role === "admin" ? "adminDashboard" : "cashierDashboard";

        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: { user, token, dashboard }
        });
    }),

    // Forgot password (reset password)
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        
        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: user,
            redirectTo: "/dashboard"  
        });
    }),

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Forgot password (request reset token)
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;

>>>>>>> Stashed changes
=======
  
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;

>>>>>>> Stashed changes
=======
    
    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.body;

>>>>>>> Stashed changes
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
        // Find the user by email
>>>>>>> Stashed changes
=======
       
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Here you would implement logic to send a reset password email
        // (e.g., generating a reset token and sending it via email)
        res.status(200).json({ message: "Password reset instructions have been sent to your email" });
=======
        // Generate a password reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Set token expiration date (e.g., 1 hour)
        const tokenExpiration = Date.now() + 3600000;

        // Store the reset token and expiration in the database
=======
        
        const resetToken = crypto.randomBytes(32).toString("hex");

        
        const tokenExpiration = Date.now() + 3600000;

       
>>>>>>> Stashed changes
=======
       
        const resetToken = crypto.randomBytes(32).toString("hex");

       
        const tokenExpiration = Date.now() + 3600000;

        
>>>>>>> Stashed changes
        user.resetToken = resetToken;
        user.resetTokenExpiration = tokenExpiration;
        await user.save();

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Create a password reset link
        const resetLink = `http://yourapp.com/reset-password?token=${resetToken}`;

        // Send email with reset link (using nodemailer)
=======
        
        const resetLink = `http://yourapp.com/reset-password?token=${resetToken}`;

>>>>>>> Stashed changes
=======
        
        const resetLink = `http://yourapp.com/reset-password?token=${resetToken}`;

        
>>>>>>> Stashed changes
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: "your-email@gmail.com",
                pass: "your-email-password"
            }
        });

        const mailOptions = {
            from: "your-email@gmail.com",
            to: email,
            subject: "Password Reset Request",
            text: `Click the following link to reset your password: ${resetLink}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Password reset link has been sent to your email" });
    }),

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Reset password
=======
   
>>>>>>> Stashed changes
=======
    
>>>>>>> Stashed changes
    resetPassword: asyncHandler(async (req, res) => {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Find the user by reset token
=======
        
>>>>>>> Stashed changes
=======
        
>>>>>>> Stashed changes
        const user = await Users.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Hash the new password before saving it
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear the reset token
=======
=======
>>>>>>> Stashed changes
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        await user.save();

        res.status(200).json({ message: "Password has been successfully reset" });
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
    }),

    // Get user by ID
=======
    }),

    
>>>>>>> Stashed changes
=======
    }),

    
>>>>>>> Stashed changes
    getUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ status: "success", data: user });
    }),

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Edit user 
    editUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
=======
    // Edit user
    editUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
=======
    
    editUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
=======
    
    editUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        // Hash the new password if provided
        const updatedData = {
            username: username || user.username,
            role: role || user.role,
            updatedAt: Date.now(),
        };
        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.status(200).json({ message: "User updated successfully", updatedUser });
    }),

    // Delete user by ID
    deleteUserById: asyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id);

=======
        // Update the user information 
        const updatedUser = await Users.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, // Return the updated user
            runValidators: true // Run validation on update
        });
        
=======
        // Update the user information
=======
       
>>>>>>> Stashed changes
=======
       
>>>>>>> Stashed changes
        const updatedUser = await Users.findByIdAndUpdate(req.params.id, req.body, {
            new: true, 
            runValidators: true 
        });

<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        res.status(200).json({
            status: "success",
            data: updatedUser,
            message: "User updated successfully"
        });
    }),

<<<<<<< Updated upstream
<<<<<<< Updated upstream
    // Delete user
    deleteUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
    
    deleteUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
=======
   
    deleteUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: `User ${req.params.id} has been successfully deleted` });
=======
        await Users.deleteOne({ _id: req.params.id });
        res.status(200).json({ status: "success", message: "User deleted successfully" });
>>>>>>> Stashed changes
=======
        await Users.deleteOne({ _id: req.params.id });
        res.status(200).json({ status: "success", message: "User deleted successfully" });
>>>>>>> Stashed changes
=======
        await Users.deleteOne({ _id: req.params.id });
        res.status(200).json({ status: "success", message: "User deleted successfully" });
>>>>>>> Stashed changes
=======
        await Users.deleteOne({ _id: req.params.id });
        res.status(200).json({ status: "success", message: "User deleted successfully" });
>>>>>>> Stashed changes
    })
};

module.exports = userController;
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
