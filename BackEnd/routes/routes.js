const express = require("express");
const router = express.Router();

// Controllers
const category  = require("../controllers/categoryController");
const userController = require("../controllers/userController");

// Middleware for authentication
const protect = require("../Middleware/authMiddleware"); // Protect routes with JWT verification

// Category Routes
router.route("/api/get_category_list").get(category.getAllCategories);
router.route("/api/add_category").post(category.addCategory);
router.route("/api/get_category/:id").get(category.getCategory);
router.route("/api/edit_category/:id").put(protect, category.editCategory); // Protected
router.route("/api/delete_category/:id").delete(protect, category.deleteCategory); // Protected

// User Routes

router.route("/api/register_user").get(userController.registerUser);  // POST for registration
router.route("/api/login_user").get(userController.loginUser);       // POST for login
router.route("/api/user/:id").get(protect, userController.getUser);            // GET user by ID (Protected)
router.route("/api/user/:id").put(protect, userController.editUser);           // PUT to edit user (Protected)
router.route("/api/user/:id").delete(protect, userController.deleteUser);      // DELETE user (Protected)

// User routes
router.post("/api/register", userController.registerUser);           
router.post("/api/login", userController.loginUser);                  
router.get("/api/user/:id", userController.getUserById);              
router.put("/api/user/:id", userController.updateUserById);           
router.delete("/api/user/:id", userController.deleteUserById);        

module.exports = router;
