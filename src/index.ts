/**
 * BioTools MCP Server - Main entry point
 * 
 * A Model Context Protocol server providing access to biological databases
 * including PubMed and UniProtKB with comprehensive search and retrieval capabilities.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import tool registration functions
import { registerPubMedTools } from "./tools/pubmed-tools.js";
import { registerUniProtTools } from "./tools/uniprot-tools.js";
import { registerNucleotideTools } from "./tools/nucleotide-tools.js";
import { registerProteinEnhancedTools } from "./tools/protein-enhanced-tools.js";
import { registerDNAAnalysisTools } from "./tools/dna-analysis-tools.js";
import { registerProteinSequenceTools } from "./tools/protein-sequence-tools.js";
import { registerSequenceSimilarityTools } from "./tools/sequence-similarity-tools.js";
import { registerMultipleAlignmentTools } from "./tools/multiple-alignment-tools.js";
import { registerStructureRNATools } from "./tools/structure-rna-tools.js";
import { registerPhylogeneticsTools } from "./tools/phylogenetics-tools.js";
import { registerDocumentationTools } from "./tools/documentation-tools.js";

/**
 * Create and configure the MCP server instance
 */
const server = new McpServer({
  name: "biotools-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: {
      listChanged: false,
    },
  },
});

/**
 * Register all available tools
 */
function registerAllTools() {
  // Register PubMed tools
  registerPubMedTools(server);
  
  // Register UniProt tools
  registerUniProtTools(server);
  
  // Register nucleotide sequence analysis tools
  registerNucleotideTools(server);
  
  // Register enhanced protein analysis tools
  registerProteinEnhancedTools(server);
  
  // Register DNA analysis tools
  registerDNAAnalysisTools(server);
  
  // Register protein sequence analysis tools
  registerProteinSequenceTools(server);
  
  // Register sequence similarity analysis tools
  registerSequenceSimilarityTools(server);
  
  // Register multiple alignment analysis tools
  registerMultipleAlignmentTools(server);
  
  // Register structure & RNA analysis tools
  registerStructureRNATools(server);
  
  // Register phylogenetics analysis tools
  registerPhylogeneticsTools(server);
  
  // Register documentation & resource tools
  registerDocumentationTools(server);
}

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    // Register all tools
    registerAllTools();
    
    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("🧬 BioTools MCP Server v2.0.0 running on stdio");
    console.error("📚 Available databases: PubMed, UniProtKB, GenBank, Ensembl, KEGG, PDB");
    console.error("🔧 Available tools: 37 (3 PubMed + 3 UniProt + 4 Nucleotide + 3 Enhanced Protein + 4 DNA Analysis + 3 Protein Sequence + 5 Similarity + 4 Multiple Alignment + 4 Structure & RNA + 2 Phylogenetics + 2 Documentation)");
  } catch (error) {
    console.error("❌ Fatal error starting server:", error);
    process.exit(1);
  }
}

/**
 * Error handler for uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  console.error("❌ Uncaught exception:", error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error("❌ Fatal error in main():", error);
  process.exit(1);
});
