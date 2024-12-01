const express = require("express");
const router = express.Router();

//Controllers
const category  = require("../controllers/categoryController");
const subCategory = require("../controllers/subCategoryController");
const variant = require("../controllers/variantController");
const dashboard = require("../controllers/dashboardController");
const product = require("../controllers/productController");
const discount = require("../controllers/discountController");
const brand = require("../controllers/brandController"); 
const unit = require("../controllers/unitController"); 



//Routes
// category routes
router.route("/api/get_category_list").get(category.getAllCategories);
router.route("/api/api/get_category_list").post(category.addCategory);
router.route("/api/get_category/:id").get(category.getCategory);
router.route("/api/edit_category/:id").put(category.editCategory);
router.route("/api/delete_category/:id").delete(category.deleteCategory);

router.route("/api/subcategories").get(subCategory.getAllSubCategories);    
router.route("/api/subcategories").post(subCategory.addSubCategory);       
router.route("/api/subcategories/:id").get(subCategory.getSubCategory);    
router.route("/api/subcategories/:id").put(subCategory.editSubCategory);   
router.route("/api/subcategories/:id").delete(subCategory.deleteSubCategory);


//thiena maganda at cael
//variant routes
router.route("/api/variants").get(variant.getAllVariants); 
router.route("/api/variants").post(variant.addVariant); 
router.route("/api/variants/:id").get(variant.getVariant); 
router.route("/api/variants/:id").put(variant.editVariant); 
router.route("/api/variants/:id").delete(variant.deleteVariant);


// Dashboard routes
router.route("/api/dashboard/monitor_stock").post((req, res) => dashboard.monitorStock(req.io)); 
router.route("/api/dashboard/summary").get(dashboard.getDashboardSummary);
router.route("/api/dashboard/sales_report/:period").get(dashboard.getSalesReport);


// Product routes
//thien/cael
router.route("/api/products").get(product.getAllProducts);
router.route("/api/products").post(product.addProduct); 
router.route("/api/products/:id").get(product.getProduct); 
router.route("/api/products/:id").put(product.editProduct); 
router.route("/api/products/:id").delete(product.deleteProduct);

// Discount routes
router.route("/api/discounts").get(discount.getAllDiscounts); 
router.route("/api/discounts").post(discount.addDiscount); 
router.route("/api/discounts/:id").get(discount.getDiscount); 
router.route("/api/discounts/:id").put(discount.editDiscount); 
router.route("/api/discounts/:id").delete(discount.deleteDiscount); 

// Brand routes
router.route("/api/brands").get(brand.getAllBrands);       
router.route("/api/brands").post(brand.addBrand);          
router.route("/api/brands/:id").get(brand.getBrand);       
router.route("/api/brands/:id").put(brand.editBrand);      
router.route("/api/brands/:id").delete(brand.deleteBrand); 

// Unit routes
router.route("/api/units").get(unit.getAllUnits);          
router.route("/api/units").post(unit.addUnit);             
router.route("/api/units/:id").get(unit.getUnit);          
router.route("/api/units/:id").put(unit.editUnit);      
router.route("/api/units/:id").delete(unit.deleteUnit);  

// SubCategory routes
//kay cael dapat


module.exports = router;