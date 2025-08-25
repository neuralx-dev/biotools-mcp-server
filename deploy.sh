#!/bin/bash

# Biotools MCP Server Deployment Script for Ubuntu VPS
# This script installs and configures the Biotools MCP Server

set -e

echo "🔬 Biotools MCP Server Deployment Script"
echo "========================================"



# Variables
APP_DIR="/opt/biotools-mcp"
SERVICE_USER="biotools"
SERVICE_NAME="biotools-mcp"
REPO_URL="https://github.com/your-username/biotools-mcp-server.git"  # Update this with your actual repo URL

echo "📋 Configuration:"
echo "   App Directory: $APP_DIR"
echo "   Service User: $SERVICE_USER"
echo "   Service Name: $SERVICE_NAME"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y curl wget git build-essential

# Install Node.js (using NodeSource repository for latest LTS)
if ! command_exists node; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js is already installed"
fi

# Check Node.js version
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js version: $NODE_VERSION"
echo "✅ npm version: $NPM_VERSION"

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

# Copy application files
echo "📋 Copying application files..."
sudo cp -r . $APP_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Install dependencies and build
echo "📦 Installing dependencies..."
cd $APP_DIR
sudo -u $SERVICE_USER npm install
sudo -u $SERVICE_USER npm run build

# Create systemd service file
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Biotools MCP Server
After=network.target
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/build/index.js
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

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
sudo systemctl status $SERVICE_NAME --no-pager -l

# Create useful scripts
echo "📝 Creating management scripts..."

# Create start script
sudo tee /usr/local/bin/biotools-mcp-start > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl start biotools-mcp
echo "Biotools MCP Server started"
sudo systemctl status biotools-mcp --no-pager -l
EOF

# Create stop script
sudo tee /usr/local/bin/biotools-mcp-stop > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl stop biotools-mcp
echo "Biotools MCP Server stopped"
EOF

# Create restart script
sudo tee /usr/local/bin/biotools-mcp-restart > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl restart biotools-mcp
echo "Biotools MCP Server restarted"
sudo systemctl status biotools-mcp --no-pager -l
EOF

# Create logs script
sudo tee /usr/local/bin/biotools-mcp-logs > /dev/null << 'EOF'
#!/bin/bash
sudo journalctl -u biotools-mcp -f
EOF

# Create status script
sudo tee /usr/local/bin/biotools-mcp-status > /dev/null << 'EOF'
#!/bin/bash
sudo systemctl status biotools-mcp --no-pager -l
EOF

# Make scripts executable
sudo chmod +x /usr/local/bin/biotools-mcp-*

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service Information:"
echo "   Service Name: $SERVICE_NAME"
echo "   App Directory: $APP_DIR"
echo "   Service User: $SERVICE_USER"
echo ""
echo "🛠️ Management Commands:"
echo "   Start:   biotools-mcp-start"
echo "   Stop:    biotools-mcp-stop"
echo "   Restart: biotools-mcp-restart"
echo "   Status:  biotools-mcp-status"
echo "   Logs:    biotools-mcp-logs"
echo ""
echo "📊 Service Status:"
sudo systemctl is-active $SERVICE_NAME
echo ""
echo "✅ The Biotools MCP Server is now running and will automatically start on boot."
echo "   You can view logs with: biotools-mcp-logs"
echo "   You can check status with: biotools-mcp-status"
