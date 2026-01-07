#!/bin/bash

# RFID POS - Automated Update Script
# Pulls latest version from GitHub and redeploys

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITHUB_REPO="Inton1701/POSExpress"  # Update with your actual repo
BACKUP_DIR="$HOME/posexpress-backups"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RFID POS - Auto Update${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

cd "$SCRIPT_DIR"

# Get current version
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "unknown")
echo "Current version: v$CURRENT_VERSION"
echo ""

# Fetch latest release info from GitHub
echo -e "${YELLOW}Checking GitHub for updates...${NC}"
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$GITHUB_REPO/releases/latest")

if [ -z "$LATEST_RELEASE" ] || echo "$LATEST_RELEASE" | grep -q "Not Found"; then
    echo -e "${RED}Error: Could not fetch release information from GitHub${NC}"
    echo "Make sure the repository has at least one release published"
    exit 1
fi

LATEST_VERSION=$(echo "$LATEST_RELEASE" | grep -oP '"tag_name":\s*"\K[^"]+' | sed 's/v//')
RELEASE_URL=$(echo "$LATEST_RELEASE" | grep -oP '"html_url":\s*"\K[^"]+' | head -1)

echo "Latest version: v$LATEST_VERSION"
echo ""

# Compare versions
if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
    echo -e "${GREEN}✓ Already up to date!${NC}"
    exit 0
fi

# Ask for confirmation
echo -e "${YELLOW}Update available: v$CURRENT_VERSION → v$LATEST_VERSION${NC}"
echo "Release: $RELEASE_URL"
echo ""
read -p "Do you want to update? (y/n) [y]: " CONFIRM
CONFIRM=${CONFIRM:-y}

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Update cancelled"
    exit 0
fi

# Create backup
echo ""
echo -e "${YELLOW}Creating backup...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup-v$CURRENT_VERSION-$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

# Backup important files
cp -r backend/models backend/controllers backend/routes "$BACKUP_PATH/" 2>/dev/null || true
cp -r frontend/src "$BACKUP_PATH/" 2>/dev/null || true
cp backend/.env "$BACKUP_PATH/backend.env" 2>/dev/null || true
cp frontend/.env "$BACKUP_PATH/frontend.env" 2>/dev/null || true
cp VERSION "$BACKUP_PATH/" 2>/dev/null || true

echo -e "${GREEN}✓ Backup created: $BACKUP_PATH${NC}"
echo ""

# Check if this is a git repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}Updating from git repository...${NC}"
    
    # Save current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "Current branch: $CURRENT_BRANCH"
    
    # Stash any local changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo "Stashing local changes..."
        git stash save "Auto-backup before update v$LATEST_VERSION - $(date +%Y%m%d-%H%M%S)" 2>/dev/null || true
    fi
    
    # Fetch all changes including tags
    echo "Fetching latest changes..."
    git fetch origin --tags --force
    
    # Try to pull the latest changes from current branch
    echo "Pulling latest from $CURRENT_BRANCH..."
    if git pull origin "$CURRENT_BRANCH" 2>/dev/null; then
        echo -e "${GREEN}✓ Successfully pulled from $CURRENT_BRANCH${NC}"
    elif git pull origin main 2>/dev/null; then
        echo -e "${GREEN}✓ Successfully pulled from main${NC}"
    elif git pull origin master 2>/dev/null; then
        echo -e "${GREEN}✓ Successfully pulled from master${NC}"
    else
        echo -e "${YELLOW}Warning: Could not pull from remote, trying tag checkout...${NC}"
        
        # Fetch the specific tag if pull failed
        if git rev-parse "v$LATEST_VERSION" >/dev/null 2>&1; then
            echo "Checking out tag v$LATEST_VERSION..."
            git checkout "v$LATEST_VERSION" -f
        else
            echo -e "${RED}Error: Could not update repository${NC}"
            exit 1
        fi
    fi
    
    # Update VERSION file with latest version
    echo "$LATEST_VERSION" > VERSION
    git add VERSION 2>/dev/null || true
    
    echo -e "${GREEN}✓ Code updated from git${NC}"
