#!/bin/bash

# RFID POS - Frontend Deployment Script
# Automates: clean deployment, rebuild, .env configuration, nginx hosting, electron app build, and auto-start

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RFID POS - Frontend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
    exit 1
fi

# Get the actual user who ran sudo
ACTUAL_USER="${SUDO_USER:-$USER}"
if [ "$ACTUAL_USER" = "root" ]; then
    echo -e "${RED}Error: Please run this script with sudo as a regular user, not as root directly${NC}"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}Error: Frontend directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Step 1: Clean deployment
echo -e "${YELLOW}[1/7] Cleaning previous deployment...${NC}"
sudo -u "$ACTUAL_USER" bash -c "cd '$FRONTEND_DIR' && rm -rf dist dist-electron node_modules/.vite"
echo -e "${GREEN}✓ Cleaned dist, dist-electron, and vite cache${NC}"
echo ""

# Step 2: Install/Update dependencies
echo -e "${YELLOW}[2/7] Installing dependencies...${NC}"
sudo -u "$ACTUAL_USER" bash -c "cd '$FRONTEND_DIR' && npm install --ignore-scripts" || \
sudo -u "$ACTUAL_USER" bash -c "cd '$FRONTEND_DIR' && npm install --legacy-peer-deps --ignore-scripts"
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Configure .env
echo -e "${YELLOW}[3/7] Configuring .env file...${NC}"

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${BLUE}.env file already exists${NC}"
    
    # Read existing API_URL
    EXISTING_API_URL=$(grep "^VITE_API_URL=" .env 2>/dev/null | cut -d '=' -f2)
    
    if [ -n "$EXISTING_API_URL" ]; then
        echo "Current API URL: $EXISTING_API_URL"
        read -p "Reuse existing configuration? (y/n) [y]: " REUSE_ENV
        REUSE_ENV=${REUSE_ENV:-y}
        
        if [[ "$REUSE_ENV" =~ ^[Yy]$ ]]; then
            API_URL="$EXISTING_API_URL"
            echo -e "${GREEN}✓ Reusing existing .env configuration${NC}"
        else
            read -p "Enter new API URL [http://posexpress.local/api]: " API_URL
            API_URL=${API_URL:-http://posexpress.local/api}
            
            # Create new .env file
            cat > .env << EOF
VITE_API_URL=$API_URL
EOF
            echo -e "${GREEN}✓ .env file updated with API_URL=$API_URL${NC}"
        fi
    else
        # Existing .env but no API_URL found
        read -p "Enter API URL [http://posexpress.local/api]: " API_URL
        API_URL=${API_URL:-http://posexpress.local/api}
        
        cat > .env << EOF
VITE_API_URL=$API_URL
EOF
        echo -e "${GREEN}✓ .env file created with API_URL=$API_URL${NC}"
    fi
else
    # No .env file exists
    read -p "Enter API URL [http://posexpress.local/api]: " API_URL
    API_URL=${API_URL:-http://posexpress.local/api}
    
    # Create .env file
    cat > .env << EOF
VITE_API_URL=$API_URL
EOF
    echo -e "${GREEN}✓ .env file created with API_URL=$API_URL${NC}"
fi
echo ""

# Step 4: Build Vue app
echo -e "${YELLOW}[4/7] Building Vue application...${NC}"
sudo -u "$ACTUAL_USER" bash -c "cd '$FRONTEND_DIR' && npm run build"
echo -e "${GREEN}✓ Vue app built successfully${NC}"
echo ""

# Step 5: Deploy to Nginx
echo -e "${YELLOW}[5/7] Deploying to Nginx...${NC}"

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}Error: Nginx is not installed. Please install it first.${NC}"
    echo "Run: sudo apt install -y nginx"
    exit 1
fi

# Backup existing site if it exists
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
    BACKUP_DIR="$HOME/nginx-backup-$(date +%Y%m%d-%H%M%S)"
    echo "Backing up existing site to $BACKUP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo cp -r /var/www/html/* "$BACKUP_DIR/" 2>/dev/null || true
fi

# Deploy new build
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo -e "${GREEN}✓ Deployed to /var/www/html${NC}"

# Create Nginx configuration for native deployment
echo "Configuring Nginx for API proxy..."
sudo tee /etc/nginx/sites-available/posexpress > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
    }

    # Vue Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
    }
}
EOF

# Enable site and remove default
sudo ln -sf /etc/nginx/sites-available/posexpress /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured and restarted${NC}"
echo ""

