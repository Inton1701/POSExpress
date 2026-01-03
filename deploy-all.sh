#!/bin/bash

# RFID POS - Full Stack Deployment Script
# Automates deployment of both backend and frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RFID POS - Full Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "What do you want to deploy?"
echo "  1) Backend only"
echo "  2) Frontend only"
echo "  3) Both (Backend first, then Frontend)"
echo ""
read -p "Enter choice [3]: " CHOICE
CHOICE=${CHOICE:-3}

case $CHOICE in
    1)
        echo -e "${GREEN}Deploying Backend only...${NC}"
        echo ""
        bash "$SCRIPT_DIR/deploy-backend.sh"
        ;;
    2)
        echo -e "${GREEN}Deploying Frontend only...${NC}"
        echo ""
        bash "$SCRIPT_DIR/deploy-frontend.sh"
        ;;
    3)
        echo -e "${GREEN}Deploying Full Stack...${NC}"
        echo ""
        echo -e "${BLUE}======== BACKEND DEPLOYMENT ========${NC}"
        bash "$SCRIPT_DIR/deploy-backend.sh"
        echo ""
        echo -e "${BLUE}======== FRONTEND DEPLOYMENT ========${NC}"
        bash "$SCRIPT_DIR/deploy-frontend.sh"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All Deployments Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