else
    echo -e "${YELLOW}Not a git repository, downloading archive...${NC}"
    
    # Download the latest release archive
    ARCHIVE_URL="https://github.com/$GITHUB_REPO/archive/refs/tags/v$LATEST_VERSION.tar.gz"
    TEMP_DIR="/tmp/posexpress-update-$TIMESTAMP"
    
    mkdir -p "$TEMP_DIR"
    curl -L "$ARCHIVE_URL" -o "$TEMP_DIR/release.tar.gz"
    
    # Extract and copy files
    cd "$TEMP_DIR"
    tar -xzf release.tar.gz
    
    # Find extracted directory
    EXTRACTED_DIR=$(find . -maxdepth 1 -type d -name "POSExpress-*" | head -1)
    
    if [ -z "$EXTRACTED_DIR" ]; then
        echo -e "${RED}Error: Could not find extracted files${NC}"
        exit 1
    fi
    
    # Copy files (excluding .env to preserve configuration)
    rsync -av --exclude='.env' --exclude='node_modules' --exclude='dist' "$EXTRACTED_DIR/" "$SCRIPT_DIR/"
    
    cd "$SCRIPT_DIR"
    rm -rf "$TEMP_DIR"
    
    # Update version file
    echo "$LATEST_VERSION" > VERSION
    
    echo -e "${GREEN}✓ Files downloaded and extracted${NC}"
fi

echo -e "${GREEN}✓ Version updated to v$LATEST_VERSION${NC}"
echo ""

# Fix ownership of all files
echo -e "${YELLOW}Fixing file ownership...${NC}"
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$SCRIPT_DIR"
echo -e "${GREEN}✓ Ownership corrected${NC}"
echo ""

# Detect deployment type
DEPLOY_TYPE="native"
if command -v docker &> /dev/null && docker ps &> /dev/null; then
    if docker ps | grep -q "posexpress"; then
        DEPLOY_TYPE="docker"
    fi
fi

echo -e "${YELLOW}Detected deployment: $DEPLOY_TYPE${NC}"
echo ""

# Redeploy based on deployment type
if [ "$DEPLOY_TYPE" = "docker" ]; then
    echo -e "${YELLOW}Redeploying with Docker...${NC}"
    docker compose down
    docker compose up --build -d
    
    echo -e "${GREEN}✓ Docker containers redeployed${NC}"
    
