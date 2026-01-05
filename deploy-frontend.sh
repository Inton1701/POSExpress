#!/bin/bash

# RFID POS - Frontend Deployment Script
# Automates: clean deployment, rebuild, .env configuration, nginx hosting, and electron app build

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RFID POS - Frontend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

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
echo -e "${YELLOW}[1/6] Cleaning previous deployment...${NC}"
rm -rf dist dist-electron node_modules/.vite
echo -e "${GREEN}✓ Cleaned dist, dist-electron, and vite cache${NC}"
echo ""

# Step 2: Install/Update dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
npm install --ignore-scripts || npm install --legacy-peer-deps --ignore-scripts
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Configure .env
echo -e "${YELLOW}[3/6] Configuring .env file...${NC}"

# Prompt for API URL (with default)
read -p "Enter API URL [http://posexpress.local/api]: " API_URL
API_URL=${API_URL:-http://posexpress.local/api}

# Create .env file
cat > .env << EOF
VITE_API_URL=$API_URL
EOF

echo -e "${GREEN}✓ .env file created with API_URL=$API_URL${NC}"
echo ""

# Step 4: Build Vue app
echo -e "${YELLOW}[4/6] Building Vue application...${NC}"
npm run build
echo -e "${GREEN}✓ Vue app built successfully${NC}"
echo ""

# Step 5: Deploy to Nginx
echo -e "${YELLOW}[5/6] Deploying to Nginx...${NC}"

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
echo -e "${YELLOW}[6/6] Building Electron Linux application...${NC}"
read -p "Do you want to build the Electron app? (y/n) [y]: " BUILD_ELECTRON
BUILD_ELECTRON=${BUILD_ELECTRON:-y}

if [[ "$BUILD_ELECTRON" =~ ^[Yy]$ ]]; then
    # Fix permissions on dist directory before building
    sudo chown -R posexpress:posexpress dist/ 2>/dev/null || true
    npm run build:electron:linux
    echo -e "${GREEN}✓ Electron app built successfully${NC}"
    echo -e "${GREEN}  Output: $FRONTEND_DIR/dist-electron/${NC}"
    
    # List generated files
    echo ""
    echo "Generated files:"
    ls -lh dist-electron/*.AppImage 2>/dev/null || true
    ls -lh dist-electron/*.deb 2>/dev/null || true
else
    echo -e "${YELLOW}Skipped Electron build${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Frontend Deployment Complete! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access your application:"
echo "  Web: http://posexpress.local"
echo "  or http://localhost (on server)"
echo ""
echo "Note: Windows users need Bonjour installed"
echo "See: WINDOWS_CLIENT_SETUP.md"
echo ""
echo "Nginx status: sudo systemctl status nginx"
echo "View logs: sudo tail -f /var/log/nginx/error.log"
echo ""
