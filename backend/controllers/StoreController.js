const Store = require("../models/Store");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");

const store = {
    // Get all stores
    getAllStores: asyncHandler(async (req, res) => {
        try {
            let query = {};
            
            // If user is Co-Admin, only show their assigned store
            if (req.user && req.user.role === 'Co-Admin') {
                query._id = req.user.store._id;
            }
            // Admin sees all stores
            
            const stores = await Store.find(query).populate('coAdmins', 'username role');
            res.status(200).json({ success: true, stores });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch stores', error: error.message });
        }
    }),

    // Create a store
    createStore: asyncHandler(async (req, res) => {
        try {
            const { storeName, address, contact } = req.body;

            // Validate required fields
            if (!storeName) {
                return res.status(400).json({ success: false, message: "Store name is required" });
            }

            const createdStore = await Store.create({
                storeName,
                address,
                contact
            });

            res.status(201).json({ success: true, store: createdStore });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to create store', error: error.message });
        }
    }),

    // Get a single store by ID
    getStore: asyncHandler(async (req, res) => {
        try {
            const store = await Store.findById(req.params.id);
            
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            res.status(200).json({ success: true, store });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch store', error: error.message });
        }
    }),

    // Update a store
    updateStore: asyncHandler(async (req, res) => {
        try {
            const store = await Store.findById(req.params.id);
            
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            const updatedStore = await Store.findByIdAndUpdate(
                req.params.id,
                { ...req.body, updatedAt: Date.now() },
                { new: true, runValidators: true }
            );

            res.status(200).json({ success: true, store: updatedStore });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update store', error: error.message });
        }
    }),

    // Delete a store
    deleteStore: asyncHandler(async (req, res) => {
        try {
            const store = await Store.findById(req.params.id);
            
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            await Store.findByIdAndDelete(req.params.id);

            res.status(200).json({ success: true, message: 'Store deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete store', error: error.message });
        }
    }),

    // Assign co-admin to store
    assignCoAdmin: asyncHandler(async (req, res) => {
        try {
            const { userId } = req.body;
            const storeId = req.params.id;

            // Check if user exists and is a Co-Admin
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.role !== 'Co-Admin') {
                return res.status(400).json({ success: false, message: 'User must be a Co-Admin' });
            }

            // Update store's coAdmins array
            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            // Add co-admin if not already assigned
            if (!store.coAdmins.includes(userId)) {
                store.coAdmins.push(userId);
                await store.save();
            }

            // Update user's store reference
            user.store = storeId;
            await user.save();

            const updatedStore = await Store.findById(storeId).populate('coAdmins', 'username role');
            res.status(200).json({ success: true, store: updatedStore, message: 'Co-Admin assigned successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to assign Co-Admin', error: error.message });
        }
    }),

    // Remove co-admin from store
    removeCoAdmin: asyncHandler(async (req, res) => {
        try {
            const { userId } = req.body;
            const storeId = req.params.id;

            const store = await Store.findById(storeId);
            if (!store) {
                return res.status(404).json({ success: false, message: 'Store not found' });
            }

            // Remove co-admin from store's coAdmins array
            store.coAdmins = store.coAdmins.filter(id => id.toString() !== userId);
            await store.save();

            const updatedStore = await Store.findById(storeId).populate('coAdmins', 'username role');
            res.status(200).json({ success: true, store: updatedStore, message: 'Co-Admin removed successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to remove Co-Admin', error: error.message });
        }
    })
};

module.exports = store;
