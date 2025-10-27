#!/bin/bash

# Package script for browser extension
# Creates zip files for store submission

set -e

echo "Packaging browser extension for store submission..."

# Ensure builds exist
if [ ! -d "dist/chrome" ]; then
    echo "Chrome build not found. Run 'npm run build' first."
    exit 1
fi

if [ ! -d "dist/firefox" ]; then
    echo "Firefox build not found. Run 'npm run build' first."
    exit 1
fi

# Create packages directory
mkdir -p packages

# Create Chrome package
echo "Creating Chrome package..."
cd dist/chrome
zip -r "../../packages/chrome-extension.zip" . -x "*.DS_Store" "*.git*" "node_modules/*"
cd ../..

# Create Firefox package
echo "Creating Firefox package..."
cd dist/firefox
zip -r "../../packages/firefox-extension.zip" . -x "*.DS_Store" "*.git*" "node_modules/*"
cd ../..

echo "Packages created successfully!"
echo "Chrome package: packages/chrome-extension.zip"
echo "Firefox package: packages/firefox-extension.zip"
echo ""
echo "Ready for store submission!"
