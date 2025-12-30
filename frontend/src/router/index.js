import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import AdminLayout from '../views/Admin/AdminLayout.vue'
import Dashboard from '../views/Admin/Dashboard.vue'
import Stores from '../views/Admin/Stores.vue'
import Products from '../views/Admin/Products.vue'
import ManageStocks from '../views/Admin/ManageStocks.vue'
import Categories from '../views/Admin/Categories.vue'
import Addons from '../views/Admin/Addons.vue'
import Transactions from '../views/Admin/Transactions.vue'
import Users from '../views/Admin/Users.vue'
import Customers from '../views/Admin/Customers.vue'
import Sales from '../views/Admin/Sales.vue'
import Settings from '../views/Admin/Settings.vue'
import CashierPOS from '../views/Cashier/CashierPOS.vue'
import CashierTransactions from '../views/Cashier/CashierTransactions.vue'
import CashierSales from '../views/Cashier/CashierSales.vue'
import CustomerDashboard from '../views/Customer/CustomerDashboard.vue'
import AccountingLayout from '../views/Accounting/AccountingLayout.vue'
import CustomerTransactionHistory from '../views/Accounting/CustomerTransactionHistory.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login
    },
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: Dashboard },
        { path: 'sales', name: 'sales', component: Sales },
        { path: 'stores', name: 'stores', component: Stores },
        { path: 'products', name: 'products', component: Products },
        { path: 'manage-stocks', name: 'manage-stocks', component: ManageStocks },
        { path: 'categories', name: 'categories', component: Categories },
        { path: 'addons', name: 'addons', component: Addons },
        { path: 'transactions', name: 'transactions', component: Transactions },
        { path: 'users', name: 'users', component: Users },
        { path: 'customers', name: 'customers', component: Customers },
        { path: 'settings', name: 'settings', component: Settings }
      ]
    },
    {
      path: '/pos',
      name: 'pos',
      component: CashierPOS
    },
    {
      path: '/pos/transactions',
      name: 'pos-transactions',
      component: CashierTransactions
    },
    {
      path: '/pos/customer-transactions',
      name: 'pos-customer-transactions',
      component: CustomerTransactionHistory
    },
    {
      path: '/pos/sales',
      name: 'pos-sales',
      component: CashierSales
    },
    {
      path: '/accounting',
      name: 'accounting',
      component: AccountingLayout
    },
    {
      path: '/accounting/transaction-history',
      name: 'customer-transaction-history',
      component: CustomerTransactionHistory
    },
    {
      path: '/customer',
      name: 'customer',
      component: CustomerDashboard
    }
  ],
})

// Navigation guard for authentication and role-based access
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAuthenticated = user && user.role

  // Public routes
  if (to.path === '/') {
    if (isAuthenticated) {
      // Redirect authenticated users to their dashboard
      if (user.role === 'Admin' || user.role === 'Co-Admin') {
        return next('/admin/dashboard')
      } else if (user.role === 'Cashier') {
        return next('/pos')
      } else if (user.role === 'Accounting') {
        return next('/accounting')
      } else if (user.role === 'Customer') {
        return next('/customer')
      }
    }
    return next()
  }

  // Protected routes
  if (!isAuthenticated) {
    return next('/')
  }

  // Role-based access control
  if (to.path.startsWith('/admin')) {
    if (user.role === 'Admin' || user.role === 'Co-Admin') {
      return next()
    }
    return next('/') // Unauthorized
  }

  if (to.path === '/pos' || to.path.startsWith('/pos/')) {
    if (user.role === 'Cashier' || user.role === 'Co-Admin' || user.role === 'Admin') {
      return next()
    }
    return next('/')
  }

  if (to.path === '/accounting' || to.path.startsWith('/accounting/')) {
    if (user.role === 'Accounting' || user.role === 'Admin') {
      return next()
    }
    return next('/')
  }

  if (to.path === '/customer') {
    if (user.role === 'Customer') {
      return next()
    }
    return next('/')
  }

  next()
})

export default router
