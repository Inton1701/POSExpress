const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printThermalReceipt: (receiptData) => ipcRenderer.invoke('print-thermal-receipt', receiptData),
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command)
})
