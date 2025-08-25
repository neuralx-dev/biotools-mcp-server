# Biotools MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides access to biotools and scientific literature through PubMed APIs. This server enables AI applications to search and retrieve scientific publications, get detailed publication information, and manage research data.

## Features

### 🔬 Scientific Literature Tools

- **search_pubmed**: Search PubMed for scientific papers using keywords
- **get_publication_details**: Get comprehensive details for specific publications by PMID
- **get_publication_abstract**: Retrieve full abstracts for scientific papers
- **save_json_list**: Save research data and results to JSON files

### 🛡️ Production Ready & Isolated

- **Isolated deployment** - Won't interfere with other applications
- **Enhanced security** - Systemd sandbox with strict resource limits
- **Automatic startup** - Reliable restart capabilities with health monitoring
- **Minimal system impact** - Only installs necessary dependencies
- **Self-contained** - All management scripts in application directory

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Ubuntu 20.04+ (for production deployment)

### Development Setup

1. **Clone and install**:
   ```bash
   git clone <your-repo-url>
   cd biotools-mcp-server
   chmod +x install.sh
   ./install.sh
   ```

2. **Build and run**:
   ```bash
   npm run build
   npm start
   ```

3. **Test with MCP Inspector**:
   ```bash
   npm run inspect
   ```

### Production Deployment (Ubuntu VPS)

For production deployment on an Ubuntu VPS:

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment (requires sudo privileges)
./deploy.sh
```

The **isolated** deployment script will:
- **Only install missing dependencies** (won't upgrade existing packages)
- **Check Node.js compatibility** (won't overwrite existing installations)
- **Create dedicated service user** with minimal privileges
- **Set up enhanced systemd service** with security sandbox
- **Configure strict resource limits** (512MB RAM, 4096 processes)
- **Create isolated management scripts** (no global commands)

## Usage Examples

### Searching Scientific Literature

```javascript
// Search for papers about CRISPR gene editing
{
  "tool": "search_pubmed",
  "arguments": {
    "term": "CRISPR gene editing",
    "max_results": 10
  }
}
```

### Getting Publication Details

```javascript
// Get detailed information for a specific paper
{
  "tool": "get_publication_details", 
  "arguments": {
    "pmid": "12345678"
  }
}
```

### Retrieving Abstracts

```javascript
// Get full abstract for a publication
{
  "tool": "get_publication_abstract",
  "arguments": {
    "pmid": "12345678" 
  }
}
```

### Saving Research Data

```javascript
// Save search results or data to a file
{
  "tool": "save_json_list",
  "arguments": {
    "data": [{"title": "Research Paper 1"}, {"title": "Research Paper 2"}],
    "filename": "research_results.json"
  }
}
```

## Management Commands (Production)

After deployment, use these isolated commands to manage the service:

```bash
# Start the service
/opt/biotools-mcp/scripts/start

# Stop the service  
/opt/biotools-mcp/scripts/stop

# Restart the service
/opt/biotools-mcp/scripts/restart

# Check service status
/opt/biotools-mcp/scripts/status

# View real-time logs
/opt/biotools-mcp/scripts/logs

# Update the service (if using git)
/opt/biotools-mcp/scripts/update
```

## Configuration

### MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "biotools": {
      "command": "/usr/bin/node",
      "args": ["/opt/biotools-mcp/build/index.js"]
    }
  }
}
```

### Environment Variables

The server accepts these environment variables:

- `NODE_ENV`: Set to `production` for production deployment
- `LOG_LEVEL`: Logging level (error, warn, info, debug)

## API Reference

### search_pubmed

Search PubMed for scientific publications.

**Parameters:**
- `term` (string): Search query (e.g., "COVID-19 vaccines", "machine learning")
- `max_results` (number, optional): Maximum results to return (1-20, default: 5)

**Returns:** Formatted list of publications with titles, authors, journals, and PMIDs.

### get_publication_details

Get comprehensive information for a specific publication.

**Parameters:**
- `pmid` (string): PubMed ID of the publication

**Returns:** Detailed publication information including authors, journal, keywords, MeSH terms, and identifiers.

