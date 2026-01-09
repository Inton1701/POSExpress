const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const cors = require('cors');
const errorHandler = require("./middleware/ErrorHandler");
const connectDB = require("./config/DbConfig");
const routes = require("./routes/routes");
const { startScheduler } = require("./utils/sessionScheduler");
const { startBackupScheduler } = require("./utils/backupScheduler");

// Connect to database
connectDB();

// Start session scheduler for automatic session management
startScheduler();

// Start backup scheduler for automatic backups
startBackupScheduler();

// CORS Configuration - Allow all origins for development and production
app.use(cors({
    origin: '*', // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint for Docker and monitoring
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development"
    });
});

// API Routes
app.use("/api", routes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({ 
        endpoints: {
            health: "/api/health",
            categories: "/api/categories",
            products: "/api/products",
            customers: "/api/customers",
            discounts: "/api/discounts",
            stock: "/api/stock",
            transactions: "/api/transactions",
            users: "/api/users"
        }
    });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const port = process.env.PORT || 5000;
const host = "0.0.0.0"; // Explicitly set localhost IP
app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
});