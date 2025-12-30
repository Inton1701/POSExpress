# Electron Integration for Direct Thermal Printing

This guide shows how to integrate Electron to enable direct thermal printing without dialogs.

## Why Electron?

- ✅ Silent printing (no dialogs)
- ✅ Auto-detect thermal printers
- ✅ Direct USB/network printer access
- ✅ Works offline
- ✅ Native desktop app experience

## Setup Steps

### 1. Install Electron Dependencies

```bash
cd frontend
npm install electron electron-builder --save-dev
npm install electron-pos-printer --save
```

### 2. Create Electron Main Process

Create `frontend/electron/main.js`:

```javascript
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { PosPrinter } = require('electron-pos-printer')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load your Vue app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
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
  const printers = mainWindow.webContents.getPrinters()
  
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
           name.includes('xprinter')
  })
  
  return {
    allPrinters: printers,
    thermalPrinters: thermalPrinters,
    defaultPrinter: printers.find(p => p.isDefault)
  }
})

// Print receipt to thermal printer
ipcMain.handle('print-thermal-receipt', async (event, receiptData) => {
  try {
    const printers = mainWindow.webContents.getPrinters()
    
    // Find thermal printer (use default if it's thermal, otherwise use first thermal)
    let targetPrinter = printers.find(p => p.isDefault)
    
    const thermalPrinters = printers.filter(p => {
      const name = p.name.toLowerCase()
      return name.includes('thermal') || name.includes('pos') || 
             name.includes('receipt') || name.includes('58mm') ||
             name.includes('80mm') || name.includes('xprinter')
    })
    
    if (thermalPrinters.length > 0 && !targetPrinter.name.toLowerCase().includes('thermal')) {
      targetPrinter = thermalPrinters[0]
    }
    
    // Format receipt data for printing
    const options = {
      preview: false,
      width: '58mm',
      margin: '0',
      copies: 1,
      printerName: targetPrinter.name,
      timeOutPerLine: 400,
      silent: true
    }

    const printData = [
      {
        type: 'text',
        value: receiptData.transactionType.toUpperCase(),
        style: { 
          fontWeight: 'bold', 
          textAlign: 'center', 
          fontSize: '14px',
          marginBottom: '5px'
        }
      },
      {
        type: 'text',
        value: '********************************',
        style: { textAlign: 'center', fontWeight: 'bold' }
      },
      {
        type: 'text',
        value: `Transaction Date:\n${new Date(receiptData.date).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}`,
        style: { marginTop: '5px' }
      },
      {
        type: 'text',
        value: `Full Name:\n${receiptData.customerName}`,
        style: { fontWeight: 'bold', marginTop: '5px' }
      },
      {
        type: 'text',
        value: '********************************',
        style: { textAlign: 'center', fontWeight: 'bold', marginTop: '5px' }
      },
      {
        type: 'text',
        value: `Previous Balance:\n₱${receiptData.previousBalance.toFixed(2)}`,
        style: { fontWeight: 'bold', marginTop: '5px' }
      }
    ]

    // Add amount line if present
    if (receiptData.amount > 0) {
      printData.push({
        type: 'text',
        value: `${receiptData.transactionType.includes('CASH-IN') ? 'Amount Added:' : 'Amount Withdrawn:'}\n₱${receiptData.amount.toFixed(2)}`,
        style: { fontWeight: 'bold', marginTop: '5px' }
      })
    }

    printData.push(
      {
        type: 'text',
        value: `Remaining Balance:\n₱${receiptData.currentBalance.toFixed(2)}`,
        style: { fontWeight: 'bold', marginTop: '5px' }
      },
      {
        type: 'text',
        value: '********************************',
        style: { textAlign: 'center', fontWeight: 'bold', marginTop: '5px' }
      },
      {
        type: 'text',
        value: 'Thank you!',
        style: { 
          textAlign: 'center', 
          fontWeight: 'bold', 
          marginTop: '10px',
          marginBottom: '10px'
        }
      }
    )

    await PosPrinter.print(printData, options)
    
    return { success: true, printer: targetPrinter.name }
  } catch (error) {
    console.error('Print error:', error)
    return { success: false, error: error.message }
  }
})
```

### 3. Create Preload Script

Create `frontend/electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printThermalReceipt: (receiptData) => ipcRenderer.invoke('print-thermal-receipt', receiptData)
})
```

### 4. Update Package.json

Add to `frontend/package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "vite build && electron-builder",
    "preview": "vite preview"
  },
  "build": {
    "appId": "com.yourcompany.rfid-pos",
    "productName": "RFID POS",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": ["nsis"],
      "icon": "public/icon.ico"
    }
  }
}
```

Install additional dependencies:
```bash
npm install concurrently wait-on --save-dev
```

### 5. Update Print Utility

Update `frontend/src/utils/printReceipt.js`:

