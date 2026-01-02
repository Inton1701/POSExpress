# Frontend JWT Integration Guide

## ✅ What's Been Updated

### 1. New Utility Files Created

**`src/utils/auth.js`** - Token management
- `auth.setToken(token)` - Store JWT token
- `auth.getToken()` - Get stored token
- `auth.setUser(user)` - Store user data
- `auth.getUser()` - Get user data
- `auth.isAuthenticated()` - Check if logged in
- `auth.login(token, user)` - Store both token and user
- `auth.logout()` - Clear all auth data

**`src/utils/api.js`** - Configured Axios instance
- Automatically adds JWT token to ALL requests
- Handles 401 errors (token expired) → auto-logout
- Base URL configured from environment

### 2. Updated Files

**`src/views/Login.vue`**
- ✅ Now saves JWT token from login response
- ✅ Uses `auth.login()` to store token + user

**`src/components/Navbar.vue`**
- ✅ Uses `auth.getUser()` instead of localStorage
- ✅ Uses `auth.logout()` for logout

**`src/App.vue`**
- ✅ Uses `api` instance instead of raw axios

## 🔧 How to Update Other Components

### Replace Old Pattern:
```javascript
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Making requests
await axios.get(`${API_URL}/products`)
await axios.post(`${API_URL}/transactions`, data)

// Getting user
const user = JSON.parse(localStorage.getItem('user'))
```

### With New Pattern:
```javascript
import { api } from '@/utils/api'
import { auth } from '@/utils/auth'

// Making requests (token added automatically!)
await api.get('/products')
await api.post('/transactions', data)

// Getting user
const user = auth.getUser()
```

## 📝 Components That Need Updates

Search for files using:
```bash
# Find components using old axios pattern
grep -r "axios" frontend/src --include="*.vue" --include="*.js"

# Find components accessing localStorage directly
grep -r "localStorage.getItem('user')" frontend/src --include="*.vue"
```

### Priority Updates:
1. **All Admin views** (`src/views/Admin/**/*.vue`)
2. **All Cashier views** (`src/views/Cashier/**/*.vue`)
3. **All Customer views** (`src/views/Customer/**/*.vue`)
4. **All Accounting views** (`src/views/Accounting/**/*.vue`)

### Update Steps for Each Component:

1. **Replace imports:**
   ```javascript
   // Old
   import axios from 'axios'
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
   
   // New
   import { api } from '@/utils/api'
   ```

2. **Replace API calls:**
   ```javascript
   // Old
   const response = await axios.get(`${API_URL}/products`)
   
   // New
   const response = await api.get('/products')
   ```

3. **Replace user access:**
   ```javascript
   // Old
   const user = JSON.parse(localStorage.getItem('user'))
   
   // New
   import { auth } from '@/utils/auth'
   const user = auth.getUser()
   ```

## 🔐 Security Benefits

- ✅ JWT tokens automatically included in requests
- ✅ Automatic logout on token expiration
- ✅ Single source of truth for authentication
- ✅ No more manual `x-user-id` headers
- ✅ Secure token storage

## 🚀 Testing

1. Start backend: `cd backend && npm install && npm start`
2. Login with credentials
3. Check browser DevTools → Application → Local Storage
   - Should see `auth_token` and `user`
4. Check Network tab → Request Headers
   - Should see `Authorization: Bearer <token>`

## 🐛 Common Issues

**401 Unauthorized errors:**
- Token might be expired (7 days)
- Clear localStorage and login again

**No token in requests:**
- Make sure you're using `api` instance from `@/utils/api`
- Not raw `axios`

**User data not persisting:**
- Use `auth.getUser()` instead of localStorage directly
