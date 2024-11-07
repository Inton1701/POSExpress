const express = require("express");
const router = express.Router();

//Controllers
const category  = require("../controllers/categoryController");
const subCategory = require("../controllers/subCategoryController")

//Routes

// category routes
router.route("/api/get_category_list").get(category.getAllCategories);
router.route("/api/add_category").post(category.addCategory);
router.route("/api/get_category/:id").get(category.getCategory);
router.route("/api/edit_category/:id").put(category.editCategory);
router.route("/api/delete_category/:id").delete(category.deleteCategory);

// sub category routes
router.route("/api/get_subcategory_list").get(subCategory.getAllSubcategories);
router.route("/api/add_subcategory").post(subCategory.addSubcategory);
router.route("/api/get_subcategory/:id").get(subCategory.getSubcategory);
router.route("/api/edit_subcategory/:id").put(subCategory.editSubcategory);
router.route("/api/delete_subcategory/:id").delete(subCategory.deleteSubcategory);


module.exports = router;
