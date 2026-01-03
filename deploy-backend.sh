#!/bin/bash

# RFID POS - Backend Deployment Script
# Automates: .env configuration, clean deployment, PM2 restart

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RFID POS - Backend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

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

# Step 2: Install/Update dependencies
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Configure .env
echo -e "${YELLOW}[3/5] Configuring .env file...${NC}"

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
echo -e "${YELLOW}[4/5] Checking MongoDB connection...${NC}"
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

# Step 5: Deploy with PM2
echo -e "${YELLOW}[5/5] Deploying with PM2...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}Error: PM2 is not installed. Installing now...${NC}"
    sudo npm install -g pm2
fi

PM2_APP_NAME="posexpress-backend"

# Check if app is already running
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo "Stopping existing PM2 process..."
    pm2 stop "$PM2_APP_NAME"
    pm2 delete "$PM2_APP_NAME"
    echo -e "${GREEN}✓ Stopped existing process${NC}"
fi

# Start with PM2
echo "Starting backend with PM2..."
pm2 start app.js --name "$PM2_APP_NAME" --time

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✓ Backend started with PM2${NC}"
echo ""

# Create admin user
echo -e "${YELLOW}Creating admin user...${NC}"
read -p "Do you want to create/reset admin user? (y/n) [y]: " CREATE_ADMIN
CREATE_ADMIN=${CREATE_ADMIN:-y}

if [[ "$CREATE_ADMIN" =~ ^[Yy]$ ]]; then
    if [ -f "seedAdmin.js" ]; then
        node seedAdmin.js
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
echo "PM2 Status:"
pm2 status
echo ""
echo "Backend API: http://localhost:$(grep PORT .env | cut -d '=' -f2)/api/health"
echo ""
echo "Useful commands:"
echo "  View logs:    pm2 logs $PM2_APP_NAME"
echo "  Restart:      pm2 restart $PM2_APP_NAME"
echo "  Stop:         pm2 stop $PM2_APP_NAME"
echo "  Monitor:      pm2 monit"
echo ""