```javascript
/**
 * Thermal Receipt Printer Utility
 * Now supports both Web and Electron environments
 */

export const printThermalReceipt = async (transactionData) => {
  const {
    transactionType,
    amount = 0,
    previousBalance,
    currentBalance,
    customerName,
    date = new Date()
  } = transactionData

  // Check if running in Electron
  if (window.electronAPI) {
    try {
      // Use Electron's direct printing
      const result = await window.electronAPI.printThermalReceipt({
        transactionType,
        amount,
        previousBalance,
        currentBalance,
        customerName,
        date
      })
      
      if (result.success) {
        console.log(`Printed to: ${result.printer}`)
        return { success: true, printer: result.printer }
      } else {
        console.error('Print failed:', result.error)
        // Fallback to web printing
        return printViaWeb(transactionData)
      }
    } catch (error) {
      console.error('Electron print error:', error)
      // Fallback to web printing
      return printViaWeb(transactionData)
    }
  } else {
    // Running in web browser, use web printing
    return printViaWeb(transactionData)
  }
}

// Fallback web printing method
const printViaWeb = (transactionData) => {
  const {
    transactionType,
    amount = 0,
    previousBalance,
    currentBalance,
    customerName,
    date = new Date()
  } = transactionData

  const receiptWindow = window.open('', '_blank', 'width=300,height=600')
  
  const receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt</title>
      <style>
        @page { size: 50mm auto; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 50mm;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          padding: 5mm;
          background: white;
        }
        .header {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 5px;
        }
        .divider {
          text-align: center;
          margin: 3px 0;
          font-weight: bold;
        }
        .line { margin: 3px 0; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
        @media print { body { padding: 2mm; } }
      </style>
    </head>
    <body>
      <div class="header">${transactionType.toUpperCase()}</div>
      <div class="divider">********************************</div>
      <div class="line">
        <div>Transaction Date:</div>
        <div class="bold">${new Date(date).toLocaleString('en-US', { 
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: true 
        })}</div>
      </div>
      <div class="line">
        <div>Full Name:</div>
        <div class="bold">${customerName || 'N/A'}</div>
      </div>
      <div class="divider">********************************</div>
      <div class="line">
        <div>Previous Balance:</div>
        <div class="bold">₱${previousBalance.toFixed(2)}</div>
      </div>
      ${amount > 0 ? `
      <div class="line">
        <div>${transactionType.includes('CASH-IN') ? 'Amount Added:' : 'Amount Withdrawn:'}</div>
        <div class="bold">₱${amount.toFixed(2)}</div>
      </div>` : ''}
      <div class="line">
        <div>Remaining Balance:</div>
        <div class="bold">₱${currentBalance.toFixed(2)}</div>
      </div>
      <div class="divider">********************************</div>
      <div class="center bold" style="margin-top: 10px;">Thank you!</div>
    </body>
    </html>
  `
  
  receiptWindow.document.write(receiptContent)
  receiptWindow.document.close()
  
  receiptWindow.onload = () => {
    setTimeout(() => {
      receiptWindow.focus()
      receiptWindow.print()
      receiptWindow.onafterprint = () => receiptWindow.close()
      setTimeout(() => {
        if (!receiptWindow.closed) receiptWindow.close()
      }, 1000)
    }, 100)
  }
  
  return { success: true, mode: 'web' }
}

// Get available printers (Electron only)
export const getAvailablePrinters = async () => {
  if (window.electronAPI) {
    return await window.electronAPI.getPrinters()
  }
  return { allPrinters: [], thermalPrinters: [], defaultPrinter: null }
}
```

### 6. TypeScript Types (Optional)

Create `frontend/src/types/electron.d.ts`:

```typescript
interface ElectronAPI {
  getPrinters: () => Promise<{
    allPrinters: any[]
    thermalPrinters: any[]
    defaultPrinter: any
  }>
  printThermalReceipt: (data: {
    transactionType: string
    amount: number
    previousBalance: number
    currentBalance: number
    customerName: string
    date: Date
  }) => Promise<{ success: boolean; printer?: string; error?: string }>
}

interface Window {
  electronAPI?: ElectronAPI
}
```

## Running the App

### Development Mode
```bash
npm run electron:dev
```

### Build for Production
```bash
npm run electron:build
```

This creates an installable `.exe` for Windows in `dist-electron/`.

## Advantages Over Web Version

| Feature | Web Browser | Electron |
|---------|-------------|----------|
| Silent Printing | ❌ No | ✅ Yes |
| Print Dialog | ✅ Always shows | ❌ No dialog |
| Printer Auto-detect | ❌ Limited | ✅ Full access |
| Offline | ✅ Yes | ✅ Yes |
| Installation | ❌ None needed | ✅ Desktop app |
| USB Printer Access | ⚠️ Limited | ✅ Full access |
| Background Printing | ❌ No | ✅ Yes |

## How It Works

1. **Electron detects all printers** on system startup
2. **Filters for thermal printers** based on name patterns
3. **User clicks Print** → Directly sends to thermal printer
4. **No dialogs shown** → Receipt prints immediately
5. **Falls back to web printing** if Electron fails

## Testing

1. Install the app
2. Connect thermal printer
3. Make a transaction
4. Click print → Receipt prints directly!

## Troubleshooting

**Printer not detected:**
- Ensure printer drivers installed
- Restart Electron app
- Check printer name contains "thermal", "pos", or "receipt"

**Print fails:**
- Check printer is online and has paper
- Verify USB connection
- Look at Electron console for errors

**Want to force specific printer:**
```javascript
// In main.js, modify to use specific printer name
const targetPrinter = printers.find(p => p.name.includes('YOUR_PRINTER_NAME'))
```

## Next Steps

1. Install dependencies
2. Create Electron files
3. Update package.json
4. Test with `npm run electron:dev`
5. Build installer with `npm run electron:build`
6. Distribute the `.exe` to POS terminals
