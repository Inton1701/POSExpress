const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Store = require('./models/Store');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/RFID-POS');

        console.log('Connected to MongoDB');

        // Check if default admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('Default admin already exists!');
            console.log('Username: admin');
            console.log('If you forgot the password, please update it directly in the database');
            mongoose.connection.close();
            return;
        }

        // Create a default store for admin
        let defaultStore = await Store.findOne({ storeName: 'Main Store' });
        
        if (!defaultStore) {
            defaultStore = await Store.create({
                storeName: 'Main Store',
                address: 'Default Address',
                contact: 'N/A',
                coAdmins: []
            });
            console.log('Created default store:', defaultStore.storeName);
        }

        // Create default admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = await User.create({
            username: 'admin',
            password: hashedPassword,
            role: 'Admin',
            store: defaultStore._id
        });

        console.log('\n=== Default Admin Created Successfully ===');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Role: Admin');
        console.log('Store: Main Store');
        console.log('\nIMPORTANT: Please change the default password after first login!');
        console.log('=========================================\n');

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding admin:', error);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedAdmin();
