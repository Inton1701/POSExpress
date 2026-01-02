const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { exec } = require('child_process')
const bwipjs = require('bwip-js')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  // Set global API URL before loading the app
  global.API_URL = process.env.API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : 'http://localhost:5000/api')

  // Load your Vue app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools() // Open dev tools in development
  } else {
    // In production, load from dist folder
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    
    // Check if running from AppImage or portable executable
    const isAppImage = process.env.APPIMAGE
    const isPortable = process.env.PORTABLE_EXECUTABLE_DIR
    
    // For packaged app, set API URL based on environment
    if (isAppImage || isPortable || process.platform === 'linux' || process.platform === 'win32') {
      global.API_URL = process.env.API_URL || 'http://localhost:5000/api'
    }
  }

  // Inject API URL into preload
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.__APP_CONFIG__ = {
        API_URL: '${global.API_URL}'
      }
    `).catch(() => {}) // Ignore errors from this injection
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

// Helper function to print via CUPS on Linux (using lp command)
async function printViaCUPS(printerName, imagePath) {
  return new Promise((resolve, reject) => {
    // Simple CUPS print command
    const printCommand = `lp -d "${printerName}" -o fit-to-page "${imagePath}"`
    
    console.log('Executing CUPS command:', printCommand)
    
    exec(printCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('CUPS print error:', error)
        console.error('stderr:', stderr)
        reject(error)
      } else {
        console.log('CUPS output:', stdout)
        if (stderr) console.log('CUPS stderr:', stderr)
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
      
      // Create print window (only needed for Windows/Mac)
      const printWindow = new BrowserWindow({
        width: 182, // 48mm ≈ 182px
        height: 800,
        show: false,
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
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.3;
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
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
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
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              width: 80mm;
              padding: 5mm;
              line-height: 1.3;
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
          <div class="center" style="margin-top: 15px; font-size: 9px;">Powered by POSEXPRESS</div>
          <div style="height: 30px;"></div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
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
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.3;
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
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
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
            body {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              line-height: 1.3;
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
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
          <div class="center">.</div>
        </body>
        </html>
        `
      }
      
      // Load HTML in browser window for rendering
      printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(receiptHTML))
      
      printWindow.webContents.on('did-finish-load', () => {
        console.log('Print window loaded, preparing to print...')
        
        // Small delay to ensure content is rendered
        setTimeout(async () => {
          console.log('Attempting to print...')
          
          // Linux-specific: Generate PDF and print via CUPS
          if (process.platform === 'linux') {
            try {
              console.log('Linux detected - using CUPS printing workflow')
              
              // Step 1: Generate PDF from rendered HTML
              console.log('Generating PDF from receipt...')
              const pdfData = await printWindow.webContents.printToPDF({
                pageSize: {
                  width: 48000, // 48mm in microns
                  height: 297000 // 297mm height
                },
                printBackground: true,
                margins: {
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0
                }
              })
              
              printWindow.close()
              
              // Step 2: Save to disk (file must exist for CUPS)
              const tempPdfFile = path.join(os.tmpdir(), `receipt-${Date.now()}.pdf`)
              fs.writeFileSync(tempPdfFile, pdfData)
              console.log('PDF saved to:', tempPdfFile)
              
              // Step 3: Print via CUPS lp command
              console.log('Printing to:', targetPrinter.name)
              await printViaCUPS(targetPrinter.name, tempPdfFile)
              
              // Step 4: Clean up temp file
              try { 
                fs.unlinkSync(tempPdfFile)
                console.log('Temp file cleaned up')
              } catch(e) {
                console.warn('Could not delete temp file:', e.message)
              }
              
              console.log('✓ Printed successfully via CUPS')
              resolve({ success: true, printer: targetPrinter.name, mode: 'cups-pdf', platform: process.platform })
              
            } catch (error) {
              printWindow.close()
              console.error('CUPS printing failed:', error)
              reject(new Error('CUPS printing failed: ' + error.message))
            }
            return
          }
          
          // Windows/Mac: Use standard Electron print API
          const printOptions = {
            silent: true,
            printBackground: true,
            deviceName: targetPrinter.name,
            copies: 1,
            margins: { marginType: 'none' },
            pageSize: {
              width: 48000, // 48mm in microns
              height: 999999 // Dynamic height for continuous roll
            },
            scaleFactor: 100
          }
          
          printWindow.webContents.print(printOptions, (success, errorType) => {
            console.log('Print callback - Success:', success, 'ErrorType:', errorType)
            printWindow.close()
            
            if (success) {
              console.log('✓ Printed successfully')
              resolve({ success: true, printer: targetPrinter.name, mode: 'electron', platform: process.platform })
            } else {
              console.error('Print failed:', errorType)
              reject(new Error(errorType || 'Print failed'))
            }
          })
        }, 1000)
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
