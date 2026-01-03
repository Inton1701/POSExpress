#!/bin/bash

# RFID POS - LAN Network Configuration Script
# Automates: Avahi installation, hostname setup, .local domain configuration, firewall rules

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RFID POS - LAN Network Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${YELLOW}Warning: Running as root. This is fine, but not required.${NC}"
    SUDO=""
else
    SUDO="sudo"
fi

# Step 1: Install Avahi (mDNS service)
echo -e "${YELLOW}[1/5] Installing Avahi mDNS service...${NC}"

if command -v avahi-daemon &> /dev/null; then
    echo -e "${GREEN}✓ Avahi is already installed${NC}"
else
    echo "Installing avahi-daemon and avahi-utils..."
    $SUDO apt update
    $SUDO apt install -y avahi-daemon avahi-utils
    echo -e "${GREEN}✓ Avahi installed successfully${NC}"
fi
echo ""

# Step 2: Configure hostname
echo -e "${YELLOW}[2/5] Configuring hostname...${NC}"

# Get current hostname
CURRENT_HOSTNAME=$(hostname)
echo "Current hostname: $CURRENT_HOSTNAME"

# Prompt for desired hostname
read -p "Enter desired hostname [posexpress]: " HOSTNAME
HOSTNAME=${HOSTNAME:-posexpress}

if [ "$CURRENT_HOSTNAME" = "$HOSTNAME" ]; then
    echo -e "${GREEN}✓ Hostname is already set to $HOSTNAME${NC}"
else
    echo "Setting hostname to $HOSTNAME..."
    $SUDO hostnamectl set-hostname "$HOSTNAME"
    
    # Update /etc/hosts
    $SUDO sed -i "s/127.0.1.1.*/127.0.1.1\t$HOSTNAME/" /etc/hosts
    
    # If the entry doesn't exist, add it
    if ! grep -q "127.0.1.1" /etc/hosts; then
        echo "127.0.1.1	$HOSTNAME" | $SUDO tee -a /etc/hosts > /dev/null
    fi
    
    echo -e "${GREEN}✓ Hostname set to $HOSTNAME${NC}"
fi
echo ""

# Step 3: Start and enable Avahi service
echo -e "${YELLOW}[3/5] Starting Avahi service...${NC}"

$SUDO systemctl start avahi-daemon
$SUDO systemctl enable avahi-daemon

# Check if service is running
if systemctl is-active --quiet avahi-daemon; then
    echo -e "${GREEN}✓ Avahi service is running${NC}"
else
    echo -e "${RED}Error: Avahi service failed to start${NC}"
    echo "Check logs: sudo journalctl -u avahi-daemon -n 50"
    exit 1
fi
echo ""

# Step 4: Configure firewall (if ufw is active)
echo -e "${YELLOW}[4/5] Configuring firewall...${NC}"

if command -v ufw &> /dev/null; then
    # Check if UFW is installed
    UFW_STATUS=$($SUDO ufw status | head -1)
    
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        echo "UFW firewall is active. Configuring ports..."
        
        # Allow HTTP (Nginx web server)
        $SUDO ufw allow 80/tcp comment 'HTTP - Web Access'
        echo -e "${GREEN}✓ Port 80/tcp (HTTP) opened${NC}"
        
        # Allow HTTPS (if using SSL in future)
        $SUDO ufw allow 443/tcp comment 'HTTPS - Secure Web Access'
        echo -e "${GREEN}✓ Port 443/tcp (HTTPS) opened${NC}"
        
        # Allow mDNS for .local domain resolution
        $SUDO ufw allow 5353/udp comment 'mDNS - .local domain'
        echo -e "${GREEN}✓ Port 5353/udp (mDNS) opened${NC}"
        
        # Optional: Allow SSH (usually already open)
        $SUDO ufw allow 22/tcp comment 'SSH - Remote Access'
        echo -e "${GREEN}✓ Port 22/tcp (SSH) opened${NC}"
        
        echo ""
        echo "Firewall rules configured for:"
        echo "  • Web access (HTTP/HTTPS): ports 80, 443"
        echo "  • mDNS (.local domains): port 5353/udp"
        echo "  • SSH (remote management): port 22"
    else
        echo "UFW is installed but inactive."
        read -p "Do you want to enable UFW firewall? (y/n) [y]: " ENABLE_FW
        ENABLE_FW=${ENABLE_FW:-y}
        
        if [[ "$ENABLE_FW" =~ ^[Yy]$ ]]; then
            # Configure rules before enabling
            $SUDO ufw allow 80/tcp comment 'HTTP - Web Access'
            $SUDO ufw allow 443/tcp comment 'HTTPS - Secure Web Access'
            $SUDO ufw allow 5353/udp comment 'mDNS - .local domain'
            $SUDO ufw allow 22/tcp comment 'SSH - Remote Access'
            
            # Enable firewall
            echo "y" | $SUDO ufw enable
            echo -e "${GREEN}✓ Firewall enabled and configured${NC}"
        else
            echo -e "${YELLOW}Firewall not enabled (not recommended for production)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}UFW not installed. Installing...${NC}"
    $SUDO apt install -y ufw
    
    # Configure rules
    $SUDO ufw allow 80/tcp comment 'HTTP - Web Access'
    $SUDO ufw allow 443/tcp comment 'HTTPS - Secure Web Access'
    $SUDO ufw allow 5353/udp comment 'mDNS - .local domain'
    $SUDO ufw allow 22/tcp comment 'SSH - Remote Access'
    
    # Enable firewall
    read -p "Enable firewall now? (y/n) [y]: " ENABLE_FW
    ENABLE_FW=${ENABLE_FW:-y}
    
    if [[ "$ENABLE_FW" =~ ^[Yy]$ ]]; then
        echo "y" | $SUDO ufw enable
        echo -e "${GREEN}✓ Firewall installed and enabled${NC}"
    else
        echo -e "${YELLOW}Firewall installed but not enabled${NC}"
    fi
fi
echo ""

# Step 5: Verify configuration
echo -e "${YELLOW}[5/5] Verifying mDNS configuration...${NC}"

# Wait a moment for avahi to start broadcasting
sleep 2

# Display hostname info
echo "Hostname verification:"
echo "  Hostname: $(hostname)"
echo "  FQDN: $(hostname -f)"
echo ""

# Test mDNS resolution
echo "Testing mDNS resolution..."
if command -v avahi-resolve &> /dev/null; then
    if avahi-resolve -4 -n "$HOSTNAME.local" &> /dev/null; then
        RESOLVED_IP=$(avahi-resolve -4 -n "$HOSTNAME.local" | awk '{print $2}')
        echo -e "${GREEN}✓ mDNS resolution successful!${NC}"
        echo "  $HOSTNAME.local resolves to: $RESOLVED_IP"
    else
        echo -e "${YELLOW}⚠ mDNS resolution not yet available (may need a reboot)${NC}"
    fi
fi
echo ""

# Browse for services
echo "Active mDNS services on this host:"
if command -v avahi-browse &> /dev/null; then
    timeout 3 avahi-browse -a -t -r 2>/dev/null | grep "hostname = \[$HOSTNAME.local\]" || echo "  (Services will appear after full configuration)"
fi
echo ""

# Display network interfaces
echo "Network interfaces:"
ip -4 addr show | grep -E "^[0-9]+:|inet " | grep -v "127.0.0.1"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  mDNS Setup Complete! 🌐${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Access your server from any device on the LAN:${NC}"
echo "  Web: http://$HOSTNAME.local"
echo "  API: http://$HOSTNAME.local/api/health"
echo ""
echo -e "${YELLOW}Important:${NC}"
echo "  • Works on Windows, Mac, Linux, tablets, and phones"
echo "  • No configuration needed on client devices"
echo "  • Domain works even if IP address changes"
echo "  • All devices must be on the same network/WiFi"
echo ""
echo -e "${YELLOW}Reboot recommended:${NC}"
read -p "Do you want to reboot now to complete setup? (y/n) [n]: " REBOOT
REBOOT=${REBOOT:-n}

if [[ "$REBOOT" =~ ^[Yy]$ ]]; then
    echo "Rebooting in 5 seconds... (Ctrl+C to cancel)"
    sleep 5
    $SUDO reboot
else
    echo ""
    echo "To apply all changes, reboot later with: sudo reboot"
    echo ""
    echo "To verify after reboot, run:"
    echo "  hostname -f          # Should show: $HOSTNAME.local"
    echo "  avahi-browse -a      # Browse all mDNS services"
    echo "  ping $HOSTNAME.local # Test from another computer"
fi
echo ""