# Step 6: Build Electron Linux app
echo -e "${YELLOW}[6/7] Building Electron Linux application...${NC}"

echo "Performing clean install of Electron app..."

# Stop the running service if it exists
if systemctl is-active --quiet posexpress-frontend 2>/dev/null; then
    echo "Stopping running posexpress-frontend service..."
    systemctl stop posexpress-frontend
    sleep 2
fi

# Remove old AppImage and other dist-electron files
echo "Cleaning old build files..."
sudo -u "$ACTUAL_USER" bash -c "cd '$FRONTEND_DIR' && rm -rf dist-electron"

echo "Building Electron app... This may take several minutes."
sudo -u "$ACTUAL_USER" bash -c "cd '$FRONTEND_DIR' && npm run electron:build"
echo -e "${GREEN}✓ Electron app built successfully${NC}"
echo -e "${GREEN}  Output: $FRONTEND_DIR/dist-electron/${NC}"

# List generated files
echo ""
echo "Generated files:"
ls -lh "$FRONTEND_DIR/dist-electron/"*.AppImage 2>/dev/null || true
ls -lh "$FRONTEND_DIR/dist-electron/"*.deb 2>/dev/null || true
echo ""

# Step 7: Setup auto-start with systemd
echo -e "${YELLOW}[7/7] Setting up Electron auto-start...${NC}"

# Find the built AppImage
APPIMAGE=$(find "$FRONTEND_DIR/dist-electron" -name "*.AppImage" -type f | head -n 1)

if [ -z "$APPIMAGE" ]; then
    echo -e "${YELLOW}⚠ AppImage not found. Skipping auto-start setup.${NC}"
else
    echo "Found: $(basename "$APPIMAGE")"
    
    # Make it executable
    chmod +x "$APPIMAGE"
    
    # Check and install FUSE if needed
    if ! command -v fusermount &> /dev/null; then
        echo -e "${YELLOW}FUSE not found. Installing libfuse2...${NC}"
        apt install -y libfuse2 || echo -e "${YELLOW}Could not install libfuse2 automatically${NC}"
    fi
    
    SERVICE_NAME="posexpress-frontend"
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
    USER_HOME=$(eval echo "~$ACTUAL_USER")
    
    # Create systemd service file with --appimage-extract-and-run (no FUSE required)
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
WorkingDirectory=$FRONTEND_DIR
ExecStart=$APPIMAGE --no-sandbox --appimage-extract-and-run
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=graphical.target
EOF
    
    echo -e "${GREEN}✓ Systemd service file created${NC}"
    
    # Reload systemd
    systemctl daemon-reload
    
    # Enable service to start on boot
    systemctl enable "$SERVICE_NAME"
    echo -e "${GREEN}✓ Service enabled for auto-start on boot${NC}"
    
    # Create desktop entry
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
    echo -e "${GREEN}✓ Desktop entry created${NC}"
    
    # Start the application now
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        systemctl stop "$SERVICE_NAME"
    fi
    systemctl start "$SERVICE_NAME"
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}✓ Application started${NC}"
    else
        echo -e "${YELLOW}⚠ Application may not have started. Check logs with: sudo journalctl -u posexpress-frontend -f${NC}"
    fi
fi

echo ""

echo -e "${YELLOW}[7/7] Configuring passwordless sudo for system operations...${NC}"
# Create sudoers file for POS system operations (shutdown, reboot, updates)
SUDOERS_FILE="/etc/sudoers.d/posexpress-system-control"
cat > "$SUDOERS_FILE" << EOF
# Allow user to reboot and shutdown without password for POS system
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/sbin/reboot, /usr/sbin/poweroff, /sbin/reboot, /sbin/poweroff
# Allow update and revert scripts without password
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/bash $SCRIPT_DIR/update-system.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/bash $SCRIPT_DIR/revert-update.sh *
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/bash $SCRIPT_DIR/update-system.sh
$ACTUAL_USER ALL=(ALL) NOPASSWD: /bin/bash $SCRIPT_DIR/revert-update.sh *
# Allow systemctl for service management
$ACTUAL_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl start posexpress-*, /usr/bin/systemctl stop posexpress-*, /usr/bin/systemctl restart posexpress-*, /usr/bin/systemctl reload nginx, /usr/bin/systemctl daemon-reload
EOF
chmod 0440 "$SUDOERS_FILE"
echo -e "${GREEN}✓ Configured passwordless sudo for system operations${NC}"
echo ""

