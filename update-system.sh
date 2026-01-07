#!/bin/bash

# RFID POS - Automated System Update (No Prompts)
# Updates backend, frontend, and Electron app automatically
# Preserves all existing configurations

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
LOG_FILE="/var/log/posexpress-update.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================" | tee -a "$LOG_FILE"
echo "RFID POS - Automated Update" | tee -a "$LOG_FILE"
echo "$(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_REPO="Inton1701/POSExpress"
BACKUP_DIR="$HOME/posexpress-backups"
ACTUAL_USER="${SUDO_USER:-$USER}"

# Exit if not root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Must run as root (use sudo)${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

cd "$SCRIPT_DIR"

# Get current version
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")
echo "Current version: v$CURRENT_VERSION" | tee -a "$LOG_FILE"

# Fetch latest release
echo "Checking for updates..." | tee -a "$LOG_FILE"
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest")

if [ -z "$LATEST_RELEASE" ] || echo "$LATEST_RELEASE" | grep -q "Not Found"; then
    echo -e "${RED}Error: Could not fetch release from GitHub${NC}" | tee -a "$LOG_FILE"
    exit 1
fi

# Parse version using sed (compatible with all Linux systems)
LATEST_VERSION=$(echo "$LATEST_RELEASE" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | sed 's/v//')
echo "Latest version: v$LATEST_VERSION" | tee -a "$LOG_FILE"

if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
    echo "Already up to date!" | tee -a "$LOG_FILE"
    exit 0
fi

# Create backup
echo "Creating backup..." | tee -a "$LOG_FILE"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/v$CURRENT_VERSION-$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

# Backup critical files
cp -r backend "$BACKUP_PATH/" 2>/dev/null || true
cp -r frontend "$BACKUP_PATH/" 2>/dev/null || true
cp VERSION "$BACKUP_PATH/" 2>/dev/null || true
echo "$CURRENT_VERSION" > "$BACKUP_PATH/VERSION"

# Create metadata file for revert
cat > "$BACKUP_PATH/metadata.json" << EOF
{
  "version": "$CURRENT_VERSION",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "services_status": {
    "backend": "$(systemctl is-active posexpress-backend 2>/dev/null || echo 'inactive')",
    "frontend": "$(systemctl is-active posexpress-frontend 2>/dev/null || echo 'inactive')"
  }
}
EOF

echo "Backup created: $BACKUP_PATH" | tee -a "$LOG_FILE"

# Stop services
echo "Stopping services..." | tee -a "$LOG_FILE"
systemctl stop posexpress-frontend 2>/dev/null || true
systemctl stop posexpress-backend 2>/dev/null || true
sleep 2

# Update code
echo "Downloading latest version..." | tee -a "$LOG_FILE"

if [ -d ".git" ]; then
    # Git repository
    git stash save "Auto-backup before update v$LATEST_VERSION" 2>/dev/null || true
    git fetch origin
    if git rev-parse "v$LATEST_VERSION" >/dev/null 2>&1; then
        git checkout "v$LATEST_VERSION"
    else
        git pull origin main 2>/dev/null || git pull origin master
    fi
else
    # Download archive
    ARCHIVE_URL="https://github.com/$GITHUB_REPO/archive/refs/tags/v$LATEST_VERSION.tar.gz"
    TEMP_DIR="/tmp/posexpress-update-$TIMESTAMP"
    
    mkdir -p "$TEMP_DIR"
    curl -L "$ARCHIVE_URL" -o "$TEMP_DIR/release.tar.gz"
    cd "$TEMP_DIR"
    tar -xzf release.tar.gz
    
    EXTRACTED_DIR=$(find . -maxdepth 1 -type d -name "POSExpress-*" | head -1)
    if [ -z "$EXTRACTED_DIR" ]; then
        echo -e "${RED}Error: Could not find extracted files${NC}" | tee -a "$LOG_FILE"
        exit 1
    fi
    
    # Copy files (excluding sensitive data)
    rsync -av --exclude='.env' --exclude='node_modules' --exclude='dist' \
          --exclude='dist-electron' --exclude='.git' "$EXTRACTED_DIR/" "$SCRIPT_DIR/"
    
    cd "$SCRIPT_DIR"
    rm -rf "$TEMP_DIR"
fi

echo "$LATEST_VERSION" > VERSION
echo "Code updated successfully" | tee -a "$LOG_FILE"

# Fix ownership of all files
echo "Fixing file ownership..." | tee -a "$LOG_FILE"
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$SCRIPT_DIR"
echo "Ownership corrected" | tee -a "$LOG_FILE"

# ========================================
# Update Backend
# ========================================
echo "" | tee -a "$LOG_FILE"
echo "Updating backend..." | tee -a "$LOG_FILE"
cd "$SCRIPT_DIR/backend"

# Install dependencies
sudo -u "$ACTUAL_USER" npm install --production 2>&1 | grep -E "(added|removed|changed|audited|up to date)" || true

# Ensure .env exists (restore from backup if missing)
if [ ! -f ".env" ] && [ -f "$BACKUP_PATH/backend/.env" ]; then
    cp "$BACKUP_PATH/backend/.env" .env
    echo "Restored backend .env from backup" | tee -a "$LOG_FILE"
fi

# Restart backend service
if systemctl list-unit-files | grep -q "posexpress-backend.service"; then
    systemctl start posexpress-backend
    sleep 2
    if systemctl is-active --quiet posexpress-backend; then
        echo "Backend service restarted successfully" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}Warning: Backend service failed to start${NC}" | tee -a "$LOG_FILE"
    fi
