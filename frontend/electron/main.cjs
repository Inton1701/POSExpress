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

// Helper function to print via CUPS on Linux (using lp command)
async function printViaCUPS(printerName, imagePath) {
  return new Promise((resolve, reject) => {
    // CUPS print command for thermal printer - PNG format
    // Key options:
    // -o fit-to-page: Scale image to fit paper width (maintains aspect ratio)
    // -o media=Custom.58x3000mm: 58mm width, very long height for receipts
    // -o page-left=0 page-right=0 page-top=0 page-bottom=0: No margins
    // -o orientation-requested=3: Portrait orientation (3=portrait, 4=landscape)
    const printCommand = `lp -d "${printerName}" -o fit-to-page -o media=Custom.58x3000mm -o page-left=0 -o page-right=0 -o page-top=0 -o page-bottom=0 -o orientation-requested=3 "${imagePath}"`
    
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
          width: 465, // 58mm at 203 DPI
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
              width: 58mm;
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
            if (process.platform === 'linux') {
              try {
                // Get content dimensions
                const contentHeight = await printWindow.webContents.executeJavaScript('document.body.scrollHeight')
                const contentWidth = 465 // 58mm at 203 DPI
                
                // Resize to fit content (full height)
                printWindow.setSize(contentWidth, contentHeight + 20)
                
                // Wait for resize
                await new Promise(resolve => setTimeout(resolve, 300))
                
                // Capture with specific rect to avoid scrollbars
                const captureRect = {
                  x: 0,
                  y: 0,
                  width: contentWidth,
                  height: contentHeight // Capture full height
                }
                const image = await printWindow.webContents.capturePage(captureRect)
                const pngBuffer = image.toPNG()
                printWindow.close()
                
                const tempImageFile = path.join(os.tmpdir(), `test-print-${Date.now()}.png`)
                fs.writeFileSync(tempImageFile, pngBuffer)
                
                await printViaCUPS(targetPrinter.name, tempImageFile)
                
                setTimeout(() => {
                  try { fs.unlinkSync(tempImageFile) } catch(e) {}
                }, 10000)
                
                resolve({ success: true, printer: targetPrinter.name })
              } catch (error) {
                if (printWindow && !printWindow.isDestroyed()) printWindow.close()
                reject(error)
              }
            } else {
              const printOptions = {
                silent: true,
                deviceName: targetPrinter.name,
                pageSize: { width: 58000, height: 100000 }
              }
              
              printWindow.webContents.print(printOptions, (success, errorType) => {
                printWindow.close()
                if (success) {
                  resolve({ success: true, printer: targetPrinter.name })
                } else {
                  reject(new Error(errorType || 'Print failed'))
                }
              })
            }
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
        width: 465, // 58mm at 203 DPI (thermal printer resolution: 8 dots/mm * 58mm = 464px)
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
              width: 58mm;
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
              width: 58mm;
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
              width: 58mm;
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
              width: 58mm;
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
        
        // Longer delay to ensure content is rendered, especially on Windows
        setTimeout(async () => {
          console.log('Attempting to print...')
          
          // PNG-based printing for Linux only
          if (process.platform === 'linux') {
            // Get the actual content height to avoid capturing scrollbars
            const contentHeight = await printWindow.webContents.executeJavaScript('document.body.scrollHeight')
            const contentWidth = 465 // 58mm at 203 DPI (thermal printer resolution)
            
            console.log(`Content dimensions: ${contentWidth}x${contentHeight}px`)
            
            // Resize window to exact content size to prevent scrollbars (no height limit)
            printWindow.setSize(contentWidth, contentHeight + 20)
            try {
              console.log('Linux detected - using PNG printing workflow')
              
              // Step 1: Wait for content to render while hidden
              console.log('Waiting for content to render (hidden)...')
              await new Promise(resolve => setTimeout(resolve, 1500))
              
              // Step 2: Capture screenshot as PNG (window can stay hidden)
              console.log('Capturing receipt as PNG...')
              // Specify exact capture rect to avoid any scrollbars
              const captureRect = {
                x: 0,
                y: 0,
                width: contentWidth,
                height: contentHeight // Capture full content height
              }
              const image = await printWindow.webContents.capturePage(captureRect)
              const pngBuffer = image.toPNG()
              console.log('PNG captured, size:', pngBuffer.length, 'bytes')
              
              printWindow.close()
              
              // Step 3: Save to disk
              const tempImageFile = path.join(os.tmpdir(), `receipt-${Date.now()}.png`)
              fs.writeFileSync(tempImageFile, pngBuffer)
              console.log('PNG saved to:', tempImageFile)
              
              // Step 4: Print via CUPS
              console.log('Printing to:', targetPrinter.name)
              await printViaCUPS(targetPrinter.name, tempImageFile)
              
              // Step 5: Keep temp file for debugging (delete after 10 seconds)
              setTimeout(() => {
                try { 
                  fs.unlinkSync(tempImageFile)
                  console.log('Temp file cleaned up')
                } catch(e) {
                  console.warn('Could not delete temp file:', e.message)
                }
              }, 10000)
              
              console.log('✓ Printed successfully via PNG printing')
              resolve({ success: true, printer: targetPrinter.name, mode: 'png', platform: process.platform })
              
            } catch (error) {
              if (printWindow && !printWindow.isDestroyed()) {
                printWindow.close()
              }
              console.error('PNG printing failed:', error)
              reject(new Error('PNG printing failed: ' + error.message))
            }
            return
          }
          
          // Windows/Mac: Use standard Electron silent print API
          console.log(`${process.platform} detected - using Electron silent printing`)
          
          // Try to generate PDF first to ensure content is rendered
          try {
            const pdfData = await printWindow.webContents.printToPDF({
              pageSize: 'A4',
              printBackground: true,
              margins: {
                marginType: 'none'
              }
            })
            console.log('PDF generated successfully, size:', pdfData.length, 'bytes')
          } catch (pdfError) {
            console.warn('PDF test failed:', pdfError.message)
          }
          
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
              height: 297000 // A4 height
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
        }, 2000) // Increased from 1000ms to 2000ms
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
