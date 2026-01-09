const asyncHandler = require("express-async-handler");
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Variant = require('../models/Variant');
const Addon = require('../models/Addon');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Store = require('../models/Store');
const StockHistory = require('../models/StockHistory');

// Service account credentials path
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../config/service_account.json');

// Function to get authenticated Google Drive client using service account
const getDriveClient = () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('Error initializing Google Drive client:', error);
    throw new Error('Failed to initialize Google Drive client');
  }
};

module.exports = {
  // Save Google Drive folder ID
  saveFolderId: asyncHandler(async (req, res) => {
    const { storeId, folderId } = req.body;

    if (!storeId || !folderId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID and folder ID are required'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Update store folder ID
    store.driveFolderId = folderId;
    await store.save();

    res.json({
      success: true,
      message: 'Folder ID saved successfully'
    });
  }),

  // Get Google Drive folder ID
  getFolderId: asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      folderId: store.driveFolderId || '',
      isConfigured: !!store.driveFolderId
    });
  }),

  // Check if Google Drive is configured
  checkStatus: asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const store = await Store.findById(storeId);
    const connected = store && store.driveFolderId ? true : false;

    res.json({
      success: true,
      connected
    });
  }),

  // Helper function to convert array to CSV
  arrayToCSV: (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle nested objects/arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes in strings
        return `"${String(value || '').replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  // Perform manual backup
  manualBackup: asyncHandler(async (req, res) => {
    const { storeId, options } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Get store and verify folder ID
    const store = await Store.findById(storeId);
    if (!store || !store.driveFolderId) {
      return res.status(400).json({
        success: false,
        message: 'Google Drive folder ID not configured'
      });
    }

    const drive = getDriveClient();

    // Create main backup folder with store name and date/time
    const sanitizedStoreName = store.storeName.replace(/[^a-zA-Z0-9]/g, '_');
    const backupFolderName = `${sanitizedStoreName}_Backup_(${new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/[/:]/g, '-')})`;

    const folderMetadata = {
      name: backupFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [store.driveFolderId]
    };

    const backupFolder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name',
      supportsAllDrives: true
    });

    const backupFolderId = backupFolder.data.id;

    // Create CSV_Backup subfolder
    const csvFolderMetadata = {
      name: 'CSV_Backup',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [backupFolderId]
    };

    const csvFolder = await drive.files.create({
      requestBody: csvFolderMetadata,
      fields: 'id, name',
      supportsAllDrives: true
    });

    const csvFolderId = csvFolder.data.id;

    // Create Json_Backup subfolder
    const jsonFolderMetadata = {
      name: 'Json_Backup',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [backupFolderId]
    };

    const jsonFolder = await drive.files.create({
      requestBody: jsonFolderMetadata,
      fields: 'id, name',
      supportsAllDrives: true
    });

    const jsonFolderId = jsonFolder.data.id;
    const uploadedFiles = [];

    // Helper function to upload CSV
    const uploadCSV = async (data, fileName) => {
      if (!data || data.length === 0) return null;

      const csvContent = module.exports.arrayToCSV(data);
      
      const fileMetadata = {
        name: fileName,
        mimeType: 'text/csv',
        parents: [csvFolderId]
      };

      const media = {
        mimeType: 'text/csv',
        body: csvContent
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, createdTime',
        supportsAllDrives: true
      });

      return file.data;
    };

    // Helper function to upload JSON
    const uploadJSON = async (data, fileName) => {
      if (!data) return null;

      const jsonContent = JSON.stringify(data, null, 2);
      
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [jsonFolderId]
      };

      const media = {
        mimeType: 'application/json',
        body: jsonContent
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, createdTime',
        supportsAllDrives: true
      });

      return file.data;
    };

    // Export store information
    const storeData = await Store.findById(storeId).lean();
    if (storeData) {
      const storeFile = await uploadJSON(storeData, 'store.json');
      if (storeFile) uploadedFiles.push(storeFile);
      console.log('Store data exported');
    }

    // Upload each category as CSV and JSON
    if (options.products) {
      const products = await Product.find({ 
        $or: [
          { stores: storeId },
          { isGlobal: true }
        ]
      }).lean();
      console.log('Products found:', products.length);
      if (products.length > 0) {
        const csvFile = await uploadCSV(products, 'products.csv');
        if (csvFile) uploadedFiles.push(csvFile);
        const jsonFile = await uploadJSON(products, 'products.json');
        if (jsonFile) uploadedFiles.push(jsonFile);
        
        // Also export variants for these products
        const productIds = products.map(p => p._id);
        const variants = await Variant.find({ productId: { $in: productIds } })
          .populate('productId', 'name sku')
          .lean();
        console.log('Variants found:', variants.length);
        if (variants.length > 0) {
          const flattenedVariants = variants.map(v => ({
            ...v,
            productName: v.productId?.name || 'N/A',
            productSku: v.productId?.sku || 'N/A',
            productId: v.productId?._id || v.productId
          }));
          const variantCsv = await uploadCSV(flattenedVariants, 'variants.csv');
          if (variantCsv) uploadedFiles.push(variantCsv);
          const variantJson = await uploadJSON(variants, 'variants.json');
          if (variantJson) uploadedFiles.push(variantJson);
        }
        
        // Also export stock history for these products
        const productSkus = products.map(p => p.sku);
        const stockHistory = await StockHistory.find({ 
          sku: { $in: productSkus },
          isDeleted: false
        }).lean();
        console.log('Stock history records found:', stockHistory.length);
        if (stockHistory.length > 0) {
          const historyCsv = await uploadCSV(stockHistory, 'stock-history.csv');
          if (historyCsv) uploadedFiles.push(historyCsv);
          const historyJson = await uploadJSON(stockHistory, 'stock-history.json');
          if (historyJson) uploadedFiles.push(historyJson);
        }
      }
    }

    if (options.addons) {
      const addons = await Addon.find({ 
        $or: [
          { stores: storeId },
          { isGlobal: true }
        ]
      }).lean();
      console.log('Addons found:', addons.length);
      if (addons.length > 0) {
        const csvFile = await uploadCSV(addons, 'addons.csv');
        if (csvFile) uploadedFiles.push(csvFile);
        const jsonFile = await uploadJSON(addons, 'addons.json');
        if (jsonFile) uploadedFiles.push(jsonFile);
      }
    }

    if (options.transactions) {
      const transactions = await Transaction.find({ store: storeId })
        .populate('store', 'storeName')
        .populate('customerId', 'username fullName')
        .lean();
      console.log('Transactions found:', transactions.length);
      if (transactions.length > 0) {
        // Flatten populated fields for readability
        const flattenedTransactions = transactions.map(t => ({
          ...t,
          storeName: t.store?.storeName || 'N/A',
          cashierName: t.employee || 'N/A',
          customerName: t.customerId?.fullName || 'N/A',
          customerUsername: t.customerId?.username || 'N/A',
          store: t.store?._id || t.store,
          customerId: t.customerId?._id || t.customerId
        }));
        const csvFile = await uploadCSV(flattenedTransactions, 'transactions.csv');
        if (csvFile) uploadedFiles.push(csvFile);
        const jsonFile = await uploadJSON(transactions, 'transactions.json');
        if (jsonFile) uploadedFiles.push(jsonFile);
      }
    }

    if (options.customers) {
      const customers = await Customer.find({}).lean();
      console.log('Customers found:', customers.length);
      if (customers.length > 0) {
        const csvFile = await uploadCSV(customers, 'customers.csv');
        if (csvFile) uploadedFiles.push(csvFile);
        const jsonFile = await uploadJSON(customers, 'customers.json');
        if (jsonFile) uploadedFiles.push(jsonFile);
      }
    }

    if (options.users) {
      const users = await User.find({ store: storeId })
        .populate('store', 'storeName')
        .select('-password')
        .lean();
      console.log('Users found:', users.length);
      if (users.length > 0) {
        // Flatten store object
        const flattenedUsers = users.map(u => ({
          ...u,
          storeName: u.store?.storeName || 'N/A',
          store: u.store?._id || u.store
        }));
        const csvFile = await uploadCSV(flattenedUsers, 'users.csv');
        if (csvFile) uploadedFiles.push(csvFile);
        const jsonFile = await uploadJSON(users, 'users.json');
        if (jsonFile) uploadedFiles.push(jsonFile);
      }
    }

    res.json({
      success: true,
      message: 'Backup completed successfully',
      folder: backupFolder.data,
      files: uploadedFiles
    });
  }),

  // Save backup schedule settings
  saveSchedule: asyncHandler(async (req, res) => {
    const { storeId, schedule } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Update backup schedule - properly merge nested objects
    store.backupSchedule = {
      enabled: schedule.enabled !== undefined ? schedule.enabled : store.backupSchedule.enabled,
      frequency: schedule.frequency || store.backupSchedule.frequency,
      time: schedule.time || store.backupSchedule.time,
      dayOfWeek: schedule.dayOfWeek || store.backupSchedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth || store.backupSchedule.dayOfMonth,
      options: {
        products: schedule.options?.products !== undefined ? schedule.options.products : store.backupSchedule.options?.products ?? true,
        addons: schedule.options?.addons !== undefined ? schedule.options.addons : store.backupSchedule.options?.addons ?? true,
        transactions: schedule.options?.transactions !== undefined ? schedule.options.transactions : store.backupSchedule.options?.transactions ?? true,
        customers: schedule.options?.customers !== undefined ? schedule.options.customers : store.backupSchedule.options?.customers ?? true,
        users: schedule.options?.users !== undefined ? schedule.options.users : store.backupSchedule.options?.users ?? true
      }
    };

    await store.save();

    res.json({
      success: true,
      message: 'Backup schedule saved successfully'
    });
  }),

  // Get backup history
  getHistory: asyncHandler(async (req, res) => {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    // Get store and verify folder ID
    const store = await Store.findById(storeId);
    if (!store || !store.driveFolderId) {
      return res.json({
        success: true,
        files: []
      });
    }

    const drive = getDriveClient();

    // List backup folders from Google Drive
    const response = await drive.files.list({
      pageSize: 20,
      fields: 'files(id, name, createdTime, size, mimeType)',
      orderBy: 'createdTime desc',
      q: `'${store.driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name contains 'backup'`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    res.json({
      success: true,
      files: response.data.files || []
    });
  })
};