# Configure auto-login
echo -e "${YELLOW}Configuring auto-login for $ACTUAL_USER...${NC}"

# Detect display manager and configure
if [ -f /etc/gdm3/custom.conf ]; then
    # GDM3 (GNOME Display Manager)
    echo -e "${BLUE}Detected GDM3 display manager${NC}"
    sed -i 's/^#.*AutomaticLoginEnable.*=.*false/AutomaticLoginEnable = true/' /etc/gdm3/custom.conf
    sed -i 's/^#.*AutomaticLogin.*=.*/AutomaticLogin = '"$ACTUAL_USER"'/' /etc/gdm3/custom.conf
    
    # If lines don't exist, add them
    if ! grep -q "AutomaticLoginEnable" /etc/gdm3/custom.conf; then
        sed -i '/\[daemon\]/a AutomaticLoginEnable = true' /etc/gdm3/custom.conf
        sed -i '/AutomaticLoginEnable/a AutomaticLogin = '"$ACTUAL_USER" /etc/gdm3/custom.conf
    fi
    echo -e "${GREEN}✓ GDM3 auto-login configured${NC}"
    
elif [ -f /etc/lightdm/lightdm.conf ]; then
    # LightDM
    echo -e "${BLUE}Detected LightDM display manager${NC}"
    sed -i 's/^#.*autologin-user=.*/autologin-user='"$ACTUAL_USER"'/' /etc/lightdm/lightdm.conf
    sed -i 's/^#.*autologin-user-timeout=.*/autologin-user-timeout=0/' /etc/lightdm/lightdm.conf
    
    # If lines don't exist, add them under [Seat:*]
    if ! grep -q "autologin-user" /etc/lightdm/lightdm.conf; then
        sed -i '/\[Seat:\*\]/a autologin-user='"$ACTUAL_USER" /etc/lightdm/lightdm.conf
        sed -i '/autologin-user=/a autologin-user-timeout=0' /etc/lightdm/lightdm.conf
    fi
    echo -e "${GREEN}✓ LightDM auto-login configured${NC}"
    
elif [ -f /etc/sddm.conf ] || [ -d /etc/sddm.conf.d ]; then
    # SDDM (KDE)
    echo -e "${BLUE}Detected SDDM display manager${NC}"
    SDDM_CONF="/etc/sddm.conf.d/autologin.conf"
    mkdir -p /etc/sddm.conf.d
    cat > "$SDDM_CONF" << EOF
[Autologin]
User=$ACTUAL_USER
Session=plasma
EOF
    echo -e "${GREEN}✓ SDDM auto-login configured${NC}"
    
else
    echo -e "${YELLOW}⚠ Could not detect display manager. Manual configuration may be required.${NC}"
    echo -e "${YELLOW}Common display managers: GDM3, LightDM, SDDM${NC}"
fi

echo -e "${GREEN}✓ Auto-login enabled for $ACTUAL_USER${NC}"
echo -e "${YELLOW}Note: Changes will take effect after reboot${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Frontend Deployment Complete! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your application:"
echo "  ${BLUE}Web: http://posexpress.local${NC}"
echo "  ${BLUE}or http://localhost${NC} (on server)"
if [ -n "$APPIMAGE" ]; then
    echo "  ${BLUE}Desktop: Launch from Applications menu${NC}"
    echo "  ${BLUE}or run: $APPIMAGE${NC}"
    echo ""
    echo "Auto-start: ${GREEN}ENABLED${NC} (will start on next boot)"
    echo ""
    echo "Electron app commands:"
    echo "  Start:   ${BLUE}sudo systemctl start posexpress-frontend${NC}"
    echo "  Stop:    ${BLUE}sudo systemctl stop posexpress-frontend${NC}"
    echo "  Restart: ${BLUE}sudo systemctl restart posexpress-frontend${NC}"
    echo "  Status:  ${BLUE}sudo systemctl status posexpress-frontend${NC}"
    echo "  Logs:    ${BLUE}sudo journalctl -u posexpress-frontend -f${NC}"
    echo "  Disable: ${BLUE}sudo systemctl disable posexpress-frontend${NC}"
fi
echo ""
echo "Web server commands:"
echo "  Status:  ${BLUE}sudo systemctl status nginx${NC}"
echo "  Logs:    ${BLUE}sudo tail -f /var/log/nginx/error.log${NC}"
echo ""
echo "Note: Windows users need Bonjour installed"
echo "See: WINDOWS_CLIENT_SETUP.md"
echo ""
