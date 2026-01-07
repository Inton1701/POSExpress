const express = require("express");
const router = express.Router();

// Import middleware
const { extractUserInfo, isAdmin, isCoAdminOrAdmin, isCashier, canManageCustomers } = require("../middleware/AuthMiddleware");

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
const SystemController = require("../controllers/SystemController");
const CustomerTransaction = require("../models/CustomerTransactions");

// Health check route (public)
router.get("/health", (req, res) => {
  res.json({ success: true, status: "Server is running", timestamp: new Date() });
});

// ========== PUBLIC ROUTES (No Authentication Required) ==========
// User authentication
router.post("/users/login", UserController.loginUser);
router.post("/customers/login", CustomerController.loginCustomer);
router.post("/customers/verify-password", CustomerController.verifyCustomerPassword);

// ========== PROTECTED ROUTES (Authentication Required) ==========

// Category routes (Admin & Co-Admin)
router.get("/categories", extractUserInfo, CategoriesController.getAllCategories);
router.post("/categories", extractUserInfo, isCoAdminOrAdmin, CategoriesController.createCategory);
router.get("/categories/:id", extractUserInfo, CategoriesController.getCategory);
router.put("/categories/:id", extractUserInfo, isCoAdminOrAdmin, CategoriesController.updateCategory);
router.delete("/categories/:id", extractUserInfo, isAdmin, CategoriesController.deleteCategory);

// Product routes (Admin & Co-Admin can manage, all can view)
router.get("/products", extractUserInfo, ProductController.getAllProducts);
router.post("/products", extractUserInfo, isCoAdminOrAdmin, ProductController.createProduct);
router.get("/products/:id", extractUserInfo, ProductController.getProduct);
router.put("/products/:id", extractUserInfo, isCoAdminOrAdmin, ProductController.updateProduct);
router.delete("/products/:id", extractUserInfo, isCoAdminOrAdmin, ProductController.deleteProduct);
router.get("/products/store/:storeId", extractUserInfo, ProductController.getProductsByStore);
router.get("/products/category/:category", extractUserInfo, ProductController.getProductsByCategory);
router.get("/products/stock/low", extractUserInfo, ProductController.getLowStock);
router.get("/products/stock/out", extractUserInfo, ProductController.getOutOfStock);

// Customer routes (All authenticated users)
router.get("/customers", extractUserInfo, CustomerController.getAllCustomers);
router.post("/customers", extractUserInfo, CustomerController.createCustomer);
router.get("/customers/:id", extractUserInfo, CustomerController.getCustomer);
router.get("/customers/rfid/:rfid", extractUserInfo, CustomerController.getCustomerByRFID);
router.put("/customers/:id", extractUserInfo, CustomerController.updateCustomer);
router.put("/customers/:id/balance", extractUserInfo, CustomerController.updateBalance);
router.delete("/customers/:id", extractUserInfo, canManageCustomers, CustomerController.deleteCustomer);

// Discount routes (Admin & Co-Admin)
router.get("/discounts", extractUserInfo, DiscountController.getAllDiscounts);
router.post("/discounts", extractUserInfo, isCoAdminOrAdmin, DiscountController.createDiscount);
router.get("/discounts/:id", extractUserInfo, DiscountController.getDiscount);
router.put("/discounts/:id", extractUserInfo, isCoAdminOrAdmin, DiscountController.updateDiscount);
router.delete("/discounts/:id", extractUserInfo, isAdmin, DiscountController.deleteDiscount);

// Stock routes (Admin & Co-Admin manage, all view)
router.get("/stock", extractUserInfo, StockController.getAllStock);
router.get("/stock/history", extractUserInfo, StockController.getAllStockHistory);
router.get("/stock/history/:sku", extractUserInfo, StockController.getStockHistoryBySku);
router.put("/stock/update", extractUserInfo, isCoAdminOrAdmin, StockController.updateStock);
router.post("/stock/restock", extractUserInfo, isCoAdminOrAdmin, StockController.restock);
router.put("/stock/alert", extractUserInfo, isCoAdminOrAdmin, StockController.setQuantityAlert);

// Transaction routes (All authenticated users can create/view)
router.get("/transactions", extractUserInfo, TransactionController.getAllTransactions);
router.post("/transactions", extractUserInfo, TransactionController.createTransaction);
router.post("/transactions/refund", extractUserInfo, isCoAdminOrAdmin, TransactionController.refundTransaction);
router.get("/transactions/by-transaction-id/:transactionId", extractUserInfo, TransactionController.getTransactionByTransactionId);
router.get("/transactions/date-range", extractUserInfo, TransactionController.getTransactionsByDateRange);
router.get("/transactions/sales-report", extractUserInfo, TransactionController.getSalesReport);
router.get("/transactions/sales-history", extractUserInfo, TransactionController.getSalesHistory);
router.get("/transactions/session/:sessionId/details", extractUserInfo, TransactionController.getSessionDetails);
router.post("/transactions/session/start", extractUserInfo, TransactionController.startTransactionSession);
router.post("/transactions/session/end", extractUserInfo, TransactionController.endTransactionSession);
router.get("/transactions/session/status", extractUserInfo, TransactionController.getTransactionSessionStatus);
router.get("/transactions/:id", extractUserInfo, TransactionController.getTransaction);
router.put("/transactions/:id", extractUserInfo, isCoAdminOrAdmin, TransactionController.updateTransaction);
router.delete("/transactions/:id", extractUserInfo, isAdmin, TransactionController.deleteTransaction);
router.put("/transactions/:id/void", extractUserInfo, isCoAdminOrAdmin, TransactionController.voidTransaction);

