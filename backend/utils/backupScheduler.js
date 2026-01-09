const Store = require('../models/Store');
const BackupController = require('../controllers/BackupController');

// Format current time as HH:MM in 24-hour format
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Check if scheduled backup should run
const shouldRunBackup = (store) => {
  const schedule = store.backupSchedule;
  if (!schedule || !schedule.enabled) return false;

  const now = new Date();
  const currentTime = getCurrentTime();
  const currentDay = now.getDay(); // 0 = Sunday
  const currentDate = now.getDate();

  // Check if current time matches schedule time
  const timeMatches = currentTime === schedule.time;
  
  if (!timeMatches) return false;

  // Check if we already ran backup in the last 2 minutes to avoid duplicates
  const lastBackup = store.lastBackupTime;
  if (lastBackup) {
    const timeSinceLastBackup = now - new Date(lastBackup);
    const twoMinutes = 2 * 60 * 1000;
    if (timeSinceLastBackup < twoMinutes) {
      console.log(`[Backup Scheduler] Skipping duplicate backup for ${store.storeName} (last backup was ${Math.floor(timeSinceLastBackup/1000)}s ago)`);
      return false;
    }
  }

  // Check frequency-specific conditions
  switch (schedule.frequency) {
    case 'daily':
      return true; // If time matches, run daily

    case 'weekly':
      return currentDay === parseInt(schedule.dayOfWeek);

    case 'monthly':
      return currentDate === parseInt(schedule.dayOfMonth);

    default:
      return false;
  }
};

// Execute backup for a store
const executeBackup = async (store) => {
  try {
    console.log(`[Backup Scheduler] Starting scheduled backup for ${store.storeName}...`);
    
    // Get backup options from store schedule
    const options = store.backupSchedule.options || {
      products: true,
      addons: true,
      transactions: true,
      customers: true,
      users: true
    };

    // Create mock request/response objects for the controller
    const req = {
      body: {
        storeId: store._id.toString(),
        options: options
      }
    };

    const res = {
      status: (code) => ({
        json: (data) => {
          if (code === 200 && data.success) {
            console.log(`[Backup Scheduler] ✅ Scheduled backup completed for ${store.storeName}`);
            console.log(`[Backup Scheduler] Files uploaded: ${data.files?.length || 0}`);
            
            // Update last backup time
            store.lastBackupTime = new Date();
            store.save().catch(err => console.error('[Backup Scheduler] Error updating lastBackupTime:', err));
          } else {
            console.error(`[Backup Scheduler] ❌ Scheduled backup failed for ${store.storeName}:`, data.message);
          }
          return data;
        }
      }),
      json: (data) => {
        if (data.success) {
          console.log(`[Backup Scheduler] ✅ Scheduled backup completed for ${store.storeName}`);
          console.log(`[Backup Scheduler] Files uploaded: ${data.files?.length || 0}`);
          
          // Update last backup time
          store.lastBackupTime = new Date();
          store.save().catch(err => console.error('[Backup Scheduler] Error updating lastBackupTime:', err));
        } else {
          console.error(`[Backup Scheduler] ❌ Scheduled backup failed for ${store.storeName}:`, data.message);
        }
        return data;
      }
    };

    // Execute the backup
    await BackupController.manualBackup(req, res);
    
  } catch (error) {
    console.error(`[Backup Scheduler] ❌ Error executing scheduled backup for ${store.storeName}:`, error.message);
  }
};

// Check all stores for scheduled backups
const checkScheduledBackups = async () => {
  try {
    const currentTime = getCurrentTime();
    console.log(`[Backup Scheduler] Checking at ${currentTime}...`);
    
    // Find all stores with backup schedule enabled
    const stores = await Store.find({ 'backupSchedule.enabled': true });

    if (stores.length === 0) {
      return;
    }

    console.log(`[Backup Scheduler] Found ${stores.length} store(s) with scheduled backups enabled`);

    for (const store of stores) {
      const schedule = store.backupSchedule;
      console.log(`[Backup Scheduler] Store ${store.storeName}: Time=${schedule.time}, Frequency=${schedule.frequency}`);
      
      if (shouldRunBackup(store)) {
        console.log(`[Backup Scheduler] 🔄 Triggering scheduled backup for store: ${store.storeName}`);
        await executeBackup(store);
      }
    }
  } catch (error) {
    console.error('[Backup Scheduler] Error checking scheduled backups:', error);
  }
};

// Start the backup scheduler - runs every minute
const startBackupScheduler = () => {
  console.log('[Backup Scheduler] Backup scheduler started. Checking every minute for scheduled backups.');
  console.log(`[Backup Scheduler] Initial check at ${getCurrentTime()}...`);
  
  // Run immediately on start
  checkScheduledBackups();
  
  // Then run every minute (60000ms)
  setInterval(checkScheduledBackups, 60000);
};

module.exports = { startBackupScheduler };
