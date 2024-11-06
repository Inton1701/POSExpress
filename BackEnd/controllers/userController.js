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

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

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
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

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

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await User.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: `User ${req.params.id} has been successfully deleted` });
    })
};

module.exports = userController;
