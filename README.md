# Biotools MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides access to biotools and scientific literature through PubMed APIs. This server enables AI applications to search and retrieve scientific publications, get detailed publication information, and manage research data.

## Features

### 🔬 Scientific Literature Tools

- **search_pubmed**: Search PubMed for scientific papers using keywords
- **get_publication_details**: Get comprehensive details for specific publications by PMID
- **get_publication_abstract**: Retrieve full abstracts for scientific papers
- **save_json_list**: Save research data and results to JSON files

### 🛡️ Production Ready

- Systemd service integration for Ubuntu VPS deployment
- Automatic startup and restart capabilities
- Comprehensive logging and monitoring
- Security hardening and resource limits

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

The deployment script will:
- Install Node.js and dependencies
- Create a dedicated service user
- Set up systemd service with auto-restart
- Configure security settings and resource limits
- Create management scripts

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

After deployment, use these commands to manage the service:

```bash
# Start the service
biotools-mcp-start

# Stop the service  
biotools-mcp-stop

# Restart the service
biotools-mcp-restart

# Check service status
biotools-mcp-status

# View real-time logs
biotools-mcp-logs
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

## Security Features

The production deployment includes several security measures:

- Dedicated service user with minimal privileges
- Systemd security sandbox (NoNewPrivileges, PrivateTmp, etc.)
- Resource limits (file descriptors, process count)
- System call filtering
- Network access restrictions

## Monitoring and Logs

### Viewing Logs

```bash
# Real-time logs
biotools-mcp-logs

# Journal logs with filtering
sudo journalctl -u biotools-mcp -f --since "1 hour ago"

# All logs for the service
sudo journalctl -u biotools-mcp --no-pager
```

### Service Status

```bash
# Quick status check
biotools-mcp-status

# Detailed systemd status
sudo systemctl status biotools-mcp -l --no-pager
```

## Troubleshooting

### Common Issues

1. **Service won't start**: Check logs with `biotools-mcp-logs`
2. **Permission errors**: Ensure service user has correct permissions
3. **Port conflicts**: The server uses stdio transport (no network ports)
4. **Build failures**: Ensure Node.js 18+ is installed

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