else
    echo -e "${YELLOW}Performing silent update with existing configuration...${NC}"
    echo ""
    
    # Check if running with sudo
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Error: Update requires root privileges${NC}"
        echo "Please run this script with sudo"
        exit 1
    fi
    
    # Get actual user
    ACTUAL_USER="${SUDO_USER:-$USER}"
    if [ "$ACTUAL_USER" = "root" ]; then
        echo -e "${RED}Error: Please run with sudo as a regular user${NC}"
        exit 1
    fi
    
    # Determine what needs updating
    UPDATE_BACKEND=false
    UPDATE_FRONTEND=false
    
    if [ -d "$SCRIPT_DIR/backend" ]; then
        UPDATE_BACKEND=true
    fi
    
    if [ -d "$SCRIPT_DIR/frontend" ]; then
        UPDATE_FRONTEND=true
    fi
    
    # ==================== BACKEND UPDATE ====================
    if [ "$UPDATE_BACKEND" = true ]; then
        echo -e "${BLUE}[Backend] Starting silent update...${NC}"
        cd "$SCRIPT_DIR/backend"
        
        # Check if .env exists
        if [ -f ".env" ]; then
            echo -e "${GREEN}✓ Preserving existing backend .env${NC}"
            BACKEND_ENV_BACKUP=$(cat .env)
        else
            echo -e "${YELLOW}⚠ No existing .env found, skipping backend${NC}"
        fi
        
        # Clean and reinstall dependencies
        echo "Cleaning cache..."
        rm -rf node_modules/.cache
        
        echo "Installing dependencies..."
        sudo -u "$ACTUAL_USER" npm install --production 2>&1 | grep -E "(added|removed|changed|audited|up to date)" || true
        
        echo -e "${GREEN}✓ Backend dependencies updated${NC}"
        
        # Restart backend service if it exists
        if systemctl list-unit-files | grep -q "posexpress-backend.service"; then
            echo "Restarting backend service..."
            systemctl restart posexpress-backend
            sleep 2
            
            if systemctl is-active --quiet posexpress-backend; then
                echo -e "${GREEN}✓ Backend service restarted${NC}"
            else
                echo -e "${YELLOW}⚠ Backend service may not have started properly${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Backend service not configured, skipping restart${NC}"
        fi
        
        echo ""
    fi
    
    # ==================== FRONTEND UPDATE ====================
    if [ "$UPDATE_FRONTEND" = true ]; then
        echo -e "${BLUE}[Frontend] Starting silent update...${NC}"
        cd "$SCRIPT_DIR/frontend"
        
        # Check if .env exists
        if [ -f ".env" ]; then
            echo -e "${GREEN}✓ Preserving existing frontend .env${NC}"
            FRONTEND_ENV_BACKUP=$(cat .env)
        else
            echo -e "${YELLOW}⚠ No existing .env found, creating default${NC}"
            echo "VITE_API_URL=http://posexpress.local/api" > .env
        fi
        
        # Clean previous build
        echo "Cleaning previous build..."
        sudo -u "$ACTUAL_USER" bash -c "cd '$SCRIPT_DIR/frontend' && rm -rf dist dist-electron node_modules/.vite"
        
        # Install dependencies
        echo "Installing dependencies..."
        sudo -u "$ACTUAL_USER" bash -c "cd '$SCRIPT_DIR/frontend' && npm install --ignore-scripts" 2>&1 | grep -E "(added|removed|changed|audited|up to date)" || true
        
        # Build Vue app
        echo "Building Vue application..."
        sudo -u "$ACTUAL_USER" bash -c "cd '$SCRIPT_DIR/frontend' && npm run build" 2>&1 | grep -E "(Building|built in|error|ERROR)" || true
        
        if [ -d "dist" ]; then
            echo -e "${GREEN}✓ Vue app built successfully${NC}"
            
            # Deploy to Nginx if available
            if command -v nginx &> /dev/null; then
                echo "Deploying to Nginx..."
                rm -rf /var/www/html/*
                cp -r dist/* /var/www/html/
                chown -R www-data:www-data /var/www/html
                chmod -R 755 /var/www/html
                systemctl reload nginx 2>/dev/null || true
                echo -e "${GREEN}✓ Deployed to Nginx${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Vue build may have failed${NC}"
        fi
        
        # Build Electron app (Linux)
        echo "Building Electron Linux application (this may take several minutes)..."
        
        # Stop running Electron service if exists
        if systemctl list-unit-files | grep -q "posexpress-frontend.service"; then
            echo "Stopping Electron service..."
            systemctl stop posexpress-frontend 2>/dev/null || true
            sleep 2
        fi
        
        # Clean old Electron builds
        sudo -u "$ACTUAL_USER" bash -c "cd '$SCRIPT_DIR/frontend' && rm -rf dist-electron"
        
        # Build Electron app
        sudo -u "$ACTUAL_USER" bash -c "cd '$SCRIPT_DIR/frontend' && npm run electron:build" 2>&1 | grep -E "(Building|Packaging|error|ERROR)" || true
        
        # Find the built AppImage
        APPIMAGE=$(find "$SCRIPT_DIR/frontend/dist-electron" -name "*.AppImage" -type f | head -n 1)
        
        if [ -n "$APPIMAGE" ]; then
            echo -e "${GREEN}✓ Electron app built: $(basename "$APPIMAGE")${NC}"
            
            # Make it executable
            chmod +x "$APPIMAGE"
            
            # Update systemd service if it exists
            if systemctl list-unit-files | grep -q "posexpress-frontend.service"; then
                echo "Updating Electron service..."
                
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
                systemctl restart posexpress-frontend
                sleep 2
                
                if systemctl is-active --quiet posexpress-frontend; then
                    echo -e "${GREEN}✓ Electron service updated and restarted${NC}"
                else
                    echo -e "${YELLOW}⚠ Electron service may not have started properly${NC}"
                fi
            else
                echo -e "${YELLOW}⚠ Electron service not configured${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Electron AppImage not found, skipping service update${NC}"
        fi
        
        echo ""
    fi
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  Silent Update Complete${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Updated components:"
    [ "$UPDATE_BACKEND" = true ] && echo "  ✓ Backend API"
    [ "$UPDATE_FRONTEND" = true ] && echo "  ✓ Frontend Web App"
    [ -n "$APPIMAGE" ] && echo "  ✓ Electron Desktop App (Linux)"
    echo ""
    echo "All existing configurations (.env files) have been preserved."
    echo "Services have been automatically restarted."
    echo ""
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Update Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Updated: v$CURRENT_VERSION → v$LATEST_VERSION"
echo "Backup location: $BACKUP_PATH"
echo ""
echo "If you encounter any issues, restore from backup:"
echo "  cp -r $BACKUP_PATH/backend.env backend/.env"
echo "  cp -r $BACKUP_PATH/frontend.env frontend/.env"
echo ""
