const express = require("express");
const router = express.Router();

//Controllers
const category  = require("../controllers/categoryController");

//Routes

// category routes
router.route("/api/get_category_list").get(category.getAllCategories);
router.route("/api/add_category").post(category.addCategory);
router.route("/api/get_category/:id").get(category.getCategory);
router.route("/api/edit_category/:id").put(category.editCategory);
router.route("/api/delete_category/:id").delete(category.deleteCategory);

// User routes
router.post("/api/register", userController.registerUser);           
router.post("/api/login", userController.loginUser);                  
router.get("/api/user/:id", userController.getUserById);              
router.put("/api/user/:id", userController.updateUserById);           
router.delete("/api/user/:id", userController.deleteUserById);        

module.exports = router;
