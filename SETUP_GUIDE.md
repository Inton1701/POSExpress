# RFID POS System - Setup Guide

## Initial Setup

### 1. Database Setup

Make sure MongoDB is running on your system.

### 2. Create Default Admin Account

Before logging in for the first time, you need to create a default admin account:

```bash
cd backend
npm run seed:admin
```

This will create:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Admin
- **Default Store**: Main Store

**⚠️ IMPORTANT**: Change the default password immediately after first login!

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:5000`

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## First Login

1. Open your browser and go to the frontend URL
2. Login with the default credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
   - **OR** use RFID if configured for the user
3. You will be redirected to the Admin Dashboard

## Login Options

The system supports two login methods:

1. **Username + Password**: Enter username and password
2. **RFID**: Scan or enter RFID tag

Users can use either method. The login form automatically switches between them - when you start typing in one method, the other is disabled.

## Next Steps After Login

### As Admin, you can:

1. **Create Stores**
   - Go to "Stores" page
   - Click "Add Store"
   - Enter store details (name, address, contact)

2. **Create Co-Admins**
   - Go to "Users" page
   - Click "Add User"
   - Select role: "Co-Admin"
   - Enter username and password
   - Assign to a store

3. **Create Cashiers**
   - Go to "Users" page
   - Click "Add User"
   - Select role: "Cashier"
   - Enter username and password
   - **Optional**: Enter RFID for quick login
   - Assign to a store

4. **Create Global Products/Categories**
   - Go to "Products" or "Categories" page
   - Add items that will be available to all stores

## User Roles

### Admin
- Full system access
- Can create and manage all stores
- Can create Admin, Co-Admin, and Cashier users
- Products/Categories created by Admin are **global** (visible to all stores)

### Co-Admin
- Access to assigned store only
- Can create Cashier users (automatically assigned to their store)
- Can manage products/categories for their store
- Can view transactions and sales for their store
- Products/Categories created by Co-Admin are **store-specific**

### Cashier
- Access to POS system
- Can process transactions
- Can view products for their store
- Cannot manage users or settings
- Can login with username+password or RFID

## Login Methods

Both **username+password** and **RFID** authentication are supported:

- **Admin/Co-Admin/Cashier**: Can use username+password or RFID (if RFID is set)
- The login form switches automatically between methods
- RFID is optional for all users but recommended for Cashiers for faster login

## Changing Admin Password

### Method 1: Through Database (if you forgot password)

1. Connect to MongoDB:
```bash
mongosh
use rfid-pos
```

2. Hash a new password (use bcrypt with salt rounds 10)

3. Update the admin user:
```javascript
db.users.updateOne(
  { username: "admin" },
  { $set: { password: "YOUR_HASHED_PASSWORD_HERE" } }
)
```

### Method 2: Through the Application (recommended)

A user profile/settings page should be implemented where users can change their own passwords.

## Environment Variables

Create a `.env` file in the backend directory:

```env
MONGODB_URI=mongodb://localhost:27017/rfid-pos
PORT=5000
```

## Troubleshooting

### Cannot login with default admin
- Make sure you ran `npm run seed:admin` in the backend directory
- Check if MongoDB is running
- Check the backend console for any errors

### "Default admin already exists" message
- The admin account has already been created
- Use the credentials you set up previously
- If you forgot the password, update it directly in the database

### Backend connection error
- Verify MongoDB is running
- Check the MONGODB_URI in your .env file
- Ensure the backend server is running on port 5000

## Database Schema

### Users Collection
```javascript
{
  username: String,
  password: String (hashed),
  role: String (Admin | Co-Admin | Cashier),
  store: ObjectId (reference to Store),
  rfid: String (optional, unique),
  createdAt: Date,
  updatedAt: Date
}
```

### Stores Collection
```javascript
{
  storeName: String,
  address: String,
  contact: String,
  coAdmins: [ObjectId] (references to Users),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Notes

1. **Always change default credentials** after first login
2. Use strong passwords for all users
3. Keep your MongoDB connection string secure
4. In production, use environment variables for sensitive data
5. Implement JWT tokens for production (currently using basic auth)
