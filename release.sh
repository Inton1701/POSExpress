#!/bin/bash

# RFID POS - Automated Release Script
# Handles version bumping, git tagging, and GitHub release creation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  RFID POS - Release Manager${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository${NC}"
    echo "Initialize git first: git init"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    git status --short
    echo ""
    read -p "Commit these changes first? (y/n) [y]: " COMMIT_FIRST
    COMMIT_FIRST=${COMMIT_FIRST:-y}
    
    if [[ "$COMMIT_FIRST" =~ ^[Yy]$ ]]; then
        read -p "Commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✓ Changes committed${NC}"
        echo ""
    else
        echo -e "${YELLOW}Proceeding with uncommitted changes...${NC}"
        echo ""
    fi
fi

# Get current version
if [ ! -f "VERSION" ]; then
    echo "1.0.0" > VERSION
    echo -e "${YELLOW}Created VERSION file with initial version 1.0.0${NC}"
fi

CURRENT_VERSION=$(cat VERSION)
echo "Current version: v$CURRENT_VERSION"
echo ""

# Parse version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Ask for version bump type
echo "Select version bump type:"
echo "  1) Patch (bug fixes)        v$MAJOR.$MINOR.$PATCH → v$MAJOR.$MINOR.$((PATCH + 1))"
echo "  2) Minor (new features)     v$MAJOR.$MINOR.$PATCH → v$MAJOR.$((MINOR + 1)).0"
echo "  3) Major (breaking changes) v$MAJOR.$MINOR.$PATCH → v$((MAJOR + 1)).0.0"
echo "  4) Custom version"
echo "  5) Keep current version (just tag)"
echo ""
read -p "Enter choice [1]: " VERSION_TYPE
VERSION_TYPE=${VERSION_TYPE:-1}

case $VERSION_TYPE in
    1)
        NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        BUMP_TYPE="patch"
        ;;
    2)
        NEW_VERSION="$MAJOR.$((MINOR + 1)).0"
        BUMP_TYPE="minor"
        ;;
    3)
        NEW_VERSION="$((MAJOR + 1)).0.0"
        BUMP_TYPE="major"
        ;;
    4)
        read -p "Enter custom version (e.g., 2.0.0-beta.1): " NEW_VERSION
        BUMP_TYPE="custom"
        ;;
    5)
        NEW_VERSION="$CURRENT_VERSION"
        BUMP_TYPE="none"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}New version: v$NEW_VERSION${NC}"
echo ""

# Update VERSION file if version changed
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
    echo "$NEW_VERSION" > VERSION
    echo -e "${GREEN}✓ Updated VERSION file${NC}"
    
    # Update package.json files if they exist
    if [ -f "frontend/package.json" ]; then
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
        rm -f frontend/package.json.bak
        echo -e "${GREEN}✓ Updated frontend/package.json${NC}"
    fi
    
    if [ -f "backend/package.json" ]; then
        sed -i.bak "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" backend/package.json
        rm -f backend/package.json.bak
        echo -e "${GREEN}✓ Updated backend/package.json${NC}"
    fi
    
    # Commit version changes
    git add VERSION frontend/package.json backend/package.json 2>/dev/null || git add VERSION
    git commit -m "chore: bump version to v$NEW_VERSION" 2>/dev/null || true
    echo -e "${GREEN}✓ Version changes committed${NC}"
fi

echo ""

# Release notes
echo -e "${YELLOW}Enter release notes (press Ctrl+D when done):${NC}"
echo "Example:"
echo "## What's New"
echo "- Added feature X"
echo "- Fixed bug Y"
echo "- Improved performance Z"
echo ""
RELEASE_NOTES=$(cat)

if [ -z "$RELEASE_NOTES" ]; then
    RELEASE_NOTES="Release v$NEW_VERSION"
fi

# Save release notes to file
RELEASE_FILE="releases/v$NEW_VERSION.md"
mkdir -p releases
cat > "$RELEASE_FILE" << EOF
# Release v$NEW_VERSION

**Release Date:** $(date +"%Y-%m-%d")

$RELEASE_NOTES

---

## Installation

