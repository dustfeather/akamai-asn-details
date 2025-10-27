#!/bin/bash

# Build script for browser extension
# Creates platform-specific builds for Chrome and Firefox

set -e

echo "Building browser extension for Chrome and Firefox..."

# Create build directories
mkdir -p dist/chrome
mkdir -p dist/firefox

# Copy common files
echo "Copying common files..."
cp -r extension/* dist/chrome/
cp -r extension/* dist/firefox/

# Copy platform-specific manifests
echo "Setting up Chrome manifest..."
cp extension/manifest-chrome.json dist/chrome/manifest.json

echo "Setting up Firefox manifest..."
cp extension/manifest-firefox.json dist/firefox/manifest.json

# Create icons directory if it doesn't exist
mkdir -p dist/chrome/icons
mkdir -p dist/firefox/icons

echo "Build complete!"
echo "Chrome build: dist/chrome/"
echo "Firefox build: dist/firefox/"
echo ""
echo "Next steps:"
echo "1. Add icons to dist/chrome/icons/ and dist/firefox/icons/"
echo "2. Test both builds in their respective browsers"
echo "3. Create zip files for store submission"
