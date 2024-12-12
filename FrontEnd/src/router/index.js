import {createRouter, createWebHistory} from 'vue-router';

import Dashboard from '/src/components/Admin/Main/Dashboard.vue';

import ProductList from '/src/components/Admin/Inventory/ProductList.vue';
import ProductDetails from '@/components/Admin/Inventory/ProductDetails.vue';
import CreateProduct from '/src/components/Admin/Inventory/CreateProduct.vue';
import EditProduct from '/src/components/Admin/Inventory/EditProduct.vue';
import Category from '/src/components/Admin/Inventory/Category.vue';
import ManageStocks from '/src/components/Admin/Inventory/ManageStocks.vue';
import Subcategories from '/src/components/Admin/Inventory/Subcategories.vue';
import Brands from '/src/components/Admin/Inventory/Brands.vue'
import Units from '/src/components/Admin/Inventory/Units.vue'
import Variants from '/src/components/Admin/Inventory/Variants.vue';
import Barcode from '/src/components/Admin/Inventory/Barcode.vue';
import Transactions from '/src/components/Admin/Sales/Transactions.vue';
import Returns from '/src/components/Admin/Sales/Returns.vue'
import VoidSales from '/src/components/Admin/Sales/VoidSales.vue';
import POS from '/src/components/Apps/POS.vue'
import CustomerList from '@/components/Admin/Users/CustomerList.vue';
import Staffs from '@/components/Admin/Users/Staffs.vue';
import Login from '@/components/LandingPage/Login.vue';
import LockScreen from '@/components/LandingPage/LockScreen.vue';
import Settings from '@/components/Admin/Inventory/Settings.vue';

function authGuard(to, from, next) {
    const token = localStorage.getItem("token");
    
    if (!token) {
      // No token means user is not logged in, redirect to login page
      return next("/");
    }
  
    try {
      // Decode the token (JWT format)
      const payload = JSON.parse(atob(token.split(".")[1]));
      
      // Check for token expiration (optional)
      const now = Date.now() / 1000; 
      if (payload.exp < now) {
  
        return next("/");
      }
  
      // Check if the route requires a role and if the user's role matches
      if (to.meta.roles && !to.meta.roles.includes(payload.role)) {
        // User's role is not allowed to access this route
        return next("/");
      }
  
      // Proceed to the requested route if everything is fine
      next();
  
    } catch (error) {
      // If decoding or any other error occurs, handle it (invalid token format, etc.)
      return next("/");
    }
  }

const routes = [
    {
        name: 'Settings',
        path: '/settings',
        component: Settings
    },
    {
        name: 'Login',
        path: '/',
        component: Login
    },
    {
        name: 'LockScreen',
        path: '/lockscreen',
        component: LockScreen,
        meta: { roles: ["Admin","Cashier"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Dashboard',
        path: '/dashboard',
        component : Dashboard,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'CreateProduct',
        path: '/create-product',
        component : CreateProduct,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'EditProduct',
        path: '/product/edit/:id',
        component : EditProduct,
        props: true,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'ProductList',
        path: '/products',
        component : ProductList,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    ,
    {
        name: 'ProductDetails',
        path: '/products/view/:id',
        component : ProductDetails,
        props: true,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Category',
        path: '/category',
        component : Category,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'ManageStocks',
        path: '/manage-stocks',
        component : ManageStocks,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Subcategories',
        path: '/sub-categories',
        component : Subcategories,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Brands',
        path: '/brands',
        component : Brands,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Units',
        path: '/units',
        component : Units,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Variant',
        path: '/variant',
        component : Variants,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Barcode',
        path: '/barcode',
        component : Barcode,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },

    {
        name: 'Transactions',
        path: '/transactions',
        component : Transactions,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },
    {
        name: 'Returns',
        path: '/returns',
        component : Returns,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    }
    ,
    {
        name: 'VoidSales',
        path: '/voids',
        component : VoidSales,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    },{
        name: 'POS',
        path: '/pos',
        component : POS,
        meta: { roles: ["Admin","Cashier"] },  
        beforeEnter: authGuard
    } 
    ,{
        name: 'CustomerList',
        path: '/customers',
        component : CustomerList,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    }  
    ,{
        name: 'Staffs',
        path: '/staffs',
        component : Staffs,
        meta: { roles: ["Admin"] },  
        beforeEnter: authGuard
    } 


];
const router =createRouter({
    history:createWebHistory(),
    routes
});
export default router;
