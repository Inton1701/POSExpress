const TransactionSession = require("../models/TransactionSession");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");
const Variant = require("../models/Variant");
const Store = require("../models/Store");

// Format current time as HH:MM in 24-hour format
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Auto-start sessions based on schedule
const autoStartSession = async (storeId) => {
  try {
    console.log(`[Scheduler] Auto-starting session for store: ${storeId || 'default'}`);
    
    // Create a new session
    const session = await TransactionSession.create({
      storeId: storeId || null,
      startedBy: 'Auto-Scheduled',
      startedAt: new Date(),
      isActive: true
    });
    
    console.log(`[Scheduler] Session started successfully at ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('[Scheduler] Error auto-starting session:', error);
  }
};

// Auto-end sessions based on schedule
const autoEndSession = async (session) => {
  try {
    console.log(`[Scheduler] Auto-ending session for store: ${session.storeId || 'default'}`);
    
    // Calculate sales summary for this session
    const sessionTransactions = await Transaction.find({
      status: { $in: ['Completed'] },
      transactionDate: {
        $gte: session.startedAt,
        $lte: new Date()
      }
    });

    let totalSales = 0;
    let totalProfit = 0;
    let totalProductsSold = 0;

    for (const transaction of sessionTransactions) {
      totalSales += transaction.totalAmount;
      
      for (const item of transaction.cart) {
        const quantity = item.quantity || 1;
        totalProductsSold += quantity;
        
        // Calculate profit
        let cost = 0;
        if (item.isVariant && item.variantId) {
          const variant = await Variant.findById(item.variantId);
          if (variant) {
            cost = variant.cost || 0;
            if (cost === 0 && variant.productId) {
              const product = await Product.findById(variant.productId);
              cost = product?.cost || 0;
            }
          }
        } else if (item.productId) {
          const product = await Product.findById(item.productId);
          cost = product?.cost || 0;
        }
        
        totalProfit += (item.price - cost) * quantity;
      }
    }

    session.isActive = false;
    session.endedBy = 'Auto-Scheduled';
    session.endedAt = new Date();
    session.salesSummary = {
      totalSales,
      totalProfit,
      totalProductsSold,
      transactionCount: sessionTransactions.length
    };
    await session.save();
    
    console.log(`[Scheduler] Session ended successfully at ${new Date().toLocaleString()}`);
    console.log(`[Scheduler] Sales Summary: ${sessionTransactions.length} transactions, $${totalSales.toFixed(2)} total sales`);
  } catch (error) {
    console.error('[Scheduler] Error auto-ending session:', error);
  }
};

// Check if current time is within the scheduled range
const isWithinSchedule = (currentTime, startTime, endTime) => {
  const [currentHour, currentMin] = currentTime.split(':').map(Number);
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const currentMinutes = currentHour * 60 + currentMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Main scheduler function - checks every minute
const checkScheduledSessions = async () => {
  try {
    const currentTime = getCurrentTime();
    console.log(`[Scheduler] Checking at ${currentTime}...`);
    
    // Find all stores with scheduled mode
    const stores = await Store.find({
      sessionMode: 'scheduled',
      scheduleStartTime: { $ne: null },
      scheduleEndTime: { $ne: null }
    });

    console.log(`[Scheduler] Found ${stores.length} store(s) with scheduled mode`);

    for (const store of stores) {
      console.log(`[Scheduler] Store ${store._id}: Mode=${store.sessionMode}, Start=${store.scheduleStartTime}, End=${store.scheduleEndTime}`);
      
      // Check if there's an active session for this store
      const activeSession = await TransactionSession.findOne({
        storeId: store._id,
        isActive: true
      });

      console.log(`[Scheduler] Active session for store ${store._id}: ${activeSession ? 'YES' : 'NO'}`);

      // Check if it's time to start the session (exact time match)
      if (currentTime === store.scheduleStartTime && !activeSession) {
        console.log(`[Scheduler] Exact time match! Starting session...`);
        await autoStartSession(store._id);
      }
      // Check if current time is within schedule and no active session (for server restart or manual end)
      else if (!activeSession && isWithinSchedule(currentTime, store.scheduleStartTime, store.scheduleEndTime)) {
        console.log(`[Scheduler] Current time ${currentTime} is within schedule (${store.scheduleStartTime}-${store.scheduleEndTime}). Auto-starting session.`);
        await autoStartSession(store._id);
      }
      
      // Check if it's time to end the session
      if (currentTime === store.scheduleEndTime && activeSession) {
        console.log(`[Scheduler] End time reached! Ending session...`);
        await autoEndSession(activeSession);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error checking scheduled sessions:', error);
  }
};

// Start the scheduler - runs every minute
const startScheduler = () => {
  console.log('[Scheduler] Session scheduler started. Checking every minute for scheduled sessions.');
  console.log(`[Scheduler] Initial check at ${getCurrentTime()}...`);
  
  // Run immediately on start
  checkScheduledSessions();
  
  // Then run every minute (60000ms)
  setInterval(checkScheduledSessions, 60000);
};

module.exports = { startScheduler };
