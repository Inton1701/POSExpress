const express = require("express");
const router = express.Router();

// Import controllers
const CategoriesController = require("../controllers/CategoriesController");
const CustomerController = require("../controllers/CustomerController");
const DiscountController = require("../controllers/DiscountController");
const ProductController = require("../controllers/ProductController");
const StockController = require("../controllers/StockController");
const TransactionController = require("../controllers/TransactionController");
const UserController = require("../controllers/UserController");
const StoreController = require("../controllers/StoreController");
const VariantController = require("../controllers/VariantController");
const AddonController = require("../controllers/AddonController");
const SettingsController = require("../controllers/SettingsController");
const CustomerTransaction = require("../models/CustomerTransactions");

// Health check route
router.get("/health", (req, res) => {
  res.json({ success: true, status: "Server is running", timestamp: new Date() });
});

// Category routes
router.get("/categories", CategoriesController.getAllCategories);
router.post("/categories", CategoriesController.createCategory);
router.get("/categories/:id", CategoriesController.getCategory);
router.put("/categories/:id", CategoriesController.updateCategory);
router.delete("/categories/:id", CategoriesController.deleteCategory);

// Product routes
router.get("/products", ProductController.getAllProducts);
router.post("/products", ProductController.createProduct);
router.get("/products/:id", ProductController.getProduct);
router.put("/products/:id", ProductController.updateProduct);
router.delete("/products/:id", ProductController.deleteProduct);
router.get("/products/store/:storeId", ProductController.getProductsByStore);
router.get("/products/category/:category", ProductController.getProductsByCategory);
router.get("/products/stock/low", ProductController.getLowStock);
router.get("/products/stock/out", ProductController.getOutOfStock);

// Customer routes
router.get("/customers", CustomerController.getAllCustomers);
router.post("/customers", CustomerController.createCustomer);
router.post("/customers/login", CustomerController.loginCustomer);
router.get("/customers/:id", CustomerController.getCustomer);
router.get("/customers/rfid/:rfid", CustomerController.getCustomerByRFID);
router.put("/customers/:id", CustomerController.updateCustomer);
router.put("/customers/:id/balance", CustomerController.updateBalance);
router.delete("/customers/:id", CustomerController.deleteCustomer);

// Discount routes
router.get("/discounts", DiscountController.getAllDiscounts);
router.post("/discounts", DiscountController.createDiscount);
router.get("/discounts/:id", DiscountController.getDiscount);
router.put("/discounts/:id", DiscountController.updateDiscount);
router.delete("/discounts/:id", DiscountController.deleteDiscount);

// Stock routes
router.get("/stock", StockController.getAllStock);
router.get("/stock/history", StockController.getAllStockHistory);
router.get("/stock/history/:sku", StockController.getStockHistoryBySku);
router.put("/stock/update", StockController.updateStock);
router.post("/stock/restock", StockController.restock);
router.put("/stock/alert", StockController.setQuantityAlert);

// Transaction routes
router.get("/transactions", TransactionController.getAllTransactions);
router.post("/transactions", TransactionController.createTransaction);
router.post("/transactions/refund", TransactionController.refundTransaction);
router.get("/transactions/by-transaction-id/:transactionId", TransactionController.getTransactionByTransactionId);
router.get("/transactions/date-range", TransactionController.getTransactionsByDateRange);
router.get("/transactions/sales-report", TransactionController.getSalesReport);
router.get("/transactions/sales-history", TransactionController.getSalesHistory);
router.get("/transactions/session/:sessionId/details", TransactionController.getSessionDetails);
router.post("/transactions/session/start", TransactionController.startTransactionSession);
router.post("/transactions/session/end", TransactionController.endTransactionSession);
router.get("/transactions/session/status", TransactionController.getTransactionSessionStatus);
router.get("/transactions/:id", TransactionController.getTransaction);
router.put("/transactions/:id", TransactionController.updateTransaction);
router.delete("/transactions/:id", TransactionController.deleteTransaction);
router.put("/transactions/:id/void", TransactionController.voidTransaction);

// User routes
router.get("/users", UserController.getAllUsers);
router.post("/users", UserController.createUser);
router.post("/users/login", UserController.loginUser);
router.post("/users/verify-password", UserController.verifyPassword);
router.get("/users/:id", UserController.getUser);
router.put("/users/:id", UserController.updateUser);
router.delete("/users/:id", UserController.deleteUser);
router.put("/users/:id/print-preferences", UserController.updatePrintPreferences);
router.get("/users/:id/print-preferences", UserController.getPrintPreferences);

// Store routes
router.get("/stores", StoreController.getAllStores);
router.post("/stores", StoreController.createStore);
router.get("/stores/:id", StoreController.getStore);
router.put("/stores/:id", StoreController.updateStore);
router.delete("/stores/:id", StoreController.deleteStore);
router.post("/stores/:id/assign-coadmin", StoreController.assignCoAdmin);
router.post("/stores/:id/remove-coadmin", StoreController.removeCoAdmin);

// Variant routes
router.get("/variants", VariantController.getAllVariants);
router.get("/variants/product/:productId", VariantController.getProductVariants);
router.post("/variants", VariantController.createVariants);
router.put("/variants/:id", VariantController.updateVariant);
router.delete("/variants/:id", VariantController.deleteVariant);
router.get("/variants/sku/:sku", VariantController.getVariantBySku);

// Add-on routes
router.get("/addons", AddonController.getAllAddons);
router.post("/addons", AddonController.createAddon);
router.get("/addons/:id", AddonController.getAddon);
router.put("/addons/:id", AddonController.updateAddon);
router.delete("/addons/:id", AddonController.deleteAddon);

// Customer Transaction routes
router.post("/customer-transactions", CustomerController.logTransaction);
router.get("/customer-transactions/:rfid", CustomerController.getTransactionsByRFID);
router.get("/customer-transactions", CustomerController.getAllCustomerTransactions);
router.post("/customer-transactions/void", CustomerController.voidCustomerTransaction);

// Settings routes
router.get("/settings/vat-config", SettingsController.getVATConfig);
router.post("/settings/vat-config", SettingsController.updateVATConfig);
router.get("/settings", SettingsController.getAllSettings);

module.exports = router;
