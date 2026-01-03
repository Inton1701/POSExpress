#!/bin/bash

# Quick Release Script - For fast patch releases
# Usage: ./quick-release.sh "Bug fix description"

set -e

if [ -z "$1" ]; then
    echo "Usage: ./quick-release.sh \"Release description\""
    exit 1
fi

DESCRIPTION="$1"
CURRENT_VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")

# Parse version and bump patch
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"

echo "Quick release: v$CURRENT_VERSION → v$NEW_VERSION"
echo "Description: $DESCRIPTION"
echo ""

# Update VERSION file
echo "$NEW_VERSION" > VERSION

# Update package.json files
if [ -f "frontend/package.json" ]; then
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" frontend/package.json
    rm -f frontend/package.json.bak
fi

if [ -f "backend/package.json" ]; then
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" backend/package.json
    rm -f backend/package.json.bak
fi

# Git operations
git add .
git commit -m "chore: release v$NEW_VERSION - $DESCRIPTION"
git tag -a "v$NEW_VERSION" -m "$DESCRIPTION"
git push origin $(git branch --show-current) 2>/dev/null || git push origin main || git push origin master
git push origin "v$NEW_VERSION"

echo ""
echo "✓ Released v$NEW_VERSION"
echo ""

# Create GitHub release if gh CLI is available
if command -v gh &> /dev/null; then
    gh release create "v$NEW_VERSION" --title "v$NEW_VERSION" --notes "$DESCRIPTION"
    echo "✓ GitHub release created"
fi

echo ""
echo "Done! 🚀"
