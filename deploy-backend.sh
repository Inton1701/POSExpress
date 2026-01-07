#!/bin/bash

# RFID POS - Backend Deployment Script
# Automates: .env configuration, clean deployment, systemd service setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RFID POS - Backend Deployment${NC}"
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
BACKEND_DIR="$SCRIPT_DIR/backend"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Backend directory not found at $BACKEND_DIR${NC}"
    exit 1
fi

cd "$BACKEND_DIR"

# Step 1: Clean deployment
echo -e "${YELLOW}[1/5] Cleaning previous deployment...${NC}"
rm -rf node_modules/.cache
echo -e "${GREEN}✓ Cleaned cache${NC}"
echo ""

# Step 1.5: Fix ownership
echo -e "${YELLOW}[1.5/6] Fixing file ownership...${NC}"
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$BACKEND_DIR"
echo -e "${GREEN}✓ Ownership fixed${NC}"
echo ""

# Step 2: Install/Update dependencies
echo -e "${YELLOW}[2/6] Installing dependencies...${NC}"
sudo -u "$ACTUAL_USER" npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Configure .env
echo -e "${YELLOW}[3/6] Configuring .env file...${NC}"

# Check if .env exists and ask if user wants to keep it
if [ -f ".env" ]; then
    echo "Existing .env file found."
    read -p "Do you want to keep the existing .env? (y/n) [y]: " KEEP_ENV
    KEEP_ENV=${KEEP_ENV:-y}
    
    if [[ "$KEEP_ENV" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}✓ Keeping existing .env file${NC}"
    else
        rm .env
        echo "Existing .env removed."
    fi
fi

# Create new .env if it doesn't exist
if [ ! -f ".env" ]; then
    # Prompt for configuration
    read -p "Enter PORT [5000]: " PORT
    PORT=${PORT:-5000}
    
    read -p "Enter MongoDB URI [mongodb://localhost:27017/posexpress]: " MONGODB_URI
    MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/posexpress}
    
    read -p "Enter NODE_ENV [production]: " NODE_ENV
    NODE_ENV=${NODE_ENV:-production}
    
    # Generate JWT secret
    echo "Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    
    # Create .env file
    cat > .env << EOF
PORT=$PORT
MONGODB_URI=$MONGODB_URI
JWT_SECRET=$JWT_SECRET
NODE_ENV=$NODE_ENV
EOF
    
    echo -e "${GREEN}✓ .env file created${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Save this JWT secret securely!${NC}"
    echo "JWT_SECRET=$JWT_SECRET"
    echo ""
    read -p "Press Enter to continue..."
else
    echo -e "${GREEN}✓ Using existing .env configuration${NC}"
fi
echo ""

# Step 4: Check MongoDB connection
echo -e "${YELLOW}[4/6] Checking MongoDB connection...${NC}"
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo -e "${YELLOW}Warning: MongoDB client not found. Skipping connection check.${NC}"
else
    # Extract MongoDB URI from .env
    MONGO_URI=$(grep MONGODB_URI .env | cut -d '=' -f2)
    if mongosh "$MONGO_URI" --eval "db.runCommand({ ping: 1 })" &> /dev/null || mongo "$MONGO_URI" --eval "db.runCommand({ ping: 1 })" &> /dev/null; then
        echo -e "${GREEN}✓ MongoDB connection successful${NC}"
    else
        echo -e "${RED}Error: Cannot connect to MongoDB${NC}"
        echo "Make sure MongoDB is running: sudo systemctl start mongod"
        exit 1
    fi
fi
echo ""

# Step 5: Create systemd service
echo -e "${YELLOW}[5/6] Setting up systemd service...${NC}"

SERVICE_NAME="posexpress-backend"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

# Create systemd service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=RFID POS Express Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=/usr/bin/node $BACKEND_DIR/app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security settings
# NoNewPrivileges disabled to allow system updates and shutdowns via sudo
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Systemd service file created${NC}"

# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable "$SERVICE_NAME"
echo -e "${GREEN}✓ Service enabled for auto-start on boot${NC}"

# Stop existing service if running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "Stopping existing service..."
    systemctl stop "$SERVICE_NAME"
fi

# Start the service
echo "Starting backend service..."
systemctl start "$SERVICE_NAME"

# Wait a moment for service to start
sleep 2

# Check if service started successfully
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✓ Backend service started successfully${NC}"
else
    echo -e "${RED}Error: Service failed to start${NC}"
    echo "Check logs with: journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi
echo ""

# Step 6: Create admin user
echo -e "${YELLOW}[6/6] Creating admin user...${NC}"
read -p "Do you want to create/reset admin user? (y/n) [y]: " CREATE_ADMIN
CREATE_ADMIN=${CREATE_ADMIN:-y}

if [[ "$CREATE_ADMIN" =~ ^[Yy]$ ]]; then
    if [ -f "seedAdmin.js" ]; then
        sudo -u "$ACTUAL_USER" node seedAdmin.js
        echo -e "${GREEN}✓ Admin user created/reset${NC}"
    else
        echo -e "${YELLOW}Warning: seedAdmin.js not found${NC}"
    fi
fi
echo ""

# Display status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backend Deployment Complete! 🚀${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Service Status:"
systemctl status "$SERVICE_NAME" --no-pager -l
echo ""
echo "Backend API: http://localhost:$(grep PORT .env | cut -d '=' -f2)/api/health"
echo ""
echo "Useful commands:"
echo "  View logs:    ${BLUE}sudo journalctl -u $SERVICE_NAME -f${NC}"
echo "  Restart:      ${BLUE}sudo systemctl restart $SERVICE_NAME${NC}"
echo "  Stop:         ${BLUE}sudo systemctl stop $SERVICE_NAME${NC}"
echo "  Status:       ${BLUE}sudo systemctl status $SERVICE_NAME${NC}"
echo "  Disable boot: ${BLUE}sudo systemctl disable $SERVICE_NAME${NC}"
echo ""
