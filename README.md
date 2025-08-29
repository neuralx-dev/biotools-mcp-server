# Biotools MCP Server

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for bioinformatics research, providing AI applications with access to major biological databases including PubMed, UniProt, NCBI GenBank, KEGG, PDB, and more.

## 🧬 Available Tools

### 📚 Literature Research Tools

#### `search_pubmed`
Search PubMed for scientific publications with advanced filtering capabilities.
- **Purpose**: Find relevant research papers and studies
- **Input**: Search terms (e.g., "CRISPR gene editing", "cancer genomics")
- **Returns**: Publication metadata, abstracts, authors, and bibliographic information

#### `get_publication_details`
Retrieve comprehensive details for a specific publication by PMID.
- **Purpose**: Get complete bibliographic record with all metadata
- **Input**: PubMed ID (PMID)
- **Returns**: Full MEDLINE record including authors, affiliations, funding sources, MeSH terms, citations, and publication history

#### `get_publication_abstract`
Extract the full abstract for a specific publication.
- **Purpose**: Get structured abstract content with section labels
- **Input**: PubMed ID (PMID)
- **Returns**: Complete abstract text with metadata

### 🧬 Protein Analysis Tools

#### `search_uniprot`
Search the UniProtKB database for proteins with comprehensive field extraction.
- **Purpose**: Find proteins by name, function, organism, or other criteria
- **Input**: Search query (e.g., "insulin", "kinase AND human", "P04637")
- **Returns**: Protein entries with 90+ comprehensive fields including function, domains, and cross-references

#### `get_protein_entry`
Get detailed information for a specific protein by UniProt accession.
- **Purpose**: Retrieve complete protein annotation and functional data
- **Input**: UniProt accession number (e.g., "P38398")
- **Returns**: Exhaustive protein data including domains, PTMs, variants, tissue specificity, disease associations, and cross-references to 80+ databases

#### `get_protein_sequence`
Retrieve protein sequence in FASTA format with structural context.
- **Purpose**: Get amino acid sequence with feature annotations
- **Input**: UniProt accession number
- **Returns**: FASTA sequence with complete metadata and structural features

### 🧬 Nucleotide Sequence Tools

#### `get_nucleotide_sequence`
Retrieve nucleotide sequences from GenBank, RefSeq, or Ensembl databases.
- **Purpose**: Get DNA/RNA sequences with complete annotation
- **Input**: Accession number (e.g., "NM_000546") and database preference
- **Returns**: Complete sequence records with features, references, and comprehensive annotation

#### `compare_annotations`
Compare genomic annotations between prokaryotic and eukaryotic sequences.
- **Purpose**: Analyze differences in gene structure and annotation between organism types
- **Input**: Two sequence identifiers for comparison
- **Returns**: Detailed comparison of features, similarities, and differences with biological insights

#### `find_intron_exons`
Detect intron-exon boundaries in gene sequences with splice site analysis.
- **Purpose**: Analyze gene structure and identify coding regions
- **Input**: Gene sequence identifier with optional organism context
- **Returns**: Complete gene structure with exons, introns, splice sites, and coding sequence analysis

#### `align_promoters`
Align promoter regions from multiple genes to discover conserved regulatory elements.
- **Purpose**: Find conserved motifs and regulatory sequences in gene promoters
- **Input**: List of 2-10 gene identifiers
- **Returns**: Promoter alignment with conserved elements and regulatory motif analysis

### 🧪 Enhanced Protein Analysis Tools

#### `get_cross_references`
Get comprehensive cross-references for a protein from multiple databases.
- **Purpose**: Find related information across KEGG, Pfam, PDB, InterPro, GO, and other databases
- **Input**: UniProt accession number
- **Returns**: Complete cross-references from 80+ databases including structures, domains, pathways, and functional annotations

#### `analyze_ptms`
Analyze post-translational modifications with functional impact assessment.
- **Purpose**: Identify and analyze protein modifications and their biological significance
- **Input**: UniProt accession number with optional PTM type filters
- **Returns**: Complete PTM analysis with functional impact predictions and confidence scoring

#### `get_pathway_data`
Get detailed pathway information and metabolic context for a protein.
- **Purpose**: Understand protein function in biological pathways and networks
- **Input**: UniProt accession number with database preference (KEGG, Reactome, etc.)
- **Returns**: Complete pathway networks with reactions, modules, and related proteins

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone <repository-url>
cd biotools-mcp-server
npm install
npm run build
npm start
```

### Testing
```bash
npm run inspect
```

## 📖 Usage Example

```javascript
// Search for BRCA1-related publications
{
  "tool": "search_pubmed",
  "arguments": {
    "term": "BRCA1 mutations breast cancer",
    "max_results": 10
  }
}

// Get detailed protein information
{
  "tool": "get_protein_entry",
  "arguments": {
    "accession": "P38398"  // BRCA1 protein
  }
}

// Analyze gene structure
{
  "tool": "find_intron_exons",
  "arguments": {
    "sequence_id": "NM_007294",  // BRCA1 mRNA
    "organism": "Homo sapiens"
  }
}
```

## 🔧 Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "biotools": {
      "command": "node",
      "args": ["path/to/biotools-mcp-server/build/index.js"]
    }
  }
}
```

## 📋 Features

- **13 comprehensive tools** covering literature, protein, and nucleotide analysis
- **8+ major biological databases** integrated
- **Maximum data extraction** - 5-20x more information per query than standard implementations
- **Complete research workflows** from literature review to molecular analysis
- **Production-ready** with robust error handling and validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run inspect`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.