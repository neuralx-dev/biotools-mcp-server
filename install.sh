#!/bin/bash

# Quick Installation Script for Biotools MCP Server
# This script provides a simplified installation process

set -e

echo "🔬 Biotools MCP Server - Quick Install"
echo "====================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🔍 Checking prerequisites..."

# Check for required commands
if ! command_exists sudo; then
    echo "❌ sudo is required but not installed."
    exit 1
fi

if ! command_exists curl; then
    echo "📦 Installing curl..."
    sudo apt update && sudo apt install -y curl
fi

# Check Node.js version
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️ Node.js version $NODE_VERSION found, but version 18+ is recommended."
        echo "   Proceeding with installation of latest LTS..."
        INSTALL_NODE=true
    else
        echo "✅ Node.js version $NODE_VERSION is compatible"
        INSTALL_NODE=false
    fi
else
    echo "📦 Node.js not found, will install..."
    INSTALL_NODE=true
fi

# Install Node.js if needed
if [ "$INSTALL_NODE" = true ]; then
    echo "📦 Installing Node.js LTS..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Verify installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ ! -f "build/index.js" ]; then
    echo "❌ Build failed - build/index.js not found"
    exit 1
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "🚀 To start the server manually:"
echo "   npm start"
echo ""
echo "🐳 For production deployment on Ubuntu VPS:"
echo "   chmod +x deploy.sh && ./deploy.sh"
echo ""
echo "🔍 To test the MCP server:"
echo "   npx @modelcontextprotocol/inspector build/index.js"
echo ""
echo "📚 Available tools:"
echo "   - search_pubmed: Search PubMed for scientific papers"
echo "   - get_publication_details: Get detailed publication information"
echo "   - get_publication_abstract: Get full abstract for a publication"
echo "   - save_json_list: Save data to JSON file"
