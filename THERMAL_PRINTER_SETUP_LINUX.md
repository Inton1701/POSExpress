# Thermal Printer Setup Guide for Linux (ZJ-58)

Complete guide for setting up thermal receipt printers (58mm/80mm) on Linux with CUPS and Electron integration.

---

## Step 1: Install Required Packages

Install CUPS, build tools, and dependencies:

```bash
sudo apt update
sudo apt install -y cups cups-client build-essential libcups2-dev libcupsimage2-dev
```

Install CMake if using ZJ-58 source:

```bash
sudo apt install -y cmake
```

---

## Step 2: Verify the Printer is Detected

Plug in the printer and check USB detection:

```bash
lsusb
```

**Expected output (example):**
```
Bus 002 Device 004: ID 0483:070b STMicroelectronics USB Printer Port
```

Check CUPS device URIs:

```bash
lpinfo -v
```

**You should see something like:**
```
direct usb://Printer%20/USB%20Printer%20Port?serial=CC516313E103
```

⚠️ **Copy this URI for the next steps.**

---

## Step 3: Install the ZJ-58 Driver

### Option A — From Package / System Repository

Sometimes PPD is already installed: `zjiang/zj58.ppd`

Check installed drivers:

```bash
lpinfo -m | grep zj
```

**Expected output:**
```
zjiang/zj58.ppd Zijiang ZJ-58
zjiang/zj80.ppd Zijiang ZJ-80
```

### Option B — From Source

```bash
git clone https://github.com/klirichek/zj-58.git
cd zj-58
mkdir build && cd build
cmake ..
cmake --build .
sudo cmake --install .
sudo systemctl restart cups
```

**This installs:**
- `/usr/lib/cups/filter/rastertozj`
- `/usr/share/cups/model/zj58.ppd`

---

## Step 4: Remove Any Previous Printer Entries

Check existing printers:

```bash
lpstat -p
```

Remove old or unknown printers:

```bash
sudo lpadmin -x PRINTER_NAME
```

**Example:**
```bash
sudo lpadmin -x Unknown
sudo lpadmin -x XP-58
```

---

## Step 5: Add the Printer Manually with Correct Driver

Use the USB URI copied in Step 2 and bind to the ZJ-58 PPD:

```bash
sudo lpadmin \
  -p XP58 \
  -E \
  -v "usb://Printer%20/USB%20Printer%20Port?serial=CC516313E103" \
  -m zjiang/zj58.ppd
```

**Parameters:**
- `-p XP58` → printer queue name
- `-E` → enable the printer
- `-v` → device URI
- `-m` → driver (PPD)

⚠️ **If the ZJ-58 PPD doesn't work, try `zjiang/zj80.ppd`.**

---

## Step 6: Restart CUPS

```bash
sudo systemctl restart cups
```

---

## Step 7: Verify Printer Status

```bash
lpstat -p
```

**Expected output:**
```
printer XP58 is idle. enabled since ...
```

✅ **Printer should not show as "Unknown" or "Generic".**

---

## Step 8: Test Printing

### Plain Text:
```bash
echo "ZJ-58 TEST PRINT" | lp -d XP58
```

### PDF File:
```bash
lp -d XP58 -o fit-to-page=false /path/to/test.pdf
```

---

## Step 9: Optional — RAW Mode Fallback

If the printer still fails, create a RAW queue (works with POS printers):

```bash
sudo lpadmin \
  -p XP58RAW \
  -E \
  -v "usb://Printer%20/USB%20Printer%20Port?serial=CC516313E103" \
  -m raw
```

**Test RAW printing:**
```bash
echo -e "RAW MODE OK\n\n\n" | lp -d XP58RAW
```

---

## Step 10: Electron Integration

Use the `lp` command in Electron's main process:

```javascript
import { exec } from 'child_process';

function printFile(filePath, printer = 'XP58') {
  exec(`lp -d "${printer}" "${filePath}"`, (err, stdout, stderr) => {
    if (err) console.error('Print error:', err);
    else console.log('Print job sent:', stdout);
  });
}
```

**For thermal receipts:** Use RAW mode for speed.

**For PDFs:** Use `-o fit-to-page=false` to prevent auto-scaling.

---

## ✅ Notes / Tips

### Always Restart CUPS After Changes:
```bash
sudo systemctl restart cups
```

### Ensure Your User is in the lp and lpadmin Groups:
```bash
sudo usermod -aG lp,lpadmin $USER
logout
```
**You must logout and login again for group changes to take effect.**

### For POS Printers:
- RAW mode is often faster and more reliable than PPD scaling
- Use PNG format for images (better compatibility than PDF)
- Use 58mm or 80mm paper size depending on your printer

### Electron Printer Detection:
```javascript
const { webContents } = require('electron');

// Get list of all printers
webContents.getPrintersAsync().then(printers => {
  console.log('Available printers:', printers);
});
```

---

## Troubleshooting

### Print Jobs Complete But Nothing Prints:
1. Check printer status: `lpstat -p XP58`
2. Check print queue: `lpq -a`
3. View CUPS logs: `journalctl -u cups -f`
4. Try RAW mode (Step 9)

### PDF Prints Blank Pages:
- Use PNG format instead
- Ensure window is visible when capturing/generating print content
- Check PDF content manually: `xdg-open /tmp/receipt-*.pdf`

### Permission Denied:
```bash
sudo usermod -aG lp,lpadmin $USER
logout
```

### Printer Shows as "Unknown":
- Reinstall with correct PPD driver (Step 5)
- Restart CUPS (Step 6)

---

## Current Implementation in POSExpress

The POSExpress app uses the following approach:

1. **Render HTML** receipt in hidden BrowserWindow (visible+minimized on Linux)
2. **Capture as PNG** using `webContents.capturePage()`
3. **Save to disk** as `/tmp/receipt-{timestamp}.png`
4. **Print via CUPS** using `lp -d XP58 -o fit-to-page -o media=Custom.58x297mm`
5. **Clean up** temp file after 10 seconds

**Printer Settings:**
- Size: 58mm x 297mm (configurable for 80mm printers)
- Format: PNG (most reliable for thermal printers)
- Mode: CUPS direct printing via lp command

**To change printer in app:**
1. Open Settings
2. Select your printer from dropdown (e.g., XP58)
3. Save settings
