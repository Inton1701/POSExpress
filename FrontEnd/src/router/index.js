import {createRouter, createWebHistory} from 'vue-router';

import Dashboard from '/src/components/Admin/Main/Dashboard.vue';
import SalesDashboard from '/src/components/Admin/Main/SalesDashboard.vue';
import ProductList from '/src/components/Admin/Inventory/ProductList.vue';
import ProductDetails from '@/components/Admin/Inventory/ProductDetails.vue';
import CreateProduct from '/src/components/Admin/Inventory/CreateProduct.vue';
import EditProduct from '/src/components/Admin/Inventory/EditProduct.vue';
import Category from '/src/components/Admin/Inventory/Category.vue';
import LowStocks from '/src/components/Admin/Inventory/LowStocks.vue';
import Subcategories from '/src/components/Admin/Inventory/Subcategories.vue';
import Brands from '/src/components/Admin/Inventory/Brands.vue'
import Units from '/src/components/Admin/Inventory/Units.vue'
import Variants from '/src/components/Admin/Inventory/Variants.vue';
import Barcode from '/src/components/Admin/Inventory/Barcode.vue';
import Stocks from '/src/components/Admin/Inventory/Stocks.vue';
import Transactions from '/src/components/Admin/Sales/Transactions.vue';
import Returns from '/src/components/Admin/Sales/Returns.vue'
import VoidSales from '/src/components/Admin/Sales/VoidSales.vue';
import POS from '/src/components/Apps/POS.vue'
import CustomerList from '@/components/Admin/Users/CustomerList.vue';
import Staffs from '@/components/Admin/Users/Staffs.vue';

const routes = [
    {
        name: 'Dashboard',
        path: '/',
        component : Dashboard
    },
    {
        name: 'SalesDashboard',
        path: '/sales-dashboard',
        component : SalesDashboard
    },
    {
        name: 'CreateProduct',
        path: '/create-product',
        component : CreateProduct
    },
    {
        name: 'EditProduct',
        path: '/edit-product',
        component : EditProduct
    },
    {
        name: 'ProductList',
        path: '/products',
        component : ProductList
    },
    ,
    {
        name: 'ProductDetails',
        path: '/product-details/:id',
        component : ProductDetails,
        props: true 
    },
    {
        name: 'Category',
        path: '/category',
        component : Category
    },
    {
        name: 'LowStocks',
        path: '/low-stocks',
        component : LowStocks
    },
    {
        name: 'Subcategories',
        path: '/sub-categories',
        component : Subcategories
    },
    {
        name: 'Brands',
        path: '/brands',
        component : Brands
    },
    {
        name: 'Units',
        path: '/units',
        component : Units
    },
    {
        name: 'Variant',
        path: '/variant',
        component : Variants
    },
    {
        name: 'Barcode',
        path: '/barcode',
        component : Barcode
    },
    {
        name: 'Stocks',
        path: '/manage-stocks',
        component : Stocks
    },
    {
        name: 'Transactions',
        path: '/transactions',
        component : Transactions
    },
    {
        name: 'Returns',
        path: '/returns',
        component : Returns
    }
    ,
    {
        name: 'VoidSales',
        path: '/voids',
        component : VoidSales
    },{
        name: 'POS',
        path: '/pos',
        component : POS
    } 
    ,{
        name: 'CustomerList',
        path: '/customers',
        component : CustomerList
    }  
    ,{
        name: 'Staffs',
        path: '/staffs',
        component : Staffs
    } 


];
const router =createRouter({
    history:createWebHistory(),
    routes
});
export default router;
