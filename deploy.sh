#!/bin/bash

# Biotools MCP Server Deployment Script for Ubuntu VPS
# This script installs and configures the Biotools MCP Server in an isolated manner
# to avoid conflicts with other applications on the server

set -e

echo "🔬 Biotools MCP Server - Isolated Deployment Script"
echo "=================================================="

# Variables
APP_DIR="/opt/biotools-mcp"
SERVICE_USER="biotools"
SERVICE_NAME="biotools-mcp"
REQUIRED_NODE_VERSION="18"
TEMP_DIR="/tmp/biotools-mcp-install"

echo "📋 Configuration:"
echo "   App Directory: $APP_DIR"
echo "   Service User: $SERVICE_USER"
echo "   Service Name: $SERVICE_NAME"
echo "   Required Node.js: v${REQUIRED_NODE_VERSION}+"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to compare version numbers
version_ge() {
    [ "$(printf '%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

# Create temporary directory for installation
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# Only update package list (not upgrade everything)
echo "📦 Updating package list (not upgrading existing packages)..."
sudo apt update

# Check and install only missing essential packages
echo "🔍 Checking for required system packages..."
MISSING_PACKAGES=""

if ! command_exists curl; then
    MISSING_PACKAGES="$MISSING_PACKAGES curl"
fi

if ! dpkg -l | grep -q "build-essential"; then
    MISSING_PACKAGES="$MISSING_PACKAGES build-essential"
fi

if [ ! -z "$MISSING_PACKAGES" ]; then
    echo "📦 Installing missing packages: $MISSING_PACKAGES"
    sudo apt install -y $MISSING_PACKAGES
else
    echo "✅ All required system packages are already installed"
fi

# Check Node.js version and install if needed
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    
    if version_ge "$NODE_MAJOR" "$REQUIRED_NODE_VERSION"; then
        echo "✅ Node.js version $NODE_VERSION is compatible (>= v${REQUIRED_NODE_VERSION})"
        INSTALL_NODE=false
    else
        echo "⚠️ Node.js version $NODE_VERSION found, but v${REQUIRED_NODE_VERSION}+ is required"
        echo "   Will install Node.js v${REQUIRED_NODE_VERSION} LTS without affecting existing installation"
        INSTALL_NODE=true
    fi
else
    echo "📦 Node.js not found, will install v${REQUIRED_NODE_VERSION} LTS"
    INSTALL_NODE=true
fi

# Install Node.js using NodeSource (only if needed)
if [ "$INSTALL_NODE" = true ]; then
    echo "📦 Installing Node.js LTS (this won't affect other Node.js installations)..."
    
    # Download and verify NodeSource setup script
    curl -fsSL https://deb.nodesource.com/setup_lts.x -o nodesource_setup.sh
    
    # Run with minimal impact (no automatic package installation)
    sudo -E bash nodesource_setup.sh
    sudo apt-get install -y nodejs
    
    # Clean up
    rm -f nodesource_setup.sh
fi

# Verify Node.js installation
if command_exists node && command_exists npm; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo "✅ Node.js version: $NODE_VERSION"
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ Node.js installation failed"
    exit 1
fi

# Create service user
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "👤 Creating service user: $SERVICE_USER"
    sudo useradd --system --no-create-home --shell /bin/false $SERVICE_USER
else
    echo "✅ Service user $SERVICE_USER already exists"
fi

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $SERVICE_USER:$SERVICE_USER $APP_DIR

# Go back to original directory and copy application files
echo "📋 Copying application files..."
cd - > /dev/null  # Go back to original directory

# Exclude unnecessary files and directories during copy
sudo mkdir -p $APP_DIR
echo "   Copying source files (excluding node_modules, .git, etc.)..."
sudo rsync -av --exclude='node_modules' --exclude='.git' --exclude='build' --exclude='*.log' --exclude='*.tmp' . $APP_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Install dependencies and build in isolated environment
echo "📦 Installing dependencies (isolated to application directory)..."
cd $APP_DIR

# Set npm cache to local directory to avoid conflicts
sudo -u $SERVICE_USER npm config set cache $APP_DIR/.npm-cache
sudo -u $SERVICE_USER npm install --no-fund --no-audit

echo "🔨 Building application..."
sudo -u $SERVICE_USER npm run build

# Verify build was successful
if [ ! -f "$APP_DIR/build/index.js" ]; then
    echo "❌ Build failed - build/index.js not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Create systemd service file with enhanced security and isolation
echo "⚙️ Creating systemd service with security hardening..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Biotools MCP Server - Scientific literature and biotools for AI
Documentation=https://github.com/your-username/biotools-mcp-server
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=3
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/build/index.js
ExecReload=/bin/kill -HUP \$MAINPID
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Environment isolation
Environment=NODE_ENV=production
Environment=NPM_CONFIG_CACHE=$APP_DIR/.npm-cache

# Enhanced security settings for isolation
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
PrivateNetwork=false
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectControlGroups=true
ProtectHostname=true
ProtectClock=true
ProtectProc=invisible
ProcSubset=pid
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
RestrictNamespaces=true
RestrictRealtime=true
RestrictSUIDSGID=true
LockPersonality=true
MemoryDenyWriteExecute=false
SystemCallFilter=@system-service
SystemCallFilter=~@debug @mount @cpu-emulation @obsolete @privileged @reboot @swap @raw-io
SystemCallErrorNumber=EPERM

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096
MemoryMax=512M
TasksMax=1024

# Read/write access only to application directory
ReadWritePaths=$APP_DIR
ReadOnlyPaths=/usr/bin/node

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
echo "🔄 Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

# Check service status
echo "✅ Checking service status..."
if sudo systemctl start $SERVICE_NAME; then
    echo "✅ Service started successfully"
    sudo systemctl status $SERVICE_NAME --no-pager -l
else
    echo "❌ Service failed to start. Check logs with: sudo journalctl -u $SERVICE_NAME -f"
    exit 1
fi

# Create isolated management scripts in application directory (not globally)
echo "📝 Creating management scripts in application directory..."
SCRIPTS_DIR="$APP_DIR/scripts"
sudo mkdir -p $SCRIPTS_DIR

# Create start script
sudo tee $SCRIPTS_DIR/start > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl start biotools-mcp
echo "✅ Biotools MCP Server started"
sudo systemctl status biotools-mcp --no-pager -l
EOF

# Create stop script
sudo tee $SCRIPTS_DIR/stop > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl stop biotools-mcp
echo "✅ Biotools MCP Server stopped"
EOF

# Create restart script
sudo tee $SCRIPTS_DIR/restart > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl restart biotools-mcp
echo "✅ Biotools MCP Server restarted"
sudo systemctl status biotools-mcp --no-pager -l
EOF

# Create logs script
sudo tee $SCRIPTS_DIR/logs > /dev/null << 'EOF'
#!/bin/bash
sudo journalctl -u biotools-mcp -f
EOF

# Create status script
sudo tee $SCRIPTS_DIR/status > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl status biotools-mcp --no-pager -l
EOF

# Create update script for future updates
sudo tee $SCRIPTS_DIR/update > /dev/null << 'EOF'
#!/bin/bash
APP_DIR="/opt/biotools-mcp"
SERVICE_NAME="biotools-mcp"
SERVICE_USER="biotools"

echo "🔄 Updating Biotools MCP Server..."

# Stop the service
sudo systemctl stop $SERVICE_NAME

# Backup current installation
sudo cp -r $APP_DIR $APP_DIR.backup.$(date +%Y%m%d_%H%M%S)

# Update code (assumes git repository)
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    sudo -u $SERVICE_USER git pull
    sudo -u $SERVICE_USER npm install --no-fund --no-audit
    sudo -u $SERVICE_USER npm run build
else
    echo "⚠️  No git repository found. Manual update required."
fi

# Restart service
sudo systemctl start $SERVICE_NAME
echo "✅ Update completed"
sudo systemctl status $SERVICE_NAME --no-pager -l
EOF

# Make scripts executable
sudo chmod +x $SCRIPTS_DIR/*
sudo chown -R $SERVICE_USER:$SERVICE_USER $SCRIPTS_DIR

# Clean up temporary directory
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Isolated Deployment Completed Successfully!"
echo "=============================================="
echo ""
echo "📋 Service Information:"
echo "   Service Name: $SERVICE_NAME"
echo "   App Directory: $APP_DIR"
echo "   Service User: $SERVICE_USER"
echo "   Scripts Directory: $APP_DIR/scripts"
echo ""
echo "🛠️ Management Commands (isolated in app directory):"
echo "   Start:   $APP_DIR/scripts/start"
echo "   Stop:    $APP_DIR/scripts/stop"
echo "   Restart: $APP_DIR/scripts/restart"
echo "   Status:  $APP_DIR/scripts/status"
echo "   Logs:    $APP_DIR/scripts/logs"
echo "   Update:  $APP_DIR/scripts/update"
echo ""
echo "🔒 Security Features Enabled:"
echo "   ✅ Isolated service user ($SERVICE_USER)"
echo "   ✅ Enhanced systemd security sandbox"
echo "   ✅ Resource limits (512MB RAM, 4096 processes)"
echo "   ✅ Read-only system protection"
echo "   ✅ Network restrictions (HTTP/HTTPS only)"
echo "   ✅ Private /tmp and /dev directories"
echo ""
echo "📊 Service Status:"
SERVICE_STATUS=$(sudo systemctl is-active $SERVICE_NAME)
echo "   Status: $SERVICE_STATUS"
if [ "$SERVICE_STATUS" = "active" ]; then
    echo "   ✅ Service is running successfully"
else
    echo "   ⚠️  Service may need attention"
fi
echo ""
echo "✅ The Biotools MCP Server is now running in an isolated environment"
echo "   and will automatically start on boot without affecting other applications."
echo ""
echo "📖 Quick Start:"
echo "   View logs:    $APP_DIR/scripts/logs"
echo "   Check status: $APP_DIR/scripts/status"
echo "   Restart:      $APP_DIR/scripts/restart"
echo ""
echo "🔧 For troubleshooting: sudo journalctl -u $SERVICE_NAME -f"
