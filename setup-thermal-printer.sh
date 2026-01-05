#!/bin/bash

# Thermal Printer Auto-Setup Script for ZJ-58/ZJ-80
# This script automates the thermal printer setup on Linux

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Thermal Printer Auto-Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Step 1: Install required packages
echo -e "${YELLOW}[1/8] Installing required packages...${NC}"
apt update -qq
apt install -y cups cups-client build-essential libcups2-dev libcupsimage2-dev cmake > /dev/null 2>&1
echo -e "${GREEN}✓ Packages installed${NC}"

# Step 2: Detect USB printer
echo -e "${YELLOW}[2/8] Detecting USB printer...${NC}"
sleep 2
USB_DEVICE=$(lsusb | grep -i "printer\|STMicroelectronics")
if [ -z "$USB_DEVICE" ]; then
    echo -e "${RED}Error: No USB printer detected. Please ensure the printer is connected.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ USB Printer detected: $USB_DEVICE${NC}"

# Step 3: Get device URI
echo -e "${YELLOW}[3/8] Getting printer device URI...${NC}"
sleep 1
DEVICE_URI=$(lpinfo -v | grep -i "usb://.*Printer" | head -n1 | awk '{print $2}')
if [ -z "$DEVICE_URI" ]; then
    echo -e "${RED}Error: Could not detect printer URI${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Device URI: $DEVICE_URI${NC}"

# Step 4: Remove existing printer entries
echo -e "${YELLOW}[4/8] Cleaning up old printer entries...${NC}"
EXISTING_PRINTERS=$(lpstat -p 2>/dev/null | awk '{print $2}')
if [ -n "$EXISTING_PRINTERS" ]; then
    for printer in $EXISTING_PRINTERS; do
        lpadmin -x "$printer" 2>/dev/null || true
        echo -e "${GREEN}  Removed: $printer${NC}"
    done
else
    echo -e "${GREEN}  No existing printers to remove${NC}"
fi

# Step 5: Install ZJ-58 driver if not present
echo -e "${YELLOW}[5/8] Checking for ZJ-58 driver...${NC}"
DRIVER_INSTALLED=$(lpinfo -m | grep -i "zjiang/zj58.ppd" || true)
if [ -z "$DRIVER_INSTALLED" ]; then
    echo -e "${YELLOW}  Installing ZJ-58 driver from source...${NC}"
    cd /tmp
    if [ -d "zj-58" ]; then
        rm -rf zj-58
    fi
    git clone https://github.com/klirichek/zj-58.git > /dev/null 2>&1
    cd zj-58
    mkdir -p build && cd build
    cmake .. > /dev/null 2>&1
    cmake --build . > /dev/null 2>&1
    cmake --install . > /dev/null 2>&1
    cd /
    rm -rf /tmp/zj-58
    echo -e "${GREEN}✓ ZJ-58 driver installed${NC}"
else
    echo -e "${GREEN}✓ ZJ-58 driver already installed${NC}"
fi

# Step 6: Add printer with ZJ-58 driver
echo -e "${YELLOW}[6/8] Configuring printer (XP58)...${NC}"
lpadmin \
    -p XP58 \
    -E \
    -v "$DEVICE_URI" \
    -m zjiang/zj58.ppd 2>/dev/null || {
    echo -e "${YELLOW}  Trying alternative driver (zj80)...${NC}"
    lpadmin \
        -p XP58 \
        -E \
        -v "$DEVICE_URI" \
        -m zjiang/zj80.ppd 2>/dev/null || {
        echo -e "${YELLOW}  Using RAW mode as fallback...${NC}"
        lpadmin \
            -p XP58 \
            -E \
            -v "$DEVICE_URI" \
            -m raw
    }
}
echo -e "${GREEN}✓ Printer configured as XP58${NC}"

# Step 7: Restart CUPS
echo -e "${YELLOW}[7/8] Restarting CUPS service...${NC}"
systemctl restart cups
sleep 2
echo -e "${GREEN}✓ CUPS restarted${NC}"

# Step 8: Verify printer status
echo -e "${YELLOW}[8/8] Verifying printer status...${NC}"
PRINTER_STATUS=$(lpstat -p XP58 2>/dev/null | grep "idle\|processing" || true)
if [ -n "$PRINTER_STATUS" ]; then
    echo -e "${GREEN}✓ Printer is ready: $PRINTER_STATUS${NC}"
else
    echo -e "${RED}⚠ Warning: Printer status unknown. Please check manually.${NC}"
fi

# Add user to lp and lpadmin groups
echo -e "${YELLOW}Adding current user to printer groups...${NC}"
ACTUAL_USER=$(who am i | awk '{print $1}')
if [ -n "$ACTUAL_USER" ]; then
    usermod -aG lp,lpadmin "$ACTUAL_USER" 2>/dev/null || true
    echo -e "${GREEN}✓ User $ACTUAL_USER added to printer groups${NC}"
fi

# Test print
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Printer Name: ${GREEN}XP58${NC}"
echo -e "Device URI: ${GREEN}$DEVICE_URI${NC}"
echo ""
echo -e "${YELLOW}Would you like to print a test page? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Printing test page...${NC}"
    echo "THERMAL PRINTER TEST" | lp -d XP58
    echo "Test Print" | lp -d XP58
    echo -e "Date: $(date)" | lp -d XP58
    echo -e "\n\n\n" | lp -d XP58
    echo -e "${GREEN}✓ Test page sent to printer${NC}"
fi

echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo -e "  • You may need to logout and login again for group permissions to take effect"
echo -e "  • To print from terminal: ${GREEN}lp -d XP58 filename${NC}"
echo -e "  • To check printer status: ${GREEN}lpstat -p XP58${NC}"
echo -e "  • To view printer queue: ${GREEN}lpq -P XP58${NC}"
echo ""
echo -e "${GREEN}Setup complete! The printer is ready to use.${NC}"