### Docker Deployment
\`\`\`bash
git clone https://github.com/Inton1701/POSExpress.git
cd POSExpress
git checkout v$NEW_VERSION
docker compose up --build -d
\`\`\`

### Native Deployment
\`\`\`bash
git clone https://github.com/Inton1701/POSExpress.git
cd POSExpress
git checkout v$NEW_VERSION
./deploy-all.sh
\`\`\`

### Update from Existing Installation
\`\`\`bash
./auto-update.sh
\`\`\`

## Downloads

- **Windows:** RFID-POS-System-Setup-$NEW_VERSION.exe
- **Linux:** RFID-POS-System-$NEW_VERSION.AppImage
EOF

git add "$RELEASE_FILE"
git commit -m "docs: add release notes for v$NEW_VERSION" 2>/dev/null || true

echo ""
echo -e "${GREEN}✓ Release notes saved to $RELEASE_FILE${NC}"
echo ""

# Create git tag
TAG_NAME="v$NEW_VERSION"
echo -e "${YELLOW}Creating git tag: $TAG_NAME${NC}"

if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Tag $TAG_NAME already exists${NC}"
    read -p "Delete and recreate? (y/n) [n]: " RECREATE_TAG
    RECREATE_TAG=${RECREATE_TAG:-n}
    
    if [[ "$RECREATE_TAG" =~ ^[Yy]$ ]]; then
        git tag -d "$TAG_NAME"
        git push origin :refs/tags/"$TAG_NAME" 2>/dev/null || true
    else
        echo "Keeping existing tag"
        TAG_NAME=""
    fi
fi

if [ -n "$TAG_NAME" ]; then
    git tag -a "$TAG_NAME" -m "Release v$NEW_VERSION"
    echo -e "${GREEN}✓ Created tag: $TAG_NAME${NC}"
fi

echo ""

# Push to remote
read -p "Push to GitHub? (y/n) [y]: " PUSH_TO_REMOTE
PUSH_TO_REMOTE=${PUSH_TO_REMOTE:-y}

if [[ "$PUSH_TO_REMOTE" =~ ^[Yy]$ ]]; then
    # Check if remote exists
    if ! git remote | grep -q "origin"; then
        echo -e "${YELLOW}No remote 'origin' found${NC}"
        read -p "Enter remote URL: " REMOTE_URL
        git remote add origin "$REMOTE_URL"
    fi
    
    REMOTE_URL=$(git remote get-url origin)
    echo "Pushing to: $REMOTE_URL"
    
    # Push commits and tags
    git push origin $(git branch --show-current) 2>/dev/null || git push origin main || git push origin master
    
    if [ -n "$TAG_NAME" ]; then
        git push origin "$TAG_NAME"
    fi
    
    echo -e "${GREEN}✓ Pushed to GitHub${NC}"
fi

echo ""

# Create GitHub release (requires gh CLI)
if command -v gh &> /dev/null; then
    read -p "Create GitHub release? (y/n) [y]: " CREATE_RELEASE
    CREATE_RELEASE=${CREATE_RELEASE:-y}
    
    if [[ "$CREATE_RELEASE" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Creating GitHub release...${NC}"
        
        # Check if release exists
        if gh release view "$TAG_NAME" &>/dev/null; then
            echo -e "${YELLOW}Release already exists, updating...${NC}"
            gh release edit "$TAG_NAME" --notes-file "$RELEASE_FILE"
        else
            # Create release
            gh release create "$TAG_NAME" \
                --title "Release v$NEW_VERSION" \
                --notes-file "$RELEASE_FILE"
        fi
        
        echo -e "${GREEN}✓ GitHub release created${NC}"
        echo ""
        echo "View release: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/releases/tag/$TAG_NAME"
    fi
else
    echo -e "${YELLOW}GitHub CLI (gh) not installed${NC}"
    echo "To create GitHub release manually:"
    echo "  1. Go to: https://github.com/Inton1701/POSExpress/releases/new"
    echo "  2. Choose tag: $TAG_NAME"
    echo "  3. Copy release notes from: $RELEASE_FILE"
    echo ""
    echo "Or install GitHub CLI: https://cli.github.com/"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Release Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Version: v$NEW_VERSION"
echo "Tag: $TAG_NAME"
echo "Release notes: $RELEASE_FILE"
echo ""
echo "Next steps:"
echo "  1. Build desktop apps: ./build-all-platforms.sh"
echo "  2. Upload builds to GitHub release"
echo "  3. Test auto-update feature"
echo ""