// User routes (Admin creates, user updates own profile)
router.get("/users", extractUserInfo, isCoAdminOrAdmin, UserController.getAllUsers);
router.post("/users", extractUserInfo, isCoAdminOrAdmin, UserController.createUser);
router.post("/users/verify-password", extractUserInfo, UserController.verifyPassword);
router.post("/users/verify-rfid", extractUserInfo, UserController.verifyUserRFID);
router.post("/users/verify-admin", UserController.verifyAdminCredentials);
router.get("/users/:id", extractUserInfo, UserController.getUser);
router.put("/users/:id", extractUserInfo, UserController.updateUser);
router.delete("/users/:id", extractUserInfo, isAdmin, UserController.deleteUser);
router.put("/users/:id/print-preferences", extractUserInfo, UserController.updatePrintPreferences);
router.get("/users/:id/print-preferences", extractUserInfo, UserController.getPrintPreferences);

// Store routes (Admin only)
router.get("/stores", extractUserInfo, StoreController.getAllStores);
router.post("/stores", extractUserInfo, isAdmin, StoreController.createStore);
router.get("/stores/:id", extractUserInfo, StoreController.getStore);
router.put("/stores/:id", extractUserInfo, isAdmin, StoreController.updateStore);
router.delete("/stores/:id", extractUserInfo, isAdmin, StoreController.deleteStore);
router.post("/stores/:id/assign-coadmin", extractUserInfo, isAdmin, StoreController.assignCoAdmin);
router.post("/stores/:id/remove-coadmin", extractUserInfo, isAdmin, StoreController.removeCoAdmin);

// Variant routes (Admin & Co-Admin)
router.get("/variants", extractUserInfo, VariantController.getAllVariants);
router.get("/variants/product/:productId", extractUserInfo, VariantController.getProductVariants);
router.post("/variants", extractUserInfo, isCoAdminOrAdmin, VariantController.createVariants);
router.put("/variants/:id", extractUserInfo, isCoAdminOrAdmin, VariantController.updateVariant);
router.delete("/variants/:id", extractUserInfo, isCoAdminOrAdmin, VariantController.deleteVariant);
router.get("/variants/sku/:sku", extractUserInfo, VariantController.getVariantBySku);

// Add-on routes (Admin & Co-Admin)
router.get("/addons", extractUserInfo, AddonController.getAllAddons);
router.post("/addons", extractUserInfo, isCoAdminOrAdmin, AddonController.createAddon);
router.get("/addons/:id", extractUserInfo, AddonController.getAddon);
router.put("/addons/:id", extractUserInfo, isCoAdminOrAdmin, AddonController.updateAddon);
router.delete("/addons/:id", extractUserInfo, isAdmin, AddonController.deleteAddon);

// Customer Transaction routes (All authenticated users)
router.post("/customer-transactions", extractUserInfo, CustomerController.logTransaction);
router.get("/customer-transactions/:rfid", extractUserInfo, CustomerController.getTransactionsByRFID);
router.get("/customer-transactions", extractUserInfo, CustomerController.getAllCustomerTransactions);
router.post("/customer-transactions/void", extractUserInfo, canManageCustomers, CustomerController.voidCustomerTransaction);

// Settings routes (Admin & Co-Admin)
router.get("/settings/vat-config", extractUserInfo, SettingsController.getVATConfig);
router.post("/settings/vat-config", extractUserInfo, isCoAdminOrAdmin, SettingsController.updateVATConfig);
router.get("/settings", extractUserInfo, SettingsController.getAllSettings);

// System/Update routes (All authenticated users)
router.get("/system/version", SystemController.getCurrentVersion);
router.get("/system/check-updates", extractUserInfo, SystemController.checkForUpdates);
router.get("/system/update-prerequisites", extractUserInfo, SystemController.checkUpdatePrerequisites);
router.post("/system/update", extractUserInfo, SystemController.triggerUpdate);
router.get("/system/update-log", extractUserInfo, SystemController.getUpdateLog);
router.get("/system/backups", extractUserInfo, SystemController.listBackups);
router.post("/system/revert", extractUserInfo, SystemController.revertUpdate);
router.post("/system/reboot", extractUserInfo, isCoAdminOrAdmin, SystemController.rebootSystem);
router.post("/system/shutdown", extractUserInfo, isCoAdminOrAdmin, SystemController.shutdownSystem);

module.exports = router;
