# BioTools MCP Server - Modular Architecture

This directory contains the refactored, scalable implementation of the BioTools MCP Server. The code has been organized into a clean, modular architecture that separates concerns and makes the codebase highly maintainable and extensible.

## 📁 Project Structure

```
src/
├── index.ts                 # Main entry point and server initialization
├── types/
│   └── interfaces.ts        # TypeScript interfaces for all data types
├── schemas/
│   └── validation.ts        # Zod validation schemas for MCP tools
├── utils/
│   ├── config.ts           # Configuration constants
│   ├── pubmed.ts           # PubMed API utility functions
│   └── uniprot.ts          # UniProtKB API utility functions
└── tools/
    ├── pubmed-tools.ts     # PubMed MCP tool implementations
    └── uniprot-tools.ts    # UniProtKB MCP tool implementations
```

## 🧩 Architecture Overview

### **Separation of Concerns**

1. **`index.ts`** - Clean entry point that orchestrates the server setup
2. **`types/`** - All TypeScript interfaces centralized for reuse
3. **`schemas/`** - Zod validation schemas for input validation
4. **`utils/`** - API utility functions separated by service
5. **`tools/`** - MCP tool implementations organized by database

### **Scalability Benefits**

- ✅ **Easy to Add New APIs**: Create new utils and tools files
- ✅ **Maintainable**: Each file has a single responsibility
- ✅ **Testable**: Individual functions can be unit tested
- ✅ **Type-Safe**: Centralized interfaces ensure consistency
- ✅ **Reusable**: Utility functions can be shared across tools

## 🔧 Available Tools

### **PubMed Tools** (`tools/pubmed-tools.ts`)
- `search_pubmed` - Search scientific papers
- `get_publication_details` - Get detailed paper information
- `get_publication_abstract` - Retrieve full abstracts

### **UniProtKB Tools** (`tools/uniprot-tools.ts`)
- `search_uniprot` - Search protein databases
- `get_protein_entry` - Get detailed protein information  
- `get_protein_sequence` - Retrieve protein sequences

### **Nucleotide Analysis Tools** (`tools/nucleotide-tools.ts`)
- `get_nucleotide_sequence` - Retrieve sequences from GenBank/Ensembl
- `compare_annotations` - Compare prokaryotic vs eukaryotic annotations
- `find_intron_exons` - Detect intron-exon boundaries
- `align_promoters` - Align promoter regions for conserved elements

### **Enhanced Protein Tools** (`tools/protein-enhanced-tools.ts`)
- `get_cross_references` - Fetch KEGG, Pfam, PDB cross-references
- `analyze_ptms` - Analyze post-translational modifications
- `get_pathway_data` - Get detailed pathway information

## 🚀 Adding New Features

### Adding a New Database API

1. **Add types** in `types/interfaces.ts`
2. **Add schemas** in `schemas/validation.ts`
3. **Create utils** file in `utils/new-api.ts`
4. **Create tools** file in `tools/new-api-tools.ts`
5. **Register tools** in `index.ts`

### Example: Adding NCBI Gene API

```typescript
// 1. types/interfaces.ts
export interface GeneEntry {
  geneId: string;
  symbol: string;
  // ...
}

// 2. schemas/validation.ts
export const searchGeneSchema = {
  term: z.string().describe("Gene search term"),
};

// 3. utils/ncbi-gene.ts
export async function searchGenes(term: string) {
  // Implementation
}

// 4. tools/ncbi-gene-tools.ts
export function registerGeneTools(server: McpServer) {
  server.tool("search_genes", "Search NCBI Gene database", 
    searchGeneSchema, async ({ term }) => {
      // Implementation
    });
}

// 5. index.ts
import { registerGeneTools } from "./tools/ncbi-gene-tools.js";
// In registerAllTools():
registerGeneTools(server);
```

## 📋 Benefits of This Architecture

- **Maintainability**: Each file has clear responsibilities
- **Scalability**: Easy to add new APIs and tools
- **Testing**: Individual components can be unit tested
- **Code Reuse**: Utility functions prevent duplication
- **Type Safety**: Centralized interfaces ensure consistency
- **Documentation**: Clear separation makes code self-documenting

## 🔄 Migration from Monolithic

The original `index.ts` (950+ lines) has been refactored into:
- `index.ts` (60 lines) - Server setup only
- 6 focused modules with single responsibilities
- Zero functionality lost, all tools preserved
- Improved error handling and logging
- Better adherence to MCP standards
