# Automated Thermal Printer Setup

This guide explains how to use the automated setup script for thermal printers on Linux systems.

## Quick Start

Run the automated setup script:

```bash
sudo bash setup-thermal-printer.sh
```

The script will:
1. Install all required packages (CUPS, build tools, etc.)
2. Detect your USB thermal printer automatically
3. Remove any old printer configurations
4. Install the ZJ-58/ZJ-80 driver (if needed)
5. Configure the printer with the correct driver
6. Restart CUPS service
7. Verify the printer is ready
8. Optionally print a test page

## What's Automated

### Before (Manual Setup)
- 8+ manual steps
- Multiple commands to remember
- Driver compilation from source
- Manual USB device detection
- Manual URI configuration

### After (Automated)
- Single command: `sudo bash setup-thermal-printer.sh`
- Automatic detection and configuration
- Interactive test print option
- Clear status messages throughout

## Printer Configuration

The script creates a printer named **XP58** with the following settings:
- Driver: ZJ-58 PPD (with ZJ-80 and RAW fallbacks)
- Auto-detected USB device URI
- Ready for immediate use

## Usage in Your Application

After running the setup script, you can print from your application:

```javascript
// Electron example
import { exec } from 'child_process';

function printReceipt(filePath) {
  exec(`lp -d XP58 "${filePath}"`, (err, stdout, stderr) => {
    if (err) console.error('Print error:', err);
    else console.log('Print successful');
  });
}
```

## Terminal Printing

Print from command line:

```bash
# Print text
echo "Receipt content" | lp -d XP58

# Print file
lp -d XP58 /path/to/receipt.pdf

# Print PNG (recommended for thermal printers)
lp -d XP58 -o fit-to-page -o media=Custom.58x297mm receipt.png
```

## Troubleshooting

### Printer Not Detected
```bash
# Check if USB printer is connected
lsusb | grep -i printer

# If no output, reconnect the printer and try again
```

### Permission Issues
The script automatically adds your user to printer groups, but you may need to logout/login:

```bash
# Check your groups
groups

# Should include 'lp' and 'lpadmin'
# If not, logout and login again
```

### Printer Status
```bash
# Check printer status
lpstat -p XP58

# View print queue
lpq -P XP58

# Check CUPS logs
journalctl -u cups -f
```

### Re-run Setup
If you need to reconfigure:

```bash
sudo bash setup-thermal-printer.sh
```

The script will clean up old configurations and set everything up fresh.

## Requirements

- Linux system (Ubuntu/Debian based)
- USB thermal printer (ZJ-58/ZJ-80 or compatible)
- Root/sudo access
- Internet connection (for driver installation)

## Notes

- The script uses the ZJ-58 driver which works with most 58mm thermal printers
- If ZJ-58 doesn't work, it automatically tries ZJ-80
- As a last resort, it falls back to RAW mode
- Test print is optional - skip it if you prefer

## Additional Resources

For detailed manual setup instructions (in case automation fails), see:
- [THERMAL_PRINTER_SETUP_LINUX.md](THERMAL_PRINTER_SETUP_LINUX.md)
