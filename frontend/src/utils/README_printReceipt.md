# Thermal Receipt Printer Utility

A reusable utility function for printing thermal receipts (50mm width) that works offline.

## Usage

### Import the function

```javascript
import { printThermalReceipt } from '@/utils/printReceipt.js'
// or
import { printThermalReceipt } from '../../utils/printReceipt.js'
```

### Call the function

```javascript
printThermalReceipt({
  transactionType: 'CASH-IN',           // Required: Transaction type (will be uppercase in header)
  amount: 100.00,                        // Optional: Transaction amount (0 for balance inquiry)
  previousBalance: 500.00,               // Required: Balance before transaction
  currentBalance: 600.00,                // Required: Balance after transaction
  customerName: 'Juan Dela Cruz',        // Required: Customer full name
  date: new Date()                       // Optional: Transaction date (defaults to current)
})
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transactionType` | String | Yes | Type of transaction (e.g., 'CASH-IN', 'CASH-OUT / WITHDRAW', 'Balance Inquiry') |
| `amount` | Number | No | Transaction amount. Set to 0 for balance inquiries. Default: 0 |
| `previousBalance` | Number | Yes | Customer's balance before the transaction |
| `currentBalance` | Number | Yes | Customer's balance after the transaction |
| `customerName` | String | Yes | Customer's full name |
| `date` | Date | No | Transaction date and time. Default: new Date() |

## Receipt Format

```
        CASH-IN
********************************
Transaction Date:
12/23/2025, 02:30 PM
Full Name:
Juan Dela Cruz
********************************
Previous Balance:
₱500.00
Amount Added:
₱100.00
Remaining Balance:
₱600.00
********************************
       Thank you!
```

## Features

- ✅ Optimized for 50mm thermal printers
- ✅ Works completely offline (no server required)
- ✅ Auto-triggers print dialog
- ✅ Auto-closes window after printing
- ✅ Uses Courier New monospace font
- ✅ Responsive print layout

## Examples

### Cash-In Transaction
```javascript
printThermalReceipt({
  transactionType: 'CASH-IN',
  amount: 500,
  previousBalance: 1000,
  currentBalance: 1500,
  customerName: 'Maria Santos'
})
```

### Cash-Out/Withdraw Transaction
```javascript
printThermalReceipt({
  transactionType: 'CASH-OUT / WITHDRAW',
  amount: 200,
  previousBalance: 1000,
  currentBalance: 800,
  customerName: 'Pedro Garcia'
})
```

### Balance Inquiry
```javascript
printThermalReceipt({
  transactionType: 'Balance Inquiry',
  amount: 0,
  previousBalance: 1500,
  currentBalance: 1500,
  customerName: 'Ana Reyes'
})
```

## Browser Compatibility

Works in all modern browsers that support:
- `window.open()`
- `window.print()`
- CSS `@page` directive

## Notes

- The receipt opens in a new window/tab
- Print dialog appears automatically
- Window closes after printing or cancelling
- All amounts are formatted to 2 decimal places with ₱ symbol
- Transaction type is displayed in BOLD UPPERCASE