### get_publication_abstract

Retrieve the full abstract for a publication.

**Parameters:**
- `pmid` (string): PubMed ID of the publication

**Returns:** Complete abstract text along with basic publication information.

### save_json_list

Save data arrays to JSON files on the server.

**Parameters:**
- `data` (array): JSON array to save
- `filename` (string, optional): Output filename (default: "data.json")

**Returns:** Confirmation with file path and item count.

## Isolation & Security Features

### 🔒 Application Isolation

The deployment is designed to **avoid conflicts** with other server applications:

- **No system-wide upgrades** - Only updates package list, doesn't upgrade existing packages
- **Selective dependency installation** - Only installs missing packages (curl, build-essential)
- **Node.js compatibility check** - Won't overwrite existing Node.js if version ≥18
- **Isolated management scripts** - Created in `/opt/biotools-mcp/scripts/` (not global `/usr/local/bin/`)
- **Local npm cache** - Uses application-specific cache directory
- **Dedicated service user** - Runs as `biotools` user with no shell access

### 🛡️ Security Hardening

The production deployment includes comprehensive security measures:

- **Systemd security sandbox**: NoNewPrivileges, PrivateTmp, PrivateDevices
- **File system protection**: Read-only system, isolated /tmp and /dev
- **Network restrictions**: Only HTTP/HTTPS protocols allowed
- **Resource limits**: 512MB RAM, 4096 processes, 65536 file descriptors
- **System call filtering**: Blocks dangerous system calls
- **Memory protection**: Prevents executable memory allocation

## Monitoring and Logs

### Viewing Logs

```bash
# Real-time logs (isolated script)
/opt/biotools-mcp/scripts/logs

# Journal logs with filtering
sudo journalctl -u biotools-mcp -f --since "1 hour ago"

# All logs for the service
sudo journalctl -u biotools-mcp --no-pager
```

### Service Status

```bash
# Quick status check (isolated script)
/opt/biotools-mcp/scripts/status

# Detailed systemd status
sudo systemctl status biotools-mcp -l --no-pager
```

## Troubleshooting

### Common Issues

1. **Service won't start**: Check logs with `/opt/biotools-mcp/scripts/logs`
2. **Permission errors**: Ensure service user has correct permissions
3. **Port conflicts**: The server uses stdio transport (no network ports)
4. **Build failures**: Ensure Node.js 18+ is installed
5. **Isolation issues**: Service runs in strict sandbox - check `ReadWritePaths` if needed
6. **npm EACCES errors**: Fixed in latest deploy.sh - creates isolated npm cache with proper permissions

### Debug Mode

For development debugging:

```bash
# Build and run with detailed output
npm run dev

# Use MCP Inspector for interactive testing
npm run inspect
```

### Log Analysis

```bash
# Check for errors in the last hour
sudo journalctl -u biotools-mcp --since "1 hour ago" --priority err

# Monitor resource usage
sudo systemctl show biotools-mcp --property=MemoryCurrent,CPUUsageNSec
```

### npm EACCES Permission Errors

If you encounter npm permission errors during deployment:

**Problem**: npm tries to access `/home/biotools` (which doesn't exist) or lacks permission for cache directories.

**Solution**: The latest `deploy.sh` script fixes this by:
- Creating isolated npm cache directories: `/opt/biotools-mcp/.npm-cache`
- Setting `HOME=/opt/biotools-mcp` for the biotools user
- Configuring npm to use application-local directories
- Setting proper permissions before running npm commands

**Manual fix** (if needed):
```bash
sudo mkdir -p /opt/biotools-mcp/.npm-cache
sudo mkdir -p /opt/biotools-mcp/.npm-tmp  
sudo chown -R biotools:biotools /opt/biotools-mcp/.npm-*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run inspect`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Create an issue for bugs or feature requests
- Check the logs for troubleshooting
- Review MCP documentation at [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## Changelog

### v1.0.0
- Initial release
- PubMed search and publication tools
- Ubuntu VPS deployment support
- Systemd service integration
- Security hardening
