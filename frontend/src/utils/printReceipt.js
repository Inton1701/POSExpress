/**
 * Thermal Receipt Printer Utility
 * Supports both Electron (direct printing) and Web (browser printing)
 * Optimized for 50mm thermal printers
 * Works offline using browser print API or Electron IPC
 */

export const printThermalReceipt = async (transactionData, selectedPrinter = null) => {
  // Check if running in Electron environment
  if (window.electronAPI) {
    try {
      // Use Electron's direct printing to thermal printer
      const result = await window.electronAPI.printThermalReceipt({
        ...transactionData,
        printerName: selectedPrinter
      })
      
      if (result.success) {
        return { success: true, printer: result.printer, mode: result.mode || 'electron' }
      } else {
        throw new Error(result.error || 'Print failed')
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to print receipt')
    }
  } else {
    // Running in web browser, throw error instead of fallback
    console.error('Electron environment required for thermal printing')
    throw new Error('Thermal printing is only available in desktop application')
  }
}

// Fallback web printing method (opens print dialog)
const printViaWeb = (transactionData) => {
  const {
    type,
    transactionType,
    amount = 0,
    previousBalance,
    currentBalance,
    customerName,
    date = new Date(),
    items = [],
    refundAmount = 0,
    originalTransactionId,
    paymentMethod,
    customer
  } = transactionData

  const receiptWindow = window.open('', '_blank', 'width=300,height=600')
  
  let receiptContent = ''
  
  // Handle different receipt types
  if (type === 'refund') {
    // Refund receipt
    const itemsHTML = items.map(item => `
      <div class="line">
        <span>${item.name} x${item.quantity}</span>
        <span>₱${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('')
    
    receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Refund Receipt</title>
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
          .header { text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 5px; }
          .divider { text-align: center; margin: 3px 0; }
          .line { display: flex; justify-content: space-between; margin: 3px 0; }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          @media print { body { padding: 2mm; } }
        </style>
      </head>
      <body>
        <div class="header">REFUND RECEIPT</div>
        <div class="divider">********************************</div>
        <div class="line"><span>Date:</span><span>${new Date(date).toLocaleString()}</span></div>
        <div class="line"><span>Original Transaction:</span><span>${originalTransactionId || 'N/A'}</span></div>
        ${customer ? `<div class="line"><span>Customer:</span><span>${customer.fullName}</span></div>` : ''}
        <div class="divider">********************************</div>
        <div class="bold center">REFUNDED ITEMS:</div>
        ${itemsHTML}
        <div class="divider">********************************</div>
        <div class="line bold"><span>REFUND AMOUNT:</span><span>₱${refundAmount.toFixed(2)}</span></div>
        <div class="line"><span>Payment Method:</span><span>${paymentMethod}</span></div>
        ${paymentMethod === 'E-wallet' && customer ? '<div class="center bold">Refunded to account</div>' : ''}
        <div class="divider">********************************</div>
        <div class="center bold">Thank you!</div>
      </body>
      </html>
    `
  } else {
    // Customer transaction receipt (original)
    receiptContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt</title>
      <style>
        @page {
          size: 50mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
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
        
        .line {
          margin: 3px 0;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .center {
          text-align: center;
        }
        
        @media print {
          body {
            padding: 2mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">${transactionType ? transactionType.toUpperCase() : 'TRANSACTION'}</div>
      <div class="divider">********************************</div>
      ${transactionData.transactionId ? `
      <div class="center" style="font-size: 9px; margin: 5px 0;">
        <div>Reference Number</div>
        <div class="bold">${transactionData.transactionId}</div>
      </div>
      <div class="divider">********************************</div>
      ` : ''}
      
      <div class="line">
        <div>Transaction Date:</div>
        <div class="bold">${new Date(date).toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        })}</div>
      </div>
      
      <div class="line">
        <div>Full Name:</div>
        <div class="bold">${customerName || 'N/A'}</div>
      </div>
      
      <div class="divider">********************************</div>
      
      <div class="line">
        <div>Previous Balance:</div>
        <div class="bold">₱${previousBalance ? previousBalance.toFixed(2) : '0.00'}</div>
      </div>
      
      ${amount > 0 ? `
      <div class="line">
        <div>${transactionType && transactionType.includes('CASH-IN') ? 'Amount Added:' : 'Amount Withdrawn:'}</div>
        <div class="bold">₱${amount.toFixed(2)}</div>
      </div>
      ` : ''}
      
      <div class="line">
        <div>Remaining Balance:</div>
        <div class="bold">₱${currentBalance ? currentBalance.toFixed(2) : '0.00'}</div>
      </div>
      
      <div class="divider">********************************</div>
      
      <div class="center bold" style="margin-top: 10px;">Thank you!</div>
    </body>
    </html>
    `
  }
  
  receiptWindow.document.write(receiptContent)
  receiptWindow.document.close()
  
  // Wait for content to load then print automatically
  receiptWindow.onload = () => {
    setTimeout(() => {
      receiptWindow.focus() // Focus the window for proper printing
      receiptWindow.print()
      
      // Auto-close after print dialog
      receiptWindow.onafterprint = () => {
        receiptWindow.close()
      }
      
      // Fallback: Close after delay if onafterprint doesn't fire
      setTimeout(() => {
        if (!receiptWindow.closed) {
          receiptWindow.close()
        }
      }, 1000)
    }, 100)
  }
  
  return { success: true, mode: 'web' }
}

// Get available printers (Electron only)
export const getAvailablePrinters = async () => {
  if (window.electronAPI) {
    try {
      return await window.electronAPI.getPrinters()
    } catch (error) {
      console.error('Error getting printers:', error)
      return { allPrinters: [], thermalPrinters: [], defaultPrinter: null }
    }
  }
  return { allPrinters: [], thermalPrinters: [], defaultPrinter: null }
}