fi

# ========================================
# Update Frontend
# ========================================
echo "" | tee -a "$LOG_FILE"
echo "Updating frontend..." | tee -a "$LOG_FILE"
cd "$SCRIPT_DIR/frontend"

# Clean build artifacts
sudo -u "$ACTUAL_USER" rm -rf dist dist-electron node_modules/.vite

# Install dependencies
sudo -u "$ACTUAL_USER" npm install --ignore-scripts 2>&1 | grep -E "(added|removed|changed|audited|up to date)" || true

# Ensure .env exists (restore from backup if missing)
if [ ! -f ".env" ] && [ -f "$BACKUP_PATH/frontend/.env" ]; then
    cp "$BACKUP_PATH/frontend/.env" .env
    echo "Restored frontend .env from backup" | tee -a "$LOG_FILE"
fi

# Build Vue app
echo "Building Vue application..." | tee -a "$LOG_FILE"
sudo -u "$ACTUAL_USER" npm run build 2>&1 | tee -a "$LOG_FILE"

# Deploy to Nginx
if command -v nginx &> /dev/null; then
    echo "Deploying to Nginx..." | tee -a "$LOG_FILE"
    rm -rf /var/www/html/*
    cp -r dist/* /var/www/html/
    chown -R www-data:www-data /var/www/html
    chmod -R 755 /var/www/html
    systemctl reload nginx 2>/dev/null || true
    echo "Nginx updated" | tee -a "$LOG_FILE"
fi

# ========================================
# Rebuild Electron App
# ========================================
echo "" | tee -a "$LOG_FILE"
echo "Building Electron application..." | tee -a "$LOG_FILE"

# Clean old builds
sudo -u "$ACTUAL_USER" rm -rf dist-electron

# Build Electron app
sudo -u "$ACTUAL_USER" npm run electron:build 2>&1 | tee -a "$LOG_FILE"

# Find new AppImage
APPIMAGE=$(find "$SCRIPT_DIR/frontend/dist-electron" -name "*.AppImage" -type f | head -n 1)

if [ -z "$APPIMAGE" ]; then
    echo -e "${YELLOW}Warning: AppImage not found${NC}" | tee -a "$LOG_FILE"
else
    echo "AppImage built: $(basename "$APPIMAGE")" | tee -a "$LOG_FILE"
    chmod +x "$APPIMAGE"
    
    # Update systemd service
    SERVICE_NAME="posexpress-frontend"
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
    USER_HOME=$(eval echo "~$ACTUAL_USER")
    
    if [ -f "$SERVICE_FILE" ]; then
        # Update service file with new AppImage path
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
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=graphical.target
EOF
        
        systemctl daemon-reload
        echo "Service file updated" | tee -a "$LOG_FILE"
    fi
    
    # Update desktop entry
    DESKTOP_FILE="${USER_HOME}/.local/share/applications/posexpress.desktop"
    mkdir -p "${USER_HOME}/.local/share/applications"
    
    cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=RFID POS Express
Comment=Point of Sale System
Exec=$APPIMAGE --no-sandbox --appimage-extract-and-run
Icon=pos
Terminal=false
Type=Application
Categories=Office;Finance;
EOF
    
    chown "$ACTUAL_USER:$ACTUAL_USER" "$DESKTOP_FILE"
    chmod +x "$DESKTOP_FILE"
    echo "Desktop entry updated" | tee -a "$LOG_FILE"
fi

# ========================================
# Start Services
# ========================================
echo "" | tee -a "$LOG_FILE"
echo "Starting services..." | tee -a "$LOG_FILE"

systemctl start posexpress-backend 2>/dev/null || true
sleep 2

if [ -n "$APPIMAGE" ]; then
    systemctl start posexpress-frontend 2>/dev/null || true
    sleep 2
fi

# ========================================
# Verify Update
# ========================================
echo "" | tee -a "$LOG_FILE"
echo "Verifying update..." | tee -a "$LOG_FILE"

BACKEND_STATUS=$(systemctl is-active posexpress-backend 2>/dev/null || echo "inactive")
FRONTEND_STATUS=$(systemctl is-active posexpress-frontend 2>/dev/null || echo "inactive")

echo "Backend: $BACKEND_STATUS" | tee -a "$LOG_FILE"
echo "Frontend: $FRONTEND_STATUS" | tee -a "$LOG_FILE"

# Cleanup old backups (keep last 5)
echo "Cleaning old backups..." | tee -a "$LOG_FILE"
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
echo "Kept last 5 backups" | tee -a "$LOG_FILE"

# ========================================
# Complete
# ========================================
echo "" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo -e "${GREEN}Update Complete!${NC}" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"
echo "Updated: v$CURRENT_VERSION → v$LATEST_VERSION" | tee -a "$LOG_FILE"
echo "Backup: $BACKUP_PATH" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Services Status:" | tee -a "$LOG_FILE"
echo "  Backend:  $BACKEND_STATUS" | tee -a "$LOG_FILE"
echo "  Frontend: $FRONTEND_STATUS" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "Log file: $LOG_FILE" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Return status code based on service status
if [ "$BACKEND_STATUS" = "active" ] && [ "$FRONTEND_STATUS" = "active" ]; then
    exit 0
else
    exit 2
fi
