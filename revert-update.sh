#!/bin/bash

# RFID POS - Revert Update Script
# Restores a previous backup version

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
LOG_FILE="/var/log/posexpress-revert.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================" | tee -a "$LOG_FILE"
echo "RFID POS - Revert Update" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$HOME/posexpress-backups"
ACTUAL_USER="${SUDO_USER:-$USER}"

# Exit if not root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Must run as root (use sudo)${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: No backups found at $BACKUP_DIR${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Parse target backup version from argument
TARGET_BACKUP="$1"

if [ -z "$TARGET_BACKUP" ]; then
    echo -e "${RED}Error: No backup version specified${NC}" | tee -a "$LOG_FILE"
    echo "Usage: sudo ./revert-update.sh <backup-path>" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
    echo "Available backups:" | tee -a "$LOG_FILE"
    ls -1 "$BACKUP_DIR" | tee -a "$LOG_FILE"
    exit 1
fi

# Check if target backup exists
BACKUP_PATH="$BACKUP_DIR/$TARGET_BACKUP"
if [ ! -d "$BACKUP_PATH" ]; then
    BACKUP_PATH="$TARGET_BACKUP"  # Try as absolute path
    if [ ! -d "$BACKUP_PATH" ]; then
        echo -e "${RED}Error: Backup not found at $TARGET_BACKUP${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
fi

echo "Reverting to: $BACKUP_PATH" | tee -a "$LOG_FILE"

# Get backup metadata
if [ -f "$BACKUP_PATH/metadata.json" ]; then
    BACKUP_VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$BACKUP_PATH/metadata.json" 2>/dev/null || echo "unknown")
    echo "Backup version: v$BACKUP_VERSION" | tee -a "$LOG_FILE"
fi

# Get current version
CURRENT_VERSION=$(cat "$SCRIPT_DIR/VERSION" 2>/dev/null || echo "unknown")
echo "Current version: v$CURRENT_VERSION" | tee -a "$LOG_FILE"

# Stop services
echo "Stopping services..." | tee -a "$LOG_FILE"
systemctl stop posexpress-frontend 2>/dev/null || true
systemctl stop posexpress-backend 2>/dev/null || true
sleep 2

# Create backup of current state before reverting
REVERT_BACKUP="$BACKUP_DIR/pre-revert-v$CURRENT_VERSION-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup of current state..." | tee -a "$LOG_FILE"
mkdir -p "$REVERT_BACKUP"
cp -r "$SCRIPT_DIR/backend" "$REVERT_BACKUP/" 2>/dev/null || true
cp -r "$SCRIPT_DIR/frontend" "$REVERT_BACKUP/" 2>/dev/null || true
cp "$SCRIPT_DIR/VERSION" "$REVERT_BACKUP/" 2>/dev/null || true
echo "Current state backed up to: $REVERT_BACKUP" | tee -a "$LOG_FILE"

# Restore backend
if [ -d "$BACKUP_PATH/backend" ]; then
    echo "Restoring backend..." | tee -a "$LOG_FILE"
    rm -rf "$SCRIPT_DIR/backend"
    cp -r "$BACKUP_PATH/backend" "$SCRIPT_DIR/"
    
    # Install dependencies
    cd "$SCRIPT_DIR/backend"
    sudo -u "$ACTUAL_USER" npm install --silent 2>/dev/null || \
    sudo -u "$ACTUAL_USER" npm install --silent --legacy-peer-deps
    
    echo "Backend restored" | tee -a "$LOG_FILE"
fi

# Restore frontend
if [ -d "$BACKUP_PATH/frontend" ]; then
    echo "Restoring frontend..." | tee -a "$LOG_FILE"
    rm -rf "$SCRIPT_DIR/frontend"
    cp -r "$BACKUP_PATH/frontend" "$SCRIPT_DIR/"
    
    cd "$SCRIPT_DIR/frontend"
    
    # Clean and rebuild
    sudo -u "$ACTUAL_USER" rm -rf dist dist-electron node_modules/.vite
    sudo -u "$ACTUAL_USER" npm install --silent --ignore-scripts 2>/dev/null || \
    sudo -u "$ACTUAL_USER" npm install --silent --legacy-peer-deps --ignore-scripts
    
    echo "Building Vue application..." | tee -a "$LOG_FILE"
    sudo -u "$ACTUAL_USER" npm run build 2>&1 | tee -a "$LOG_FILE"
    
    # Deploy to Nginx
    if command -v nginx &> /dev/null; then
        rm -rf /var/www/html/*
        cp -r dist/* /var/www/html/
        chown -R www-data:www-data /var/www/html
        chmod -R 755 /var/www/html
        systemctl reload nginx 2>/dev/null || true
    fi
    
    # Rebuild Electron app
    echo "Building Electron application..." | tee -a "$LOG_FILE"
    sudo -u "$ACTUAL_USER" npm run electron:build 2>&1 | tee -a "$LOG_FILE"
    
    # Update service with new AppImage
    APPIMAGE=$(find "$SCRIPT_DIR/frontend/dist-electron" -name "*.AppImage" -type f | head -n 1)
    if [ -n "$APPIMAGE" ]; then
        chmod +x "$APPIMAGE"
        
        SERVICE_FILE="/etc/systemd/system/posexpress-frontend.service"
        USER_HOME=$(eval echo "~$ACTUAL_USER")
        
        cat > "$SERVICE_FILE" << EOF
[Unit]
Description=RFID POS Express Frontend (Electron)
After=graphical.target posexpress-backend.service
Wants=posexpress-backend.service

[Service]
Type=simple
User=$ACTUAL_USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=${USER_HOME}/.Xauthority
WorkingDirectory=$SCRIPT_DIR/frontend
ExecStart=$APPIMAGE --no-sandbox --appimage-extract-and-run
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=posexpress-frontend

[Install]
WantedBy=graphical.target
EOF
        
        systemctl daemon-reload
    fi
    
    echo "Frontend restored" | tee -a "$LOG_FILE"
fi

# Restore VERSION file
if [ -f "$BACKUP_PATH/VERSION" ]; then
    cp "$BACKUP_PATH/VERSION" "$SCRIPT_DIR/VERSION"
fi

# Start services
echo "Starting services..." | tee -a "$LOG_FILE"
systemctl start posexpress-backend 2>/dev/null || true
sleep 2
systemctl start posexpress-frontend 2>/dev/null || true
sleep 2

# Verify
BACKEND_STATUS=$(systemctl is-active posexpress-backend 2>/dev/null || echo "inactive")
FRONTEND_STATUS=$(systemctl is-active posexpress-frontend 2>/dev/null || echo "inactive")

echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo -e "${GREEN}Revert Complete!${NC}" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Reverted: v$CURRENT_VERSION → v$BACKUP_VERSION" | tee -a "$LOG_FILE"
echo "Current state backed up to: $REVERT_BACKUP" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Services Status:" | tee -a "$LOG_FILE"
echo "  Backend:  $BACKEND_STATUS" | tee -a "$LOG_FILE"
echo "  Frontend: $FRONTEND_STATUS" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ "$BACKEND_STATUS" = "active" ] && [ "$FRONTEND_STATUS" = "active" ]; then
    exit 0
else
    exit 2
fi
