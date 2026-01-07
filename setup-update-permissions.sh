#!/bin/bash

# RFID POS - Setup Update Permissions
# Run this script once to configure passwordless sudo for automated updates
# Usage: sudo ./setup-update-permissions.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "  Setup Update Permissions"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Must run as root (use sudo)${NC}"
    exit 1
fi

# Get the actual user who ran sudo
ACTUAL_USER="${SUDO_USER:-$USER}"
if [ "$ACTUAL_USER" = "root" ]; then
    echo -e "${RED}Error: Please run with sudo as a regular user${NC}"
    echo "Usage: sudo ./setup-update-permissions.sh"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "User: $ACTUAL_USER"
echo "Script directory: $SCRIPT_DIR"
echo ""

# Make update scripts executable
echo "Making update scripts executable..."
chmod +x "$SCRIPT_DIR/update-system.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/revert-update.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/auto-update.sh" 2>/dev/null || true
echo -e "${GREEN}✓ Scripts are executable${NC}"

# Create sudoers file for POS system operations
echo "Configuring passwordless sudo..."
SUDOERS_FILE="/etc/sudoers.d/posexpress-system-control"

cat > "$SUDOERS_FILE" << EOF
# POS Express - System Control Permissions
# Generated on $(date)

# Allow user to reboot and shutdown without password
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/sbin/reboot, /usr/sbin/poweroff, /sbin/reboot, /sbin/poweroff

# Allow update and revert scripts without password (all paths and methods)
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/bash $SCRIPT_DIR/update-system.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/bash $SCRIPT_DIR/update-system.sh *
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/bash $SCRIPT_DIR/revert-update.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/bash $SCRIPT_DIR/revert-update.sh *
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/bash $SCRIPT_DIR/update-system.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/bash $SCRIPT_DIR/update-system.sh *
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/bash $SCRIPT_DIR/revert-update.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/bash $SCRIPT_DIR/revert-update.sh *

# Allow direct script execution (for spawn without bash prefix)
$ACTUAL_USER ALL=(ALL) NOPASSWD: $SCRIPT_DIR/update-system.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: $SCRIPT_DIR/update-system.sh *
$ACTUAL_USER ALL=(ALL) NOPASSWD: $SCRIPT_DIR/revert-update.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: $SCRIPT_DIR/revert-update.sh *

# Allow -n (non-interactive) sudo for all above commands
# This is essential for programmatic execution from Node.js

# Allow systemctl for POS service management
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl start posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl stop posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl daemon-reload
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl start posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl daemon-reload
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx

# Allow touch and chmod for log file creation
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/touch /var/log/posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/touch /var/log/posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/chmod * /var/log/posexpress-*
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/chmod * /var/log/posexpress-*

# Allow systemd-run for executing update without NoNewPrivileges restriction
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemd-run *
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/systemd-run *
EOF

chmod 0440 "$SUDOERS_FILE"

# Verify sudoers file is valid
if visudo -c -f "$SUDOERS_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ Sudoers configuration is valid${NC}"
else
    echo -e "${RED}Error: Invalid sudoers configuration${NC}"
    rm -f "$SUDOERS_FILE"
    exit 1
fi

# Create log file with proper permissions
LOG_FILE="/var/log/posexpress-update.log"
touch "$LOG_FILE"
chown "$ACTUAL_USER:$ACTUAL_USER" "$LOG_FILE"
chmod 664 "$LOG_FILE"
echo -e "${GREEN}✓ Log file configured${NC}"

# Create revert log file
REVERT_LOG="/var/log/posexpress-revert.log"
touch "$REVERT_LOG"
chown "$ACTUAL_USER:$ACTUAL_USER" "$REVERT_LOG"
chmod 664 "$REVERT_LOG"

# Create backup directory with proper permissions
BACKUP_DIR="$(eval echo ~$ACTUAL_USER)/posexpress-backups"
mkdir -p "$BACKUP_DIR"
chown "$ACTUAL_USER:$ACTUAL_USER" "$BACKUP_DIR"
chmod 755 "$BACKUP_DIR"
echo -e "${GREEN}✓ Backup directory configured: $BACKUP_DIR${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}  Setup Complete! ✓${NC}"
echo "========================================="
echo ""
echo "The following operations are now allowed without password:"
echo "  • System update (update-system.sh)"
echo "  • Revert update (revert-update.sh)"
echo "  • Start/stop/restart POS services"
echo "  • Reboot/shutdown system"
echo ""
echo "You can now use the Update button in Settings!"
echo ""
