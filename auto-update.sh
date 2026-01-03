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
    
    # Stash any local changes
    git stash save "Auto-backup before update v$LATEST_VERSION" 2>/dev/null || true
    
    # Fetch latest changes
    git fetch origin
    
    # Checkout the latest tag/release
    if git rev-parse "v$LATEST_VERSION" >/dev/null 2>&1; then
        git checkout "v$LATEST_VERSION"
    else
        # Fallback to main/master branch
        git pull origin main 2>/dev/null || git pull origin master
    fi
    
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
    
    echo -e "${GREEN}✓ Files downloaded and extracted${NC}"
fi

# Update version file
echo "$LATEST_VERSION" > VERSION
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
    echo -e "${YELLOW}Redeploying natively...${NC}"
    echo ""
    
    # Ask what to update
    echo "What do you want to update?"
    echo "  1) Backend only"
    echo "  2) Frontend only"
    echo "  3) Both (recommended)"
    echo ""
    read -p "Enter choice [3]: " UPDATE_CHOICE
    UPDATE_CHOICE=${UPDATE_CHOICE:-3}
    
    case $UPDATE_CHOICE in
        1)
            bash "$SCRIPT_DIR/deploy-backend.sh"
            ;;
        2)
            bash "$SCRIPT_DIR/deploy-frontend.sh"
            ;;
        3)
            bash "$SCRIPT_DIR/deploy-backend.sh"
            echo ""
            bash "$SCRIPT_DIR/deploy-frontend.sh"
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
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
