const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const os = require('os')
const { exec } = require('child_process')
const bwipjs = require('bwip-js')

let mainWindow

function createWindow() {
  // Determine correct paths for packaged vs unpackaged app
  const preloadPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar', 'electron', 'preload.cjs')
    : path.join(__dirname, 'preload.cjs')
  
  // On Linux production, start in fullscreen mode
  const isLinuxProduction = process.platform === 'linux' && app.isPackaged
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    fullscreen: isLinuxProduction, // Start in fullscreen on Linux production
    show: false, // Don't show window until ready
    autoHideMenuBar: false, // Always show menu bar (visible when exiting fullscreen)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    }
  })

  // Set global API URL before loading the app
  global.API_URL = process.env.API_URL || 'http://localhost:5000/api'

  // Load your Vue app
  if (process.env.NODE_ENV === 'development') {
    // Development mode - use Vite dev server
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // Production mode - load from dist folder
    const indexPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html')
      : path.join(__dirname, '../dist/index.html')
    
    console.log('=== Electron App Starting ===')
    console.log('Platform:', process.platform)
    console.log('App packaged:', app.isPackaged)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('Loading index from:', indexPath)
    console.log('File exists:', fs.existsSync(indexPath))
    console.log('Preload path:', preloadPath)
    
    // Use loadFile instead of loadURL for better file:// handling
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load:', err)
    })
  }

  // Show window when DOM is ready (not waiting for all resources)
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready - showing window')
    mainWindow.webContents.executeJavaScript(`
      window.__APP_CONFIG__ = {
        API_URL: '${global.API_URL}'
      };
    `).catch(() => {})
    
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show()
      if (process.platform === 'linux' && app.isPackaged) {
        mainWindow.setFullScreen(true) // Start in fullscreen (menu visible when exiting fullscreen)
      }
    }
  })
  
  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading')
  })
  
  // Add error handler
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL)
  })
  
  // Log console messages from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`Renderer [${level}]:`, message)
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Toggle fullscreen handler
ipcMain.handle('toggle-fullscreen', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    const isFullScreen = window.isFullScreen()
    window.setFullScreen(!isFullScreen)
    return !isFullScreen
  }
  return false
})

// Reload handler that preserves navigation
ipcMain.handle('reload-app', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (window) {
    window.reload()
  }
})

// Get all printers
ipcMain.handle('get-printers', async () => {
  const printers = await mainWindow.webContents.getPrintersAsync()
  
  // Filter for thermal printers (common keywords)
  const thermalPrinters = printers.filter(printer => {
    const name = printer.name.toLowerCase()
    return name.includes('thermal') || 
           name.includes('pos') || 
           name.includes('receipt') ||
           name.includes('58mm') ||
           name.includes('80mm') ||
           name.includes('epson tm') ||
           name.includes('star tsp') ||
           name.includes('xprinter') ||
           name.includes('rpp')
  })
  
  return {
    allPrinters: printers,
    thermalPrinters: thermalPrinters,
    defaultPrinter: printers.find(p => p.isDefault)
  }
})

// Execute system command
ipcMain.handle('execute-command', async (event, command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Command execution error:', error)
        reject(error)
      } else {
        console.log('Command output:', stdout)
        resolve({ success: true, stdout, stderr })
      }
    })
  })
})

// ESC/POS Commands for thermal printers
const ESC = 0x1B
const GS = 0x1D
const LF = 0x0A
const DLE = 0x10
const DC4 = 0x14

const ESCPOS = {
  // Initialize printer - clears buffer and resets settings
  INIT: Buffer.from([ESC, 0x40]),
  // Cancel any pending data in buffer
  CANCEL: Buffer.from([0x18]), // CAN - Cancel
  // Clear print buffer
  CLEAR_BUFFER: Buffer.from([DLE, DC4, 0x08, 0x01, 0x03, 0x14, 0x01, 0x06, 0x02, 0x08]), // Real-time request - some printers
  // Text alignment
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),
  // Text formatting
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  UNDERLINE_OFF: Buffer.from([ESC, 0x2D, 0x00]),
  DOUBLE_HEIGHT_ON: Buffer.from([GS, 0x21, 0x01]),
  DOUBLE_WIDTH_ON: Buffer.from([GS, 0x21, 0x10]),
  DOUBLE_SIZE_ON: Buffer.from([GS, 0x21, 0x11]),
  NORMAL_SIZE: Buffer.from([GS, 0x21, 0x00]),
  // Reset line spacing
  DEFAULT_LINE_SPACING: Buffer.from([ESC, 0x32]), // ESC 2 - default line spacing
  // Line feed and cut
  LINE_FEED: Buffer.from([LF]),
  FEED_AND_CUT: Buffer.from([GS, 0x56, 0x41, 0x03]), // Feed 3 lines and partial cut
  // Character set
  CHARSET_PC858: Buffer.from([ESC, 0x74, 0x13]) // Western European with Euro
}

// Helper function to create ESC/POS text buffer
function escposText(text) {
  return Buffer.from(text, 'utf8')
}

// Helper function to create a line of dashes
function escposDivider(char = '-', width = 32) {
  return Buffer.from(char.repeat(width))
}

// Helper function to format a line with left and right text
function escposLine(left, right, width = 32) {
  const spaces = width - left.length - right.length
  if (spaces < 1) {
    return Buffer.from(left.substring(0, width - right.length - 1) + ' ' + right)
  }
  return Buffer.from(left + ' '.repeat(spaces) + right)
}

