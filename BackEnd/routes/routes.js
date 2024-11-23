const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Specify upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid name conflicts
    },
});

const upload = multer({ storage });
//Controllers
const category  = require("../controllers/categoryController");
const variant = require("../controllers/variantController");
// const dashboard = require("../controllers/dashboardController");
const product = require("../controllers/productController");
const discount = require("../controllers/discountController");
const brand = require("../controllers/brandController"); 
const unit = require("../controllers/unitController"); 
const gdrive = require('../controllers/gdriveController');
const stockHistory = require("../controllers/stockHistoryController");

router.route("/api/stock_history_list").get(stockHistory.getAllHistory);
router.route("/api/add_stock_history").post(stockHistory.addHistory);
router.route("/api/get_history/:id").get(stockHistory.getHistory);

router.route("/api/export").post(gdrive.exportData);
//Routes
// category routes
router.route("/api/get_category_list").get(category.getAllCategories);
router.route("/api/add_category").post(category.addCategory);
router.route("/api/get_category/:id").get(category.getCategory);
router.route("/api/edit_category/:id").patch(category.editCategory);
router.route("/api/delete_category/:id").delete(category.deleteCategory);


//thiena maganda
//variant routes
router.route("/api/variants").get(variant.getAllVariants); 
router.route("/api/variants").post(variant.addVariant); 
router.route("/api/variants/:id").get(variant.getVariant); 
router.route("/api/variants/:id").put(variant.editVariant); 
router.route("/api/variants/:id").delete(variant.deleteVariant);


// Dashboard routes
// router.route("/api/dashboard/monitor_stock").post((req, res) => dashboard.monitorStock(req.io)); 
// router.route("/api/dashboard/summary").get(dashboard.getDashboardSummary);
// router.route("/api/dashboard/sales_report/:period").get(dashboard.getSalesReport);


// Product routes
router.route("/api/products_list").get(product.getAllProducts);
router.route("/api/add_products").post(upload.single('image'),  product.addProduct); 
router.route("/api/get_product/:id").get(product.getProduct); 
router.route("/api/edit_products/:id").patch(upload.single('image'),product.editProduct); 
router.route("/api/delete_product/:id").delete(product.deleteProduct);
router.route("/api/check_sku/:id").get(product.checkSKU);
router.route("/api/low_stocks").get(product.getLowStock);
router.route("/api/no_stock").get(product.getOutOfStock);
router.route("/api/edit_stock/:id").patch(product.editStock);
// Discount routes
router.route("/api/discounts").get(discount.getAllDiscounts); 
router.route("/api/discounts").post(discount.addDiscount); 
router.route("/api/discounts/:id").get(discount.getDiscount); 
router.route("/api/discounts/:id").put(discount.editDiscount); 
router.route("/api/discounts/:id").delete(discount.deleteDiscount); 

// Brand routes
router.route("/api/brands_list").get(brand.getAllBrands);       
router.route("/api/add_brand").post(upload.single('logo'),brand.addBrand);          
router.route("/api/get_brand/:id").get(brand.getBrand);       
router.route("/api/edit_brand/:id").patch(upload.single('logo'),brand.editBrand);      
router.route("/api/delete_brands/:id").delete(brand.deleteBrand); 

// Unit routes
router.route("/api/get_units_list").get(unit.getAllUnits);          
router.route("/api/get_units").post(unit.addUnit);             
router.route("/api/units/:id").get(unit.getUnit);          
router.route("/api/units/:id").patch(unit.editUnit);      
router.route("/api/units/:id").delete(unit.deleteUnit);  

module.exports = router;