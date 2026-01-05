#!/bin/bash
# Multi-platform build script for RFID POS System
# Builds for: Web (Docker), Windows (EXE), and Linux (AppImage/DEB)

set -e

VERSION=$(grep '"version"' frontend/package.json | head -1 | grep -oP '"\K[^"]+')
BUILD_DIR="dist-release-${VERSION}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   RFID POS System - Multi-Platform Build v${VERSION}              ║"
echo "║   Built: ${TIMESTAMP}                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js v20+."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Required for web deployment."
        exit 1
    fi
    
    print_success "All dependencies found"
    echo "  Node.js: $(node --version)"
    echo "  npm: $(npm --version)"
    echo "  Docker: $(docker --version)"
}

# Install/update npm dependencies
install_deps() {
    print_status "Installing dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Dependencies installed"
}

# Build web app (Docker)
build_web() {
    print_status "Building Web Application (Docker)..."
    echo "  (docker compose will build on first up)"
    print_success "Web build configuration ready"
}

# Build Windows EXE
build_windows() {
    print_status "Building Windows Executable..."
    
    if [[ "$OSTYPE" != "msys" && "$OSTYPE" != "win32" && "$OSTYPE" != "cygwin" ]]; then
        print_error "Windows build detected on non-Windows system"
        echo "  Note: Cross-compilation for Windows requires special setup"
        echo "  For now, run 'npm run build:electron:win' on Windows"
        return 1
    fi
    
    cd frontend
    npm run build:electron:win
    cd ..
    
    if [ -f "frontend/dist-electron/RFID-POS-System-Setup-${VERSION}.exe" ]; then
        print_success "Windows EXE built successfully"
        return 0
    else
        print_error "Windows EXE build failed"
        return 1
    fi
}

# Build Linux (AppImage + DEB)
build_linux() {
    print_status "Building Linux Packages (AppImage + DEB)..."
    
    cd frontend
    # Fix permissions on dist directory before building
    sudo chown -R posexpress:posexpress dist/ 2>/dev/null || true
    npm run build:electron:linux
    cd ..
    
    if [ -f "frontend/dist-electron/RFID-POS-System-${VERSION}.AppImage" ]; then
        print_success "Linux packages built successfully"
        return 0
    else
        print_error "Linux build failed"
        return 1
    fi
}

# Create release bundle
create_release_bundle() {
    print_status "Creating release bundle..."
    
    mkdir -p "$BUILD_DIR"
    
    # Copy Docker files
    mkdir -p "$BUILD_DIR/docker-compose"
    cp docker-compose.yml "$BUILD_DIR/docker-compose/"
    cp frontend/nginx.conf "$BUILD_DIR/docker-compose/"
    cp backend/Dockerfile "$BUILD_DIR/docker-compose/"
    cp -r backend "$BUILD_DIR/docker-compose/"
    
    # Copy Windows build
    if [ -d "frontend/dist-electron" ]; then
        mkdir -p "$BUILD_DIR/windows"
        cp frontend/dist-electron/*.exe "$BUILD_DIR/windows/" 2>/dev/null || true
    fi
    
    # Copy Linux builds
    if [ -d "frontend/dist-electron" ]; then
        mkdir -p "$BUILD_DIR/linux"
        cp frontend/dist-electron/*.AppImage "$BUILD_DIR/linux/" 2>/dev/null || true
        cp frontend/dist-electron/*.deb "$BUILD_DIR/linux/" 2>/dev/null || true
    fi
    
    # Create README for release
    cat > "$BUILD_DIR/README.md" << 'EOF'
# RFID POS System - Release Package

## Contents

- **docker-compose/** - Web deployment files
- **windows/** - Windows desktop application (.exe)
- **linux/** - Linux desktop applications (.AppImage, .deb)

## Quick Start

### Web Deployment (Linux/Cloud)
```bash
cd docker-compose
docker compose up -d
```

### Windows Desktop
```bash
windows/RFID-POS-System-Setup-1.0.0.exe
```

### Linux Desktop
```bash
# AppImage (portable)
chmod +x linux/RFID-POS-System-1.0.0.AppImage
./linux/RFID-POS-System-1.0.0.AppImage

# Or Debian package
sudo apt install ./linux/rfidpos-system-1.0.0.deb
```

## Documentation
See DEPLOYMENT_GUIDE.md for complete setup instructions.
EOF
    
    # Create checksums
    cd "$BUILD_DIR"
    echo "Creating checksums..."
    find . -type f ! -name 'SHA256SUMS' -exec sha256sum {} \; > SHA256SUMS || true
    cd ..
    
    print_success "Release bundle created: $BUILD_DIR/"
}

# Main build workflow
main() {
    check_dependencies
    echo ""
    
    # Ask what to build
    echo -e "${YELLOW}What would you like to build?${NC}"
    echo "1) Web only (Docker)"
    echo "2) Windows EXE only"
    echo "3) Linux only (AppImage + DEB)"
    echo "4) All platforms"
    echo "5) Exit"
    echo ""
    read -p "Enter choice (1-5): " choice
    
    case $choice in
        1)
            install_deps
            build_web
            ;;
        2)
            install_deps
            build_windows
            ;;
        3)
            install_deps
            build_linux
            ;;
        4)
            install_deps
            build_web
            echo ""
            if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
                build_windows
            else
                print_error "Windows build must be done on Windows"
            fi
            echo ""
            if [[ "$OSTYPE" == "linux-gnu"* ]] || command -v wsl.exe &> /dev/null; then
                build_linux
            else
                print_error "Linux build must be done on Linux or WSL2"
            fi
            create_release_bundle
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    Build Complete!                            ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Test each built application"
    echo "2. Review DEPLOYMENT_GUIDE.md for deployment instructions"
    echo "3. Upload builds to your distribution platform"
    echo ""
}

# Run main
main "$@"
