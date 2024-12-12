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
const POS = require('../controllers/POSController')
const transaction = require("../controllers/transactionController");
const dashboard = require("../controllers/dashboardController");
const th = require("../controllers/transactionHistoryController");
const { generatePDFReceipt } = require('../controllers/ReceiptController');
const user = require('../controllers/userController');

router.route("/api/get_all_users").get(user.getAllUsers)
router.route("/api/add_user").post( upload.single('image'), user.addUser);

router.route("/api/open_transaction").post(th.openTransaction);
router.route("/api/close_transaction").post(th.closeTransaction);
router.route("/api/transaction_history").get(th.transactionHistory);
router.route("/api/transaction_state").get(th.transactionState);

router.route("/api/get_sales").get(dashboard.salesData);
router.route("/api/get_statistics").get(dashboard.dashboardStatistics);
router.route("/api/get_fast_moving").get(dashboard.getFastMoving);


router.route("/api/get_all_transactions").get(transaction.getAllTransactions)
router.route("/api/get_transaction_details/:id").get(transaction.getTransactionDetails)
router.route("/api/delete_transaction/:id").patch(transaction.deleteTransaction)
router.route("/api/get_returned_transactions").get(transaction.getReturnTransactions)
router.route("/api/get_voided_transactions").get(transaction.getVoidedTransactions)
router.route("/api/download_receipt/:id").get(generatePDFReceipt)

router.route("/api/get_product_info/:id").get(POS.getProductInfo);
router.route("/api/commit_transaction").post(POS.createTransaction);
router.route("/api/get_transaction_items/:id").get(POS.getTransactionsItems);
router.route("/api/return_transaction/:id").post(POS.returnTransaction);
router.route("/api/void_transaction").post(POS.voidTransaction);

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
router.route("/api/get_report").get(product.generateReports);
router.route("/api/get_products_by_category/:id").get(product.getProductsByCategory);
router.route("/api/import_products").post(product.importProducts);
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
router.route("/api/add_units").post(unit.addUnit);             
router.route("/api/get_unit/:id").get(unit.getUnit);          
router.route("/api/edit_unit/:id").patch(unit.editUnit);      
router.route("/api/delete_unit/:id").patch(unit.softDeleteUnit);   

module.exports = router;