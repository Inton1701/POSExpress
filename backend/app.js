const express = require("express");
const app = express();
const dotenv = require("dotenv").config();
const cors = require('cors');
const errorHandler = require("./middleware/ErrorHandler");
const connectDB = require("./config/DbConfig");
const routes = require("./routes/routes");

// Connect to database
connectDB();

// Middleware
// app.use(cors({
//     origin: ['http://localhost:5173', 'http://192.168.1.29:5173']
// }));
app.use(cors());
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