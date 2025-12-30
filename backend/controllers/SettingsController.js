const Settings = require('../models/Settings');
const asyncHandler = require('express-async-handler');

const SettingsController = {
  // Get VAT Configuration
  getVATConfig: asyncHandler(async (req, res) => {
    try {
      const vatTypeSetting = await Settings.findOne({ key: 'vatType' });
      const vatValueSetting = await Settings.findOne({ key: 'vatValue' });
      
      const vatConfig = {
        type: vatTypeSetting ? vatTypeSetting.value : 'percent',
        value: vatValueSetting ? vatValueSetting.value : 0
      };
      
      res.status(200).json({
        success: true,
        vatConfig
      });
    } catch (error) {
      console.error('Get VAT config error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get VAT configuration', 
        error: error.message 
      });
    }
  }),

  // Update VAT Configuration
  updateVATConfig: asyncHandler(async (req, res) => {
    try {
      const { vatType, vatValue } = req.body;
      
      if (!vatType || !['percent', 'fixed'].includes(vatType)) {
        return res.status(400).json({
          success: false,
          message: 'VAT type must be either "percent" or "fixed"'
        });
      }
      
      if (vatValue === undefined || vatValue === null) {
        return res.status(400).json({
          success: false,
          message: 'VAT value is required'
        });
      }
      
      if (vatValue < 0) {
        return res.status(400).json({
          success: false,
          message: 'VAT value cannot be negative'
        });
      }
      
      if (vatType === 'percent' && vatValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'VAT percentage cannot exceed 100'
        });
      }
      
      // Update VAT type
      await Settings.findOneAndUpdate(
        { key: 'vatType' },
        { 
          key: 'vatType',
          value: vatType,
          description: 'VAT calculation type (percent or fixed)'
        },
        { upsert: true, new: true }
      );
      
      // Update VAT value
      await Settings.findOneAndUpdate(
        { key: 'vatValue' },
        { 
          key: 'vatValue',
          value: vatValue,
          description: 'VAT value (percentage or fixed amount)'
        },
        { upsert: true, new: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'VAT configuration updated successfully',
        vatConfig: { type: vatType, value: vatValue }
      });
    } catch (error) {
      console.error('Update VAT config error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update VAT configuration', 
        error: error.message 
      });
    }
  }),

  // Get all settings
  getAllSettings: asyncHandler(async (req, res) => {
    try {
      const settings = await Settings.find();
      
      // Convert to key-value object
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      res.status(200).json({
        success: true,
        settings: settingsObj
      });
    } catch (error) {
      console.error('Get all settings error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get settings', 
        error: error.message 
      });
    }
  })
};

module.exports = SettingsController;
