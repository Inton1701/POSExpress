const { contextBridge, ipcRenderer } = require('electron')

// Expose Electron API
contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printThermalReceipt: (receiptData) => ipcRenderer.invoke('print-thermal-receipt', receiptData),
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command)
})

// Expose app configuration (API URL)
contextBridge.exposeInMainWorld('__APP_CONFIG__', {
  API_URL: process.env.API_URL || 'http://localhost:5000/api'
})