// Generate ESC/POS commands for a receipt
function generateEscPosReceipt(receiptData) {
  const buffers = []
  const width = 32 // Characters per line for 58mm printer
  
  // === ROBUST INITIALIZATION SEQUENCE ===
  // 1. Cancel any pending data
  buffers.push(ESCPOS.CANCEL)
  // 2. Initialize printer (clears buffer, resets all settings)
  buffers.push(ESCPOS.INIT)
  // 3. Wait a tiny bit (add some line feeds that will be eaten if buffer was dirty)
  buffers.push(ESCPOS.LINE_FEED)
  // 4. Initialize again to be sure
  buffers.push(ESCPOS.INIT)
  // 5. Set character set
  buffers.push(ESCPOS.CHARSET_PC858)
  // 6. Reset text formatting
  buffers.push(ESCPOS.NORMAL_SIZE)
  buffers.push(ESCPOS.BOLD_OFF)
  buffers.push(ESCPOS.UNDERLINE_OFF)
  buffers.push(ESCPOS.DEFAULT_LINE_SPACING)
  buffers.push(ESCPOS.ALIGN_LEFT)
  
  // Header
  buffers.push(ESCPOS.ALIGN_CENTER)
  buffers.push(ESCPOS.BOLD_ON)
  buffers.push(ESCPOS.DOUBLE_SIZE_ON)
  buffers.push(escposText('POSXPRESS'))
  buffers.push(ESCPOS.LINE_FEED)
  buffers.push(ESCPOS.NORMAL_SIZE)
  
  if (receiptData.storeName) {
    buffers.push(escposText(receiptData.storeName))
    buffers.push(ESCPOS.LINE_FEED)
  }
  buffers.push(ESCPOS.BOLD_OFF)
  
  if (receiptData.address) {
    buffers.push(escposText(receiptData.address))
    buffers.push(ESCPOS.LINE_FEED)
  }
  if (receiptData.contact) {
    buffers.push(escposText('Tel: ' + receiptData.contact))
    buffers.push(ESCPOS.LINE_FEED)
  }
  if (receiptData.tin) {
    buffers.push(escposText('TIN: ' + receiptData.tin))
    buffers.push(ESCPOS.LINE_FEED)
  }
  
  // Receipt type header
  buffers.push(ESCPOS.LINE_FEED)
  buffers.push(escposDivider('=', width))
  buffers.push(ESCPOS.LINE_FEED)
  
  // Determine receipt type
  if (receiptData.transactionType === 'Sales Report') {
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText('SALES REPORT'))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(ESCPOS.ALIGN_LEFT)
    buffers.push(escposText('Date: ' + new Date(receiptData.date).toLocaleString()))
    buffers.push(ESCPOS.LINE_FEED)
    
    if (receiptData.sessionStartedAt) {
      buffers.push(escposText('Session Start: ' + new Date(receiptData.sessionStartedAt).toLocaleString()))
      buffers.push(ESCPOS.LINE_FEED)
    }
    
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposLine('Total Sales:', 'P' + receiptData.summary.todaySales.toFixed(2), width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposLine('Total Profit:', 'P' + receiptData.summary.totalProfit.toFixed(2), width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposLine('Products Sold:', String(receiptData.summary.totalProductsSold), width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_OFF)
    
    if (receiptData.products && receiptData.products.length > 0) {
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposDivider('-', width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(ESCPOS.ALIGN_CENTER)
      buffers.push(escposText('PRODUCT BREAKDOWN'))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposDivider('-', width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(ESCPOS.ALIGN_LEFT)
      
      for (const product of receiptData.products) {
        buffers.push(escposText(product.name.substring(0, width)))
        buffers.push(ESCPOS.LINE_FEED)
        const unitPrice = product.quantitySold > 0 ? product.totalSales / product.quantitySold : 0
        buffers.push(escposLine('  x' + product.quantitySold + ' @ P' + unitPrice.toFixed(2), 'P' + product.totalSales.toFixed(2), width))
        buffers.push(ESCPOS.LINE_FEED)
      }
    }
    
  } else if (receiptData.type === 'refund') {
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText('REFUND RECEIPT'))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(ESCPOS.ALIGN_CENTER)
    buffers.push(escposText('Refund ID'))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText(String(receiptData.transactionId)))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(ESCPOS.ALIGN_LEFT)
    buffers.push(escposText('Date: ' + new Date(receiptData.date).toLocaleString()))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposText('Original TXN: ' + receiptData.originalTransactionId))
    buffers.push(ESCPOS.LINE_FEED)
    if (receiptData.customer) {
      buffers.push(escposText('Customer: ' + receiptData.customer.fullName))
      buffers.push(ESCPOS.LINE_FEED)
    }
    buffers.push(escposText('Cashier: ' + (receiptData.cashier || 'N/A')))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(escposDivider('-', width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText('REFUNDED ITEMS:'))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    
    for (const item of receiptData.items) {
      buffers.push(escposText(item.name.substring(0, width)))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposLine('  x' + item.quantity + ' @ P' + item.price.toFixed(2), 'P' + (item.price * item.quantity).toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
    }
    
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposLine('REFUND AMOUNT:', 'P' + receiptData.refundAmount.toFixed(2), width))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposText('Payment: ' + receiptData.paymentMethod))
    buffers.push(ESCPOS.LINE_FEED)
    
  } else if (receiptData.cart && receiptData.cart.length > 0) {
    // Sales Receipt
    buffers.push(escposText('Sales Receipt'))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(escposText('Transaction ID'))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText(String(receiptData.transactionId)))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(ESCPOS.ALIGN_LEFT)
    buffers.push(escposText('Date: ' + new Date(receiptData.date).toLocaleString()))
    buffers.push(ESCPOS.LINE_FEED)
    if (receiptData.customerName) {
      buffers.push(escposText('Customer: ' + receiptData.customerName))
      buffers.push(ESCPOS.LINE_FEED)
    }
    buffers.push(escposText('Cashier: ' + (receiptData.employee || 'N/A')))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(escposDivider('-', width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText('ITEMS:'))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    
    let vatableSales = 0
    let vatAmount = 0
    let vatExemptSales = 0
    
    for (const item of receiptData.cart) {
      const itemTotal = item.price * item.quantity
      
      buffers.push(escposText(item.name.substring(0, width) + (item.isVattable ? ' (V)' : '')))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposLine('  x' + item.quantity + ' @ P' + item.price.toFixed(2), 'P' + itemTotal.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
      
      if (item.isVattable) {
        vatableSales += itemTotal
        if (receiptData.vatConfig) {
          if (receiptData.vatConfig.type === 'percent') {
            vatAmount += itemTotal * (receiptData.vatConfig.value / 100)
          } else if (receiptData.vatConfig.type === 'fixed') {
            vatAmount += receiptData.vatConfig.value * item.quantity
          }
        }
      } else {
        vatExemptSales += itemTotal
      }
      
      // Add addons
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const addonTotal = addon.price * addon.quantity
          vatExemptSales += addonTotal
          buffers.push(escposLine('    + ' + addon.name, 'P' + addonTotal.toFixed(2), width))
          buffers.push(ESCPOS.LINE_FEED)
        }
      }
    }
    
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    // VAT breakdown
    if (vatableSales > 0 || vatExemptSales > 0) {
      buffers.push(escposLine('VATABLE SALES', 'P' + vatableSales.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
      if (vatAmount > 0) {
        const vatLabel = receiptData.vatConfig?.type === 'percent' ? 'VAT (' + receiptData.vatConfig.value + '%)' : 'VAT'
        buffers.push(escposLine(vatLabel, 'P' + vatAmount.toFixed(2), width))
        buffers.push(ESCPOS.LINE_FEED)
      }
      buffers.push(escposLine('VAT-EXEMPT', 'P' + vatExemptSales.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposDivider('-', width))
      buffers.push(ESCPOS.LINE_FEED)
    }
    
    // Total
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(ESCPOS.DOUBLE_SIZE_ON)
    buffers.push(escposLine('TOTAL:', 'P' + receiptData.totalAmount.toFixed(2), width / 2))
    buffers.push(ESCPOS.NORMAL_SIZE)
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(escposText('Payment: ' + receiptData.paymentMethod))
    buffers.push(ESCPOS.LINE_FEED)
    
    if (receiptData.cash > 0) {
      buffers.push(escposLine('Cash:', 'P' + receiptData.cash.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposLine('Change:', 'P' + receiptData.change.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
    }
    
    if (receiptData.paymentMethod === 'E-wallet/RFID' && receiptData.previousBalance !== undefined) {
      buffers.push(escposDivider('-', width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposLine('Prev Balance:', 'P' + receiptData.previousBalance.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(escposLine('Amount Paid:', 'P' + receiptData.totalAmount.toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
      buffers.push(ESCPOS.BOLD_ON)
      buffers.push(escposLine('Remaining:', 'P' + receiptData.remainingBalance.toFixed(2), width))
      buffers.push(ESCPOS.BOLD_OFF)
      buffers.push(ESCPOS.LINE_FEED)
    }
    
  } else {
    // Customer Transaction Receipt
    buffers.push(escposText('Customer Transaction'))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposText((receiptData.transactionType || 'TRANSACTION').toUpperCase()))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposDivider('=', width))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(ESCPOS.ALIGN_LEFT)
    if (receiptData.transactionId) {
      buffers.push(escposText('Ref No: ' + receiptData.transactionId))
      buffers.push(ESCPOS.LINE_FEED)
    }
    buffers.push(escposText('Date: ' + new Date(receiptData.date).toLocaleString()))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposText('Customer: ' + (receiptData.customerName || 'N/A')))
    buffers.push(ESCPOS.LINE_FEED)
    
    buffers.push(escposDivider('-', width))
    buffers.push(ESCPOS.LINE_FEED)
    buffers.push(escposLine('Previous Balance:', 'P' + (receiptData.previousBalance || 0).toFixed(2), width))
    buffers.push(ESCPOS.LINE_FEED)
    
    if ((receiptData.amount || 0) > 0) {
      const amountLabel = receiptData.transactionType && receiptData.transactionType.includes('CASH-IN') ? 'Amount Added:' : 'Amount:'
      buffers.push(escposLine(amountLabel, 'P' + (receiptData.amount || 0).toFixed(2), width))
      buffers.push(ESCPOS.LINE_FEED)
    }
    
    buffers.push(ESCPOS.BOLD_ON)
    buffers.push(escposLine('New Balance:', 'P' + (receiptData.currentBalance || 0).toFixed(2), width))
    buffers.push(ESCPOS.BOLD_OFF)
    buffers.push(ESCPOS.LINE_FEED)
  }
  
  // Footer
  buffers.push(escposDivider('=', width))
  buffers.push(ESCPOS.LINE_FEED)
  buffers.push(ESCPOS.ALIGN_CENTER)
  buffers.push(ESCPOS.BOLD_ON)
  buffers.push(escposText('Thank you!'))
  buffers.push(ESCPOS.BOLD_OFF)
  buffers.push(ESCPOS.LINE_FEED)
  buffers.push(escposText('Please come again'))
  buffers.push(ESCPOS.LINE_FEED)
  buffers.push(ESCPOS.LINE_FEED)
  buffers.push(ESCPOS.LINE_FEED)
  
  // Cut paper
  buffers.push(ESCPOS.FEED_AND_CUT)
  
  return Buffer.concat(buffers)
}

// Helper function to print via ESC/POS on Linux
async function printViaEscPos(printerName, escposData) {
  return new Promise((resolve, reject) => {
    // Save ESC/POS data to temp file
    const tempFile = path.join(os.tmpdir(), `escpos-${Date.now()}.bin`)
    fs.writeFileSync(tempFile, escposData)
    
    console.log('ESC/POS data saved to:', tempFile, 'size:', escposData.length, 'bytes')
    
    // Send raw data to printer - try multiple methods
    // Method 1: lpr with raw option
    const printCommand = `lpr -P "${printerName}" -o raw "${tempFile}"`
    
    console.log('Executing ESC/POS print command:', printCommand)
    
    exec(printCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('lpr failed, trying lp with raw option...')
        
        // Method 2: lp with raw option
        const lpCommand = `lp -d "${printerName}" -o raw "${tempFile}"`
        
        exec(lpCommand, (err2, stdout2, stderr2) => {
          if (err2) {
            console.log('lp raw failed, trying direct device write...')
            
            // Method 3: Try to find and write directly to USB device
            exec(`lpstat -v "${printerName}"`, (err3, stdout3, stderr3) => {
              if (!err3 && stdout3) {
                // Extract device path from lpstat output
                const deviceMatch = stdout3.match(/device for .+: (.+)/)
                if (deviceMatch && deviceMatch[1]) {
                  const devicePath = deviceMatch[1].replace('usb://', '/dev/usb/lp0') // Approximate USB path
                  console.log('Trying direct write to device...')
                  
                  exec(`cat "${tempFile}" > /dev/usb/lp0 2>/dev/null || cat "${tempFile}" | lp -d "${printerName}" -`, (err4) => {
                    // Cleanup
                    setTimeout(() => { try { fs.unlinkSync(tempFile) } catch(e) {} }, 5000)
                    
                    if (err4) {
                      reject(new Error('All ESC/POS print methods failed'))
                    } else {
                      resolve({ success: true, method: 'direct' })
                    }
                  })
                } else {
                  // Cleanup and reject
                  setTimeout(() => { try { fs.unlinkSync(tempFile) } catch(e) {} }, 5000)
                  reject(new Error('ESC/POS print failed: ' + err2.message))
                }
              } else {
                // Cleanup and reject
                setTimeout(() => { try { fs.unlinkSync(tempFile) } catch(e) {} }, 5000)
                reject(new Error('ESC/POS print failed: ' + err2.message))
              }
            })
          } else {
            console.log('lp output:', stdout2)
            setTimeout(() => { try { fs.unlinkSync(tempFile) } catch(e) {} }, 5000)
            resolve({ success: true, method: 'lp-raw' })
          }
        })
      } else {
        console.log('lpr output:', stdout)
        setTimeout(() => { try { fs.unlinkSync(tempFile) } catch(e) {} }, 5000)
        resolve({ success: true, method: 'lpr-raw' })
      }
    })
  })
}

// Helper function to print via ESC/POS on Windows
async function printViaEscPosWindows(printerName, escposData) {
  return new Promise((resolve, reject) => {
    // Save ESC/POS data to temp file
    const tempFile = path.join(os.tmpdir(), `escpos-${Date.now()}.bin`)
    fs.writeFileSync(tempFile, escposData)
    
    console.log('ESC/POS data saved to:', tempFile, 'size:', escposData.length, 'bytes')
    
    // Escape the printer name and file path for PowerShell
    const escapedPrinterName = printerName.replace(/'/g, "''")
    const escapedTempFile = tempFile.replace(/\\/g, '\\\\').replace(/'/g, "''")
    
    // PowerShell script to send raw data to printer
    // Uses .NET to send raw bytes directly to the printer
    const psScript = `
      $printerName = '${escapedPrinterName}'
      $filePath = '${escapedTempFile}'
      
      # Read the binary file
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      
      # Try method 1: Use RawPrinterHelper via P/Invoke
      $signature = @'
      [DllImport("winspool.drv", CharSet = CharSet.Unicode, SetLastError = true)]
      public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
      
      [DllImport("winspool.drv", SetLastError = true)]
      public static extern bool ClosePrinter(IntPtr hPrinter);
      
      [DllImport("winspool.drv", SetLastError = true)]
      public static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOA pDocInfo);
      
      [DllImport("winspool.drv", SetLastError = true)]
      public static extern bool EndDocPrinter(IntPtr hPrinter);
      
      [DllImport("winspool.drv", SetLastError = true)]
      public static extern bool StartPagePrinter(IntPtr hPrinter);
      
      [DllImport("winspool.drv", SetLastError = true)]
      public static extern bool EndPagePrinter(IntPtr hPrinter);
      
      [DllImport("winspool.drv", SetLastError = true)]
      public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
      
      [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
      public struct DOCINFOA {
          [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
          [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
          [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
      }
'@
      
      try {
          Add-Type -MemberDefinition $signature -Name RawPrinter -Namespace Win32 -PassThru | Out-Null
      } catch {
          # Type already exists, continue
      }
      
      $printerHandle = [IntPtr]::Zero
      $result = [Win32.RawPrinter]::OpenPrinter($printerName, [ref]$printerHandle, [IntPtr]::Zero)
      
      if (-not $result) {
          Write-Error "Failed to open printer: $printerName"
          exit 1
      }
      
      try {
          $docInfo = New-Object Win32.RawPrinter+DOCINFOA
          $docInfo.pDocName = "ESC/POS Receipt"
          $docInfo.pDataType = "RAW"
          
          $result = [Win32.RawPrinter]::StartDocPrinter($printerHandle, 1, [ref]$docInfo)
          if (-not $result) {
              Write-Error "StartDocPrinter failed"
              exit 1
          }
          
          try {
              $result = [Win32.RawPrinter]::StartPagePrinter($printerHandle)
              if (-not $result) {
                  Write-Error "StartPagePrinter failed"
                  exit 1
              }
              
              try {
                  $unmanagedBytes = [System.Runtime.InteropServices.Marshal]::AllocHGlobal($bytes.Length)
                  try {
                      [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $unmanagedBytes, $bytes.Length)
                      $written = 0
                      $result = [Win32.RawPrinter]::WritePrinter($printerHandle, $unmanagedBytes, $bytes.Length, [ref]$written)
                      if (-not $result) {
                          Write-Error "WritePrinter failed"
                          exit 1
                      }
                      Write-Output "Successfully sent $written bytes to printer"
                  } finally {
                      [System.Runtime.InteropServices.Marshal]::FreeHGlobal($unmanagedBytes)
                  }
              } finally {
                  [Win32.RawPrinter]::EndPagePrinter($printerHandle) | Out-Null
              }
          } finally {
              [Win32.RawPrinter]::EndDocPrinter($printerHandle) | Out-Null
          }
      } finally {
          [Win32.RawPrinter]::ClosePrinter($printerHandle) | Out-Null
      }
    `
    
    // Save script to temp file
    const scriptPath = path.join(os.tmpdir(), `escpos-print-${Date.now()}.ps1`)
    fs.writeFileSync(scriptPath, psScript, 'utf8')
    
    console.log('Executing PowerShell ESC/POS print script')
    
    // Execute PowerShell script
    const psCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
    
    exec(psCommand, (error, stdout, stderr) => {
      // Clean up temp files
      setTimeout(() => {
        try { fs.unlinkSync(tempFile) } catch (e) {}
        try { fs.unlinkSync(scriptPath) } catch (e) {}
      }, 5000)
      
      if (error) {
        console.error('PowerShell ESC/POS print error:', error)
        console.error('stderr:', stderr)
        console.error('stdout:', stdout)
        reject(new Error(`ESC/POS print failed: ${stderr || error.message}`))
      } else {
        console.log('PowerShell ESC/POS output:', stdout)
        if (stderr) console.log('PowerShell stderr:', stderr)
        resolve({ success: true, method: 'powershell-raw' })
      }
    })
  })
}

// Helper function to print via CUPS on Linux (using lp command) - fallback for PNG
async function printViaCUPS(printerName, imagePath) {
  return new Promise((resolve, reject) => {
    // Use raw printing mode to bypass CUPS filters that may crash
    // The -o raw option sends the file directly to the printer without filtering
    // For thermal printers, we use simple options that don't trigger rastertoz filter crashes
    
    // First try: Use lpr with simple options (often more compatible with thermal printers)
    const printCommand = `lpr -P "${printerName}" -o raw "${imagePath}"`
    
    console.log('Executing print command:', printCommand)
    
    exec(printCommand, (error, stdout, stderr) => {
      if (error) {
        console.log('lpr raw failed, trying lp with minimal options...')
        
        // Second try: Use lp with no special options
        const fallbackCommand = `lp -d "${printerName}" "${imagePath}"`
        
        exec(fallbackCommand, (err2, stdout2, stderr2) => {
          if (err2) {
            console.log('lp failed, trying direct file copy to printer...')
            
            // Third try: Direct copy to printer device (most raw approach)
            // This requires the printer to be set up as a raw queue in CUPS
            const directCommand = `cat "${imagePath}" | lp -d "${printerName}" -o raw -`
            
            exec(directCommand, (err3, stdout3, stderr3) => {
              if (err3) {
                console.error('All print methods failed')
                console.error('Last error:', err3)
                reject(new Error('Print failed: ' + err3.message))
              } else {
                console.log('Direct print output:', stdout3)
                resolve({ success: true, method: 'direct' })
              }
            })
          } else {
            console.log('lp output:', stdout2)
            resolve({ success: true, method: 'lp' })
          }
        })
      } else {
        console.log('lpr output:', stdout)
        if (stderr) console.log('lpr stderr:', stderr)
        resolve({ success: true, method: 'lpr-raw' })
      }
    })
  })
}

// Helper function to print via Windows using PowerShell
async function printViaWindows(printerName, imagePath) {
  return new Promise((resolve, reject) => {
    // Escape paths for PowerShell
    const escapedImagePath = imagePath.replace(/\\/g, '\\\\').replace(/'/g, "''")
    const escapedPrinterName = printerName.replace(/'/g, "''")
    
    // Create PowerShell script to print the image
    // This uses Add-PrinterJob which is more reliable for thermal printers
    const psScript = `
      $image = Get-Item '${escapedImagePath}'
      $printer = Get-Printer -Name '${escapedPrinterName}' -ErrorAction SilentlyContinue
      
      if ($null -eq $printer) {
        Write-Error "Printer not found: ${escapedPrinterName}"
        exit 1
      }
      
      # Try using Windows Forms to print (most reliable for images)
      Add-Type -AssemblyName System.Drawing
      Add-Type -AssemblyName System.Windows.Forms
      
      $img = [System.Drawing.Image]::FromFile('${escapedImagePath}')
      $printDoc = New-Object System.Drawing.Printing.PrintDocument
      $printDoc.PrinterSettings.PrinterName = '${escapedPrinterName}'
      
      # Set to not fit to page - use actual size
      $printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
      
      $printDoc.add_PrintPage({
        param($sender, $ev)
        $ev.Graphics.DrawImage($img, 0, 0, $img.Width, $img.Height)
        $ev.HasMorePages = $false
      })
      
      try {
        $printDoc.Print()
        Write-Output "Print job sent successfully"
      }
      catch {
        Write-Error $_.Exception.Message
        exit 1
      }
      finally {
        $img.Dispose()
        $printDoc.Dispose()
      }
    `
    
    // Save script to temp file
    const scriptPath = path.join(os.tmpdir(), `print-script-${Date.now()}.ps1`)
    fs.writeFileSync(scriptPath, psScript, 'utf8')
    
    console.log('Executing PowerShell print script:', scriptPath)
    
    // Execute PowerShell script
    const psCommand = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
    
    exec(psCommand, (error, stdout, stderr) => {
      // Clean up script file
      try {
        fs.unlinkSync(scriptPath)
      } catch (e) {
        console.warn('Could not delete script file:', e.message)
      }
      
      if (error) {
        console.error('PowerShell print error:', error)
        console.error('stderr:', stderr)
        console.error('stdout:', stdout)
        reject(new Error(`Failed to print: ${stderr || error.message}`))
      } else {
        console.log('PowerShell print output:', stdout)
        if (stderr) console.log('PowerShell stderr:', stderr)
        resolve({ success: true })
      }
    })
  })
}

// Print receipt to thermal printer using hidden BrowserWindow
ipcMain.handle('print-thermal-receipt', async (event, receiptData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const printers = await mainWindow.webContents.getPrintersAsync()
      
      // Find thermal printer
      let targetPrinter = null
      
      // If a specific printer is requested, use it
      if (receiptData.printerName) {
        targetPrinter = printers.find(p => p.name === receiptData.printerName)
      }
      
      // If no specific printer, look for thermal printers
      if (!targetPrinter) {
        const thermalPrinters = printers.filter(p => {
          const name = p.name.toLowerCase()
          // Expanded keywords for better Linux printer detection
          return name.includes('thermal') || name.includes('pos') || 
                 name.includes('receipt') || name.includes('58mm') ||
                 name.includes('80mm') || name.includes('xprinter') ||
                 name.includes('epson') || name.includes('star') ||
                 name.includes('rpp') || name.includes('xp-') || name.includes('x-') ||
                 name.includes('cups') || name.includes('usb') ||
                 name.includes('tm-') || name.includes('tsp') // Common thermal printer prefixes
        })
        
        targetPrinter = thermalPrinters[0] || printers.find(p => p.isDefault) || printers[0]
      }
      
      if (!targetPrinter) {
        return reject(new Error('No printer found'))
      }
      
      console.log(`Printing to: ${targetPrinter.name}`)
      console.log('Receipt data:', JSON.stringify(receiptData, null, 2))
      
      // Handle test print - minimal output
      if (receiptData.isTestPrint) {
        const printWindow = new BrowserWindow({
          width: 220,
          height: 400,
          show: false, // Start hidden to prevent preview from showing
          skipTaskbar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        })
        
        const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            html, body {
              overflow: hidden;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            html::-webkit-scrollbar, body::-webkit-scrollbar {
              display: none;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 24px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
              width: 48mm;
            }
          </style>
        </head>
        <body>
          <div>TEST PRINT</div>
        </body>
        </html>
        `
        
        printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(testHTML))
        
        printWindow.webContents.on('did-finish-load', () => {
          setTimeout(async () => {
            // Linux: Use ESC/POS direct printing
            if (process.platform === 'linux') {
              try {
                printWindow.close()
                
                // Generate simple ESC/POS test print with robust init
                const buffers = []
                // Robust initialization sequence
                buffers.push(ESCPOS.CANCEL)
                buffers.push(ESCPOS.INIT)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.INIT)
                buffers.push(ESCPOS.NORMAL_SIZE)
                buffers.push(ESCPOS.BOLD_OFF)
                buffers.push(ESCPOS.ALIGN_CENTER)
                buffers.push(ESCPOS.BOLD_ON)
                buffers.push(ESCPOS.DOUBLE_SIZE_ON)
                buffers.push(escposText('TEST PRINT'))
                buffers.push(ESCPOS.NORMAL_SIZE)
                buffers.push(ESCPOS.BOLD_OFF)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(escposText('Printer is working!'))
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(escposText(new Date().toLocaleString()))
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.FEED_AND_CUT)
                
                const escposData = Buffer.concat(buffers)
                await printViaEscPos(targetPrinter.name, escposData)
                
                resolve({ success: true, printer: targetPrinter.name, mode: 'escpos' })
              } catch (error) {
                console.error('ESC/POS test print failed:', error)
                reject(error)
              }
              return
            }
            
            // Windows: Use ESC/POS direct printing
            if (process.platform === 'win32') {
              try {
                printWindow.close()
                
                // Generate simple ESC/POS test print with robust init
                const buffers = []
                // Robust initialization sequence
                buffers.push(ESCPOS.CANCEL)
                buffers.push(ESCPOS.INIT)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.INIT)
                buffers.push(ESCPOS.NORMAL_SIZE)
                buffers.push(ESCPOS.BOLD_OFF)
                buffers.push(ESCPOS.ALIGN_CENTER)
                buffers.push(ESCPOS.BOLD_ON)
                buffers.push(ESCPOS.DOUBLE_SIZE_ON)
                buffers.push(escposText('TEST PRINT'))
                buffers.push(ESCPOS.NORMAL_SIZE)
                buffers.push(ESCPOS.BOLD_OFF)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(escposText('Printer is working!'))
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(escposText(new Date().toLocaleString()))
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.LINE_FEED)
                buffers.push(ESCPOS.FEED_AND_CUT)
                
                const escposData = Buffer.concat(buffers)
                await printViaEscPosWindows(targetPrinter.name, escposData)
                
                resolve({ success: true, printer: targetPrinter.name, mode: 'escpos' })
              } catch (error) {
                console.error('ESC/POS test print failed:', error)
                reject(error)
              }
              return
            }
            
            // Mac: Use native Electron printing (fallback)
            const printOptions = {
              silent: true,
              printBackground: true,
              color: false,
              deviceName: targetPrinter.name,
              copies: 1,
              landscape: false,
              margins: { 
                marginType: 'none'
              },
              pageSize: { 
                width: 58000,  // 58mm in microns
                height: 100000 // 100mm for test print
              },
              scaleFactor: 100
            }
            
            printWindow.webContents.print(printOptions, (success, errorType) => {
              printWindow.close()
              if (success) {
                resolve({ success: true, printer: targetPrinter.name })
              } else {
                reject(new Error(errorType || 'Print failed'))
              }
            })
          }, 1000)
        })
        
        return
      }
      
      // Generate barcode as base64 image (if transaction ID exists)
      let barcodeBase64 = ''
      if (receiptData.transactionId) {
        try {
          const png = await bwipjs.toBuffer({
            bcid: 'code128',
            text: String(receiptData.transactionId),
            scale: 3,
            height: 10,
            includetext: false
          })
          barcodeBase64 = `data:image/png;base64,${png.toString('base64')}`
          console.log('Barcode generated successfully')
        } catch (barcodeError) {
          console.error('Barcode generation error:', barcodeError)
          barcodeBase64 = '' // Fallback to no barcode
        }
      }
      
      // Create print window
      const printWindow = new BrowserWindow({
        width: 220, // 58mm ≈ 220px at 96 DPI
        height: 1200,
        show: false, // Start hidden to prevent preview from showing
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })
      
      // Generate HTML receipt based on type
      let receiptHTML = ''
      
      // Check receipt type - sales report first, then refund, then sales, then customer transaction
      if (receiptData.transactionType === 'Sales Report') {
        // Sales Report Receipt
        console.log('Generating sales report receipt')
        
        let productsHTML = ''
        if (receiptData.products && receiptData.products.length > 0) {
          receiptData.products.forEach(product => {
            const unitPrice = product.quantitySold > 0 ? product.totalSales / product.quantitySold : 0
            productsHTML += `
            <div class="item-block">
              <div class="item-name">${product.name}</div>
              <div class="item-line">
                <span>x${product.quantitySold}</span>
                <span>₱${unitPrice.toFixed(2)}</span>
                <span class="item-total">₱${product.totalSales.toFixed(2)}</span>
              </div>
            </div>
            `
          })
        }

        receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              overflow: hidden;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            html::-webkit-scrollbar, body::-webkit-scrollbar {
              display: none;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              padding: 5px;
              padding-bottom: 40px;
              width: 48mm;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .large {
              font-size: 14px;
            }
            .line {
              margin: 5px 0;
            }
            .divider {
              text-align: center;
              margin: 3px 0;
            }
            .item-block {
              margin: 5px 0;
            }
            .item-name {
              font-weight: bold;
              font-size: 9px;
              margin-bottom: 2px;
            }
            .item-line {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              gap: 5px;
            }
            .item-line span:nth-child(1) {
              flex: 0 0 auto;
            }
            .item-line span:nth-child(2) {
              flex: 1 1 auto;
              text-align: center;
            }
            .item-total {
              flex: 0 0 auto;
              text-align: right;
              font-weight: bold;
            }
            .summary-box {
              border: 1px solid #000;
              padding: 5px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="center bold large">POSXPRESS</div>
          ${receiptData.storeName ? `<div class="center bold">${receiptData.storeName}</div>` : ''}
          ${receiptData.address ? `<div class="center" style="font-size: 9px;">${receiptData.address}</div>` : ''}
          ${receiptData.contact ? `<div class="center" style="font-size: 9px;">Tel: ${receiptData.contact}</div>` : ''}
          ${receiptData.tin ? `<div class="center" style="font-size: 9px;">TIN: ${receiptData.tin}</div>` : ''}
          <div class="divider">================================</div>
          <div class="center bold large">SALES REPORT</div>
          <div class="divider">================================</div>
          <div class="line">Date: ${new Date(receiptData.date).toLocaleString()}</div>
          ${receiptData.sessionStartedAt ? `
          <div class="divider">- - - - - - - - - - - - - - - -</div>
          <div class="line bold">Session Start: ${new Date(receiptData.sessionStartedAt).toLocaleString()}</div>
          ${receiptData.sessionActive 
            ? `<div class="line bold">Current Time: ${new Date().toLocaleString()}</div>` 
            : receiptData.sessionEndedAt 
              ? `<div class="line bold">Session End: ${new Date(receiptData.sessionEndedAt).toLocaleString()}</div>` 
              : ''}
          ` : ''}
          <div class="divider">================================</div>
          
          <div class="summary-box">
            <div class="line bold">Total Sales: ₱${receiptData.summary.todaySales.toFixed(2)}</div>
            <div class="line bold">Total Profit: ₱${receiptData.summary.totalProfit.toFixed(2)}</div>
            <div class="line bold">Products Sold: ${receiptData.summary.totalProductsSold}</div>
          </div>
          
          <div class="divider">================================</div>
          <div class="center bold">PRODUCT BREAKDOWN</div>
          <div class="divider">================================</div>
          
          ${productsHTML}
          
          <div class="divider">================================</div>
          <div class="center bold" style="margin-top: 10px;">End of Report</div>
          <div style="height: 30px;"></div>
        </body>
        </html>
        `
      } else if (receiptData.type === 'refund') {
        console.log('Generating refund receipt')
        
        // Calculate VAT breakdown for refund
        let vatableSales = 0
        let vatAmount = 0
        let vatExemptSales = 0
        
        receiptData.items.forEach(item => {
          const basePrice = item.price
          const quantity = item.quantity
          const itemTotal = basePrice * quantity
          
          if (item.isVattable) {
            vatableSales += itemTotal
            
            if (receiptData.vatConfig) {
              if (receiptData.vatConfig.type === 'percent') {
                vatAmount += itemTotal * (receiptData.vatConfig.value / 100)
              } else if (receiptData.vatConfig.type === 'fixed') {
                vatAmount += receiptData.vatConfig.value * quantity
              }
            }
          } else {
            vatExemptSales += itemTotal
          }
          
          if (item.addons && item.addons.length > 0) {
            item.addons.forEach(addon => {
              vatExemptSales += addon.price * addon.quantity
            })
          }
        })
        
        // Refund Receipt
        let refundItemsHTML = ''
        receiptData.items.forEach(item => {
          refundItemsHTML += `
          <div class="item-block">
            <div class="item-name">${item.name}${item.isVattable ? ' (VAT)' : ''}</div>
            <div class="item-line">
              <span>x${item.quantity}</span>
              <span>₱${item.price.toFixed(2)}</span>
              <span class="item-total">₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
          `
        })

        receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              overflow: hidden;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            html::-webkit-scrollbar, body::-webkit-scrollbar {
              display: none;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              width: 48mm;
              padding: 5mm;
              line-height: 1.4;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .large {
              font-size: 14px;
            }
            .divider {
              text-align: center;
              margin: 5px 0;
            }
            .line {
              margin: 3px 0;
            }
            .item-block {
              margin: 5px 0;
            }
            .item-name {
              font-weight: bold;
              font-size: 9px;
              margin-bottom: 2px;
            }
            .item-line {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              gap: 5px;
            }
            .item-line span:nth-child(1) {
              flex: 0 0 auto;
            }
            .item-line span:nth-child(2) {
              flex: 1 1 auto;
              text-align: center;
            }
            .item-total {
              flex: 0 0 auto;
              text-align: right;
              font-weight: bold;
            }
            .barcode {
              text-align: center;
              margin: 10px 0;
            }
            .barcode img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="center bold large">POSXPRESS</div>
          ${receiptData.storeName ? `<div class="center bold">${receiptData.storeName}</div>` : ''}
          ${receiptData.address ? `<div class="center" style="font-size: 9px;">${receiptData.address}</div>` : ''}
          ${receiptData.contact ? `<div class="center" style="font-size: 9px;">Tel: ${receiptData.contact}</div>` : ''}
          ${receiptData.tin ? `<div class="center" style="font-size: 9px;">TIN: ${receiptData.tin}</div>` : ''}
          <div class="center bold" style="margin-top: 10px;">REFUND RECEIPT</div>
          <div class="divider">================================</div>
          <div class="center bold">Refund ID</div>
          <div class="center bold">${receiptData.transactionId}</div>
          <div class="divider">================================</div>
          <div class="line">Date: ${new Date(receiptData.date).toLocaleString()}</div>
          <div class="line">Original Transaction: ${receiptData.originalTransactionId}</div>
          ${receiptData.customer ? `<div class="line">Customer: ${receiptData.customer.fullName}</div>` : ''}
          <div class="line">Cashier: ${receiptData.cashier || 'N/A'}</div>
          <div class="divider">================================</div>
          <div class="line bold">REFUNDED ITEMS:</div>
          ${refundItemsHTML}
          <div class="divider">================================</div>
          ${vatableSales > 0 || vatExemptSales > 0 ? `
          <div class="line" style="display: flex; justify-content: space-between;">
            <span>VATABLE SALES</span>
            <span>₱${vatableSales.toFixed(2)}</span>
          </div>
          ${vatAmount > 0 ? `
          <div class="line" style="display: flex; justify-content: space-between;">
            <span>VAT ${receiptData.vatConfig?.type === 'percent' ? `(${receiptData.vatConfig.value}%)` : ''}</span>
            <span>₱${vatAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="line" style="display: flex; justify-content: space-between;">
            <span>VAT-EXEMPT SALES</span>
            <span>₱${vatExemptSales.toFixed(2)}</span>
          </div>
          <div class="divider">================================</div>
          ` : ''}
          <div class="line bold" style="display: flex; justify-content: space-between;">
            <span>REFUND AMOUNT:</span>
            <span>₱${receiptData.refundAmount.toFixed(2)}</span>
          </div>
          <div class="line">Payment Method: ${receiptData.paymentMethod}</div>
          ${receiptData.paymentMethod === 'E-wallet' && receiptData.customer ? `
          <div class="line bold">Refunded to account</div>
          ` : ''}
          <div class="divider">================================</div>
          <div class="center bold" style="margin-top: 10px;">Refund Processed</div>
          <div class="center" style="margin-top: 5px;">Thank you!</div>
          <div style="height: 30px;"></div>
        </body>
        </html>
        `
      } else if (receiptData.cart && receiptData.cart.length > 0) {
        console.log('Generating sales receipt')
        
        // Sales Receipt
        // Calculate VAT breakdown
        let vatableSales = 0
        let vatAmount = 0
        let vatExemptSales = 0
        
        receiptData.cart.forEach(item => {
          const basePrice = item.price
          const quantity = item.quantity
          const itemTotal = basePrice * quantity
          
          if (item.isVattable) {
            // Calculate vatable sales (base price before VAT)
            vatableSales += itemTotal
            
            // Calculate VAT amount based on config
            if (receiptData.vatConfig) {
              if (receiptData.vatConfig.type === 'percent') {
                vatAmount += itemTotal * (receiptData.vatConfig.value / 100)
              } else if (receiptData.vatConfig.type === 'fixed') {
                vatAmount += receiptData.vatConfig.value * quantity
              }
            }
          } else {
            vatExemptSales += itemTotal
          }
          
          // Add addon prices to VAT-exempt
          if (item.addons && item.addons.length > 0) {
            item.addons.forEach(addon => {
              vatExemptSales += addon.price * addon.quantity
            })
          }
        })
        
        const cartItemsHTML = receiptData.cart.map(item => `
          <div class="item-block">
            <div class="item-name">${item.name}${item.isVattable ? ' (VAT)' : ''}</div>
            <div class="item-line">
              <span>x${item.quantity}</span>
              <span>₱${item.price.toFixed(2)}</span>
              <span class="item-total">₱${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            ${item.addons && item.addons.length > 0 ? item.addons.map(addon => `
              <div class="addon-line">
                <span>+ ${addon.name}</span>
                <span>x${addon.quantity}</span>
                <span>₱${addon.price.toFixed(2)}</span>
                <span class="addon-total">₱${(addon.price * addon.quantity).toFixed(2)}</span>
              </div>
            `).join('') : ''}
          </div>
        `).join('')
        
        receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              overflow: hidden;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            html::-webkit-scrollbar, body::-webkit-scrollbar {
              display: none;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              padding: 5px;
              padding-bottom: 40px;
              width: 48mm;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .large {
              font-size: 14px;
            }
            .line {
              margin: 3px 0;
              font-size: 9px;
            }
            .item-block {
              margin: 5px 0;
            }
            .item-name {
              font-weight: bold;
              font-size: 9px;
              margin-bottom: 2px;
            }
            .item-line {
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              gap: 5px;
            }
            .item-line span:nth-child(1) {
              flex: 0 0 auto;
            }
            .item-line span:nth-child(2) {
              flex: 1 1 auto;
              text-align: center;
            }
            .item-total {
              flex: 0 0 auto;
              text-align: right;
              font-weight: bold;
            }
            .addon-line {
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              font-style: italic;
              color: #555;
              padding-left: 5px;
              gap: 3px;
            }
            .addon-line span:nth-child(1) {
              flex: 1 1 auto;
            }
            .addon-line span:nth-child(2) {
              flex: 0 0 auto;
            }
            .addon-line span:nth-child(3) {
              flex: 0 0 auto;
              text-align: center;
            }
            .addon-total {
              flex: 0 0 auto;
              text-align: right;
            }
            .divider {
              text-align: center;
              margin: 3px 0;
            }
            .barcode {
              text-align: center;
              margin: 10px 0;
            }
            .barcode img {
              width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="center bold large">POSXPRESS</div>
          ${receiptData.storeName ? `<div class="center bold">${receiptData.storeName}</div>` : ''}
          ${receiptData.address ? `<div class="center" style="font-size: 9px;">${receiptData.address}</div>` : ''}
          ${receiptData.contact ? `<div class="center" style="font-size: 9px;">Tel: ${receiptData.contact}</div>` : ''}
          ${receiptData.tin ? `<div class="center" style="font-size: 9px;">TIN: ${receiptData.tin}</div>` : ''}
          <div class="center">Sales Receipt</div>
          <div class="divider">================================</div>
          <div class="center bold">Transaction ID</div>
          <div class="center bold">${receiptData.transactionId}</div>
          ${barcodeBase64 ? `<div class="barcode"><img src="${barcodeBase64}" alt="Barcode" /></div>` : ''}
          <div class="divider">================================</div>
          <div class="line">Date: ${new Date(receiptData.date).toLocaleString()}</div>
          ${receiptData.customerName ? `<div class="line">Customer: ${receiptData.customerName}</div>` : ''}
          <div class="line">Cashier: ${receiptData.employee || 'N/A'}</div>
          <div class="divider">================================</div>
          <div class="line bold">ITEMS:</div>
          ${cartItemsHTML}
          <div class="divider">================================</div>
          ${vatableSales > 0 || vatExemptSales > 0 ? `
          <div class="line" style="display: flex; justify-content: space-between;">
            <span>VATABLE SALES</span>
            <span>₱${vatableSales.toFixed(2)}</span>
          </div>
          ${vatAmount > 0 ? `
          <div class="line" style="display: flex; justify-content: space-between;">
            <span>VAT ${receiptData.vatConfig?.type === 'percent' ? `(${receiptData.vatConfig.value}%)` : ''}</span>
            <span>₱${vatAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="line" style="display: flex; justify-content: space-between;">
            <span>VAT-EXEMPT SALES</span>
            <span>₱${vatExemptSales.toFixed(2)}</span>
          </div>
          <div class="divider">================================</div>
          ` : ''}
          <div class="line bold" style="display: flex; justify-content: space-between;">
            <span>TOTAL:</span>
            <span>₱${receiptData.totalAmount.toFixed(2)}</span>
          </div>
          <div class="line">Payment: ${receiptData.paymentMethod}</div>
          ${receiptData.cash > 0 ? `
          <div class="line" style="display: flex; justify-content: space-between;"><span>Cash:</span><span>₱${receiptData.cash.toFixed(2)}</span></div>
          <div class="line" style="display: flex; justify-content: space-between;"><span>Change:</span><span>₱${receiptData.change.toFixed(2)}</span></div>
          ` : ''}
          ${receiptData.paymentMethod === 'E-wallet/RFID' && receiptData.previousBalance !== undefined ? `
          <div class="divider">- - - - - - - - - - - - - - - -</div>
          <div class="line" style="display: flex; justify-content: space-between;"><span>Previous Balance:</span><span>₱${receiptData.previousBalance.toFixed(2)}</span></div>
          <div class="line" style="display: flex; justify-content: space-between;"><span>Amount Paid:</span><span>₱${receiptData.totalAmount.toFixed(2)}</span></div>
          <div class="line bold" style="display: flex; justify-content: space-between;"><span>Remaining Balance:</span><span>₱${receiptData.remainingBalance.toFixed(2)}</span></div>
          ` : ''}
          <div class="divider">================================</div>
          <div class="center bold" style="margin-top: 10px;">Thank you!</div>
          <div class="center" style="margin-top: 5px;">Please come again</div>
          <div style="height: 30px;"></div>
        </body>
        </html>
        `
      } else {
        // Customer Transaction Receipt (Cash-in, Balance inquiry, etc.)
        receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              overflow: hidden;
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            html::-webkit-scrollbar, body::-webkit-scrollbar {
              display: none;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              padding: 5px;
              padding-bottom: 40px;
              width: 48mm;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .large {
              font-size: 14px;
            }
            .line {
              margin: 5px 0;
            }
            .divider {
              text-align: center;
              margin: 3px 0;
            }
          </style>
        </head>
        <body>
          <div class="center bold large">POSXPRESS</div>
          ${receiptData.storeName ? `<div class="center bold">${receiptData.storeName}</div>` : ''}
          ${receiptData.address ? `<div class="center" style="font-size: 9px;">${receiptData.address}</div>` : ''}
          ${receiptData.contact ? `<div class="center" style="font-size: 9px;">Tel: ${receiptData.contact}</div>` : ''}
          ${receiptData.tin ? `<div class="center" style="font-size: 9px;">TIN: ${receiptData.tin}</div>` : ''}
          <div class="center">Customer Transaction</div>
          <div class="divider">================================</div>
          <div class="center bold">${receiptData.transactionType ? receiptData.transactionType.toUpperCase() : 'TRANSACTION'}</div>
          <div class="divider">================================</div>
          ${receiptData.transactionId ? `<div class="center" style="font-size: 9px; margin: 5px 0;">Ref No: ${receiptData.transactionId}</div>` : ''}
          <div class="line">Date: ${new Date(receiptData.date).toLocaleString()}</div>
          <div class="line">Customer: ${receiptData.customerName || 'N/A'}</div>
          <div class="divider">================================</div>
          <div class="line">Previous Balance:</div>
          <div class="line bold">  PHP ${(receiptData.previousBalance || 0).toFixed(2)}</div>
          ${(receiptData.amount || 0) > 0 ? `
          <div class="line">${receiptData.transactionType && receiptData.transactionType.includes('CASH-IN') ? 'Amount Added:' : 'Amount Withdrawn:'}</div>
          <div class="line bold">  PHP ${(receiptData.amount || 0).toFixed(2)}</div>
          ` : ''}
          <div class="line">Remaining Balance:</div>
          <div class="line bold">  PHP ${(receiptData.currentBalance || 0).toFixed(2)}</div>
          <div class="divider">================================</div>
          <div class="center bold" style="margin-top: 10px;">Thank you!</div>
          <div style="height: 30px;"></div>
        </body>
        </html>
        `
      }
      
      // Load HTML in browser window for rendering
      printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHTML))
      
      printWindow.webContents.on('did-finish-load', () => {
        console.log('Print window loaded, preparing to print...')
        
        // Delay to ensure content is rendered
        setTimeout(async () => {
          console.log('Attempting to print...')
          console.log(`Platform: ${process.platform}`)
          
          // Linux: Use ESC/POS direct printing for best thermal printer compatibility
          if (process.platform === 'linux') {
            try {
              console.log('Linux detected - using ESC/POS direct printing')
              
              printWindow.close()
              
              // Generate ESC/POS receipt data
              const escposData = generateEscPosReceipt(receiptData)
              console.log('ESC/POS receipt generated, size:', escposData.length, 'bytes')
              
              // Send to printer
              await printViaEscPos(targetPrinter.name, escposData)
              
              console.log('✓ Printed successfully via ESC/POS')
              resolve({ success: true, printer: targetPrinter.name, mode: 'escpos', platform: process.platform })
              
            } catch (error) {
              if (printWindow && !printWindow.isDestroyed()) printWindow.close()
              console.error('ESC/POS printing failed:', error)
              reject(new Error('ESC/POS printing failed: ' + error.message))
            }
            return
          }
          
          // Windows: Use ESC/POS direct printing
          if (process.platform === 'win32') {
            try {
              console.log('Windows detected - using ESC/POS direct printing')
              
              printWindow.close()
              
              // Generate ESC/POS receipt data
              const escposData = generateEscPosReceipt(receiptData)
              console.log('ESC/POS receipt generated, size:', escposData.length, 'bytes')
              
              // Send to printer via Windows raw printing
              await printViaEscPosWindows(targetPrinter.name, escposData)
              
              console.log('✓ Printed successfully via ESC/POS')
              resolve({ success: true, printer: targetPrinter.name, mode: 'escpos', platform: process.platform })
              
            } catch (error) {
              if (printWindow && !printWindow.isDestroyed()) printWindow.close()
              console.error('ESC/POS printing failed:', error)
              reject(new Error('ESC/POS printing failed: ' + error.message))
            }
            return
          }
          
          // Mac: Use native Electron silent print (fallback)
          console.log('Using Electron native silent printing')
          
          const printOptions = {
            silent: true,
            printBackground: true,
            color: false,
            deviceName: targetPrinter.name,
            copies: 1,
            landscape: false,
            margins: { 
              marginType: 'none'
            },
            pageSize: {
              width: 58000, // 58mm in microns
              height: 297000 // A4 height - will auto-cut on thermal printers
            },
            scaleFactor: 100
          }
          
          console.log('Printing with options:', JSON.stringify(printOptions, null, 2))
          
          printWindow.webContents.print(printOptions, (success, errorType) => {
            console.log('Print callback - Success:', success, 'ErrorType:', errorType)
            printWindow.close()
            
            if (success) {
              console.log('✓ Printed successfully via Electron silent print')
              resolve({ success: true, printer: targetPrinter.name, mode: 'electron', platform: process.platform })
            } else {
              console.error('Print failed:', errorType)
              reject(new Error(errorType || 'Print failed'))
            }
          })
        }, 1500)
      })
      
      printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        printWindow.close()
        reject(new Error(`Failed to load print content: ${errorDescription}`))
      })
      
    } catch (error) {
      console.error('Print error:', error)
      reject(error)
    }
  })
})
