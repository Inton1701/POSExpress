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

const userController = {
    // User registration
    registerUser: asyncHandler(async (req, res) => {
        const { firstName, lastName, email, birthDate, role, username, password } = req.body;

        // Check if all required fields are provided
        if (!firstName || !lastName || !email || !birthDate || !role || !username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if the email already exists
        const userExists = await Users.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Check if the username already exists
        const usernameExists = await Users.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user with the provided details
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

    // User login 
    loginUser: asyncHandler(async (req, res) => {
        const { username, password, rememberMe } = req.body;
>>>>>>> Stashed changes

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

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
        const user = await Users.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid password" });
        }

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
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Here you would implement logic to send a reset password email
        // (e.g., generating a reset token and sending it via email)
        res.status(200).json({ message: "Password reset instructions have been sent to your email" });
    }),

    // Get user by ID
    getUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ status: "success", data: user });
    }),

    // Edit user 
    editUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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
        
        res.status(200).json({
            status: "success",
            data: updatedUser,
            message: "User updated successfully"
        });
    }),

    // Delete user
    deleteUser: asyncHandler(async (req, res) => {
        const user = await Users.findById(req.params.id);
>>>>>>> Stashed changes
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

<<<<<<< Updated upstream
        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: `User ${req.params.id} has been successfully deleted` });
=======
        await Users.deleteOne({ _id: req.params.id });
        res.status(200).json({ status: "success", message: "User deleted successfully" });
>>>>>>> Stashed changes
    })
};

module.exports = userController;
