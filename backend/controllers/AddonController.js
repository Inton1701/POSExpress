const Addon = require("../models/Addon");
const asyncHandler = require("express-async-handler");

const addon = {
  // Get all add-ons
  getAllAddons: asyncHandler(async (req, res) => {
    try {
      let query = { status: { $ne: 'deleted' } };
      
      // If user info is provided (from middleware)
      if (req.user) {
        if (req.user.role === 'Co-Admin') {
          // Co-Admin can only see addons in their store or global addons
          query.$or = [
            { stores: req.user.store._id },
            { isGlobal: true }
          ];
        }
        // Admin sees all addons (no additional filter)
      }
      
      const addons = await Addon.find(query).populate('stores', 'storeName address');
      res.status(200).json({ success: true, addons });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch add-ons', error: error.message });
    }
  }),

  // Create an add-on
  createAddon: asyncHandler(async (req, res) => {
    try {
      const { name, status, stores } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: "Add-on name is required" });
      }

      // Determine if addon is global or store-specific
      let isGlobal = false;
      let addonStores = stores || [];

      if (req.user) {
        if (req.user.role === 'Admin') {
          // Admin creates global addons if no stores specified
          isGlobal = !stores || stores.length === 0;
        } else if (req.user.role === 'Co-Admin') {
          // Co-Admin creates store-specific addons
          isGlobal = false;
          addonStores = [req.user.store._id];
        }
      } else {
        // When req.user is not available, use the stores and isGlobal from request body
        isGlobal = req.body.isGlobal !== undefined ? req.body.isGlobal : (!stores || stores.length === 0);
      }

      const createdAddon = await Addon.create({
        name,
        status,
        stores: addonStores,
        isGlobal
      });

      res.status(201).json({ success: true, addon: createdAddon });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create add-on', error: error.message });
    }
  }),

  // Get a single add-on by ID
  getAddon: asyncHandler(async (req, res) => {
    try {
      const addon = await Addon.findById(req.params.id);

      if (!addon) {
        return res.status(404).json({ success: false, message: 'Add-on not found' });
      }

      res.status(200).json({ success: true, addon });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch add-on', error: error.message });
    }
  }),

  // Update an add-on
  updateAddon: asyncHandler(async (req, res) => {
    try {
      const addon = await Addon.findById(req.params.id);

      if (!addon) {
        return res.status(404).json({ success: false, message: 'Add-on not found' });
      }

      const { name, status, quantity, quantityAlert } = req.body;

      if (name) addon.name = name;
      if (status) addon.status = status;
      if (quantity !== undefined) addon.quantity = quantity;
      if (quantityAlert !== undefined) addon.quantityAlert = quantityAlert;

      const updatedAddon = await addon.save();

      res.status(200).json({ success: true, addon: updatedAddon });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update add-on', error: error.message });
    }
  }),

  // Delete an add-on
  deleteAddon: asyncHandler(async (req, res) => {
    try {
      const addon = await Addon.findById(req.params.id);

      if (!addon) {
        return res.status(404).json({ success: false, message: 'Add-on not found' });
      }

      await Addon.deleteOne({ _id: req.params.id });

      res.status(200).json({ success: true, message: 'Add-on deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete add-on', error: error.message });
    }
  })
};

module.exports = addon;
