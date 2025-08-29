# Biotools MCP Server

A comprehensive [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for bioinformatics research, providing AI applications with access to major biological databases and analysis tools including PubMed, UniProt, NCBI GenBank, KEGG, PDB, and more.

## 🧬 Available Tools (37 Total)

### 📚 Literature Research Tools (3 tools)

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

### 🧬 Protein Analysis Tools (3 tools)

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

### 🧬 Nucleotide Sequence Analysis Tools (4 tools)

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

### 🧪 Enhanced Protein Analysis Tools (3 tools)

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

### 🧬 DNA Analysis Tools (4 tools)

#### `analyze_gc_content`
Calculate GC percentage and nucleotide composition of a DNA sequence.
- **Purpose**: Analyze sequence composition and identify compositional bias
- **Input**: DNA sequence string
- **Returns**: GC content, AT content, nucleotide counts, skew analysis, and sequence characteristics

#### `find_restriction_sites`
Identify restriction enzyme cut sites in DNA sequence using REBASE database motifs.
- **Purpose**: Find restriction enzyme recognition sites for cloning and molecular biology
- **Input**: DNA sequence and optional enzyme list
- **Returns**: Restriction sites by enzyme, fragment analysis, and cutting pattern visualization

#### `predict_orfs`
Scan all 6 reading frames for start/stop codons to detect open reading frames (ORFs).
- **Purpose**: Identify potential protein-coding regions in DNA sequences
- **Input**: DNA sequence with minimum length threshold
- **Returns**: ORF locations by reading frame, amino acid sequences, and statistical analysis

#### `assemble_fragments`
Assemble short DNA sequences into one using overlap-based merging.
- **Purpose**: Reconstruct longer sequences from overlapping fragments
- **Input**: Array of DNA fragments with optional overlap parameters
- **Returns**: Assembled sequence, overlap analysis, and assembly statistics

### 🧬 Protein Sequence Tools (3 tools)

#### `predict_protein_properties`
Predict molecular weight, isoelectric point, amino acid composition, and other physicochemical properties.
- **Purpose**: Calculate protein physical and chemical characteristics
- **Input**: Protein sequence (amino acid string)
- **Returns**: Molecular weight, pI, hydropathy, instability index, amino acid composition, and stability predictions

#### `predict_transmembrane_regions`
Identify transmembrane helices using hydropathy analysis and TMHMM-like algorithms.
- **Purpose**: Predict membrane-spanning regions and protein topology
- **Input**: Protein sequence with analysis parameters
- **Returns**: Transmembrane helices, topology predictions, signal peptides, and localization analysis

#### `scan_protein_motifs`
Detect functional motifs and domains using PROSITE patterns and other databases.
- **Purpose**: Find functional sites and regulatory elements in proteins
- **Input**: Protein sequence with database preference
- **Returns**: Functional motifs, phosphorylation sites, glycosylation sites, and regulatory predictions

### 🔍 Sequence Similarity Tools (5 tools)

#### `blast_search`
Run BLAST (nucleotide or protein) search against NCBI databases to find similar sequences.
- **Purpose**: Find similar sequences and identify homologs
- **Input**: Query sequence with database and program selection
- **Returns**: BLAST hits with alignments, E-values, bit scores, and statistical analysis

#### `psi_blast_search`
Run PSI-BLAST for deeper homology detection using iterative profile construction.
- **Purpose**: Detect distant homologs through profile-based searching
- **Input**: Protein sequence with iteration parameters
- **Returns**: Profile-enhanced hits, iteration summary, and remote homolog detection

#### `align_sequences_global`
Perform Needleman-Wunsch global alignment to compare two sequences end-to-end.
- **Purpose**: Align entire sequences to compare overall similarity
- **Input**: Two sequences with scoring parameters
- **Returns**: Global alignment with identity, similarity, gaps, and quality assessment

#### `align_sequences_local`
Perform Smith-Waterman local alignment to find the best local similarity between sequences.
- **Purpose**: Find regions of local similarity between sequences
- **Input**: Two sequences with scoring parameters
- **Returns**: Local alignment with similarity regions and coverage analysis

#### `generate_dotplot`
Generate dot plot visualization for pairwise sequence comparison to identify similarity patterns.
- **Purpose**: Visualize sequence similarity patterns and detect rearrangements
- **Input**: Two sequences with window and threshold parameters
- **Returns**: Dot plot coordinates, similarity regions, and pattern analysis

### 🧬 Multiple Alignment Tools (4 tools)

#### `multiple_sequence_alignment`
Align 2-20 protein or nucleotide sequences using progressive alignment algorithms.
- **Purpose**: Create multiple sequence alignments for comparative analysis
- **Input**: Array of sequences with alignment parameters
- **Returns**: Multiple alignment with conservation analysis and quality metrics

#### `highlight_conserved_regions`
Find and analyze conserved regions in a multiple sequence alignment.
- **Purpose**: Identify functionally important conserved regions
- **Input**: Aligned sequences with conservation thresholds
- **Returns**: Conserved regions, consensus sequences, and functional predictions

#### `generate_sequence_logo`
Create sequence logo data from multiple alignment to visualize conservation patterns.
- **Purpose**: Generate conservation logos for motif visualization
- **Input**: Aligned sequences with information content thresholds
- **Returns**: Logo data with information content, residue frequencies, and motif analysis

#### `export_alignment`
Export multiple sequence alignment in various formats (FASTA, PHYLIP, Clustal, MSF).
- **Purpose**: Convert alignments to different formats for external tools
- **Input**: Aligned sequences with format selection
- **Returns**: Formatted alignment file with usage instructions

### 🏗️ Structure & RNA Tools (4 tools)

#### `get_protein_structure`
Retrieve 3D protein structure data from PDB database with comprehensive metadata.
- **Purpose**: Get experimental protein structure information
- **Input**: PDB ID (4-character code)
- **Returns**: Structure metadata, chain information, ligands, resolution, and experimental details

#### `analyze_secondary_structure`
Analyze protein secondary structure from PDB data or predict from sequence.
- **Purpose**: Determine protein secondary structure elements
- **Input**: Protein sequence with optional PDB structure
- **Returns**: Secondary structure composition, helices, sheets, turns, and structural classification

#### `predict_rna_secondary_structure`
Predict RNA secondary structure using thermodynamic algorithms.
- **Purpose**: Predict RNA folding and stability
- **Input**: RNA sequence
- **Returns**: Secondary structure, base pairs, loops, stems, and thermodynamic analysis

#### `scan_rna_motifs`
Identify functional RNA motifs and regulatory elements in sequence.
- **Purpose**: Find functional RNA elements and regulatory sites
- **Input**: RNA sequence with structure context option
- **Returns**: Regulatory motifs, structural elements, and functional predictions

### 🌳 Phylogenetics Tools (2 tools)

#### `build_phylogenetic_tree`
Build phylogenetic tree from multiple sequences using Neighbor-Joining, UPGMA, or Maximum Parsimony.
- **Purpose**: Construct evolutionary trees from sequence data
- **Input**: 3-50 sequences with method selection and bootstrap options
- **Returns**: Phylogenetic tree in Newick format with branch lengths and support values

#### `compare_phylogenetic_trees`
Compare two phylogenetic trees using Robinson-Foulds distance and other metrics.
- **Purpose**: Assess topological differences between trees
- **Input**: Two sets of sequences for tree comparison
- **Returns**: Tree comparison metrics, topological differences, and statistical assessment

### 📊 Documentation Tools (2 tools)

#### `log_analysis_parameters`
Record workflow parameters, data, and results for reproducibility and tracking.
- **Purpose**: Document analysis workflows for reproducibility
- **Input**: Tool name, parameters, input data, and results
- **Returns**: Structured log entry with performance metrics and metadata

#### `generate_resource_map`
Create comprehensive guide of bioinformatics databases, tools, and workflow recommendations.
- **Purpose**: Generate personalized resource guides and workflow recommendations
- **Input**: Focus areas and analysis history
- **Returns**: Curated database list, algorithm recommendations, workflow guides, and citations

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

// Analyze DNA sequence GC content
{
  "tool": "analyze_gc_content",
  "arguments": {
    "sequence": "ATCGATCGATCGATCG"
  }
}

// Build phylogenetic tree
{
  "tool": "build_phylogenetic_tree",
  "arguments": {
    "sequences": [
      {"id": "seq1", "sequence": "MKLLLLLL..."},
      {"id": "seq2", "sequence": "MKLLLLLL..."},
      {"id": "seq3", "sequence": "MKLLLLLL..."}
    ],
    "method": "neighbor-joining",
    "bootstrap_replicates": 100
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

- **37 comprehensive tools** covering all major bioinformatics analysis types
- **11+ major biological databases** integrated (PubMed, UniProt, NCBI, KEGG, PDB, etc.)
- **Complete research workflows** from literature review to phylogenetic analysis
- **Advanced algorithms** including BLAST, multiple alignment, phylogenetics, and structure prediction
- **Reproducible analysis** with comprehensive logging and documentation tools
- **Flexible input/output** supporting multiple sequence formats and databases

## 🧬 Analysis Categories

### Sequence Analysis
- DNA/RNA composition and structure analysis
- ORF prediction and restriction mapping
- Protein property prediction and motif scanning
- Transmembrane region and secondary structure prediction

### Comparative Analysis
- Sequence similarity searching (BLAST, PSI-BLAST)
- Pairwise and multiple sequence alignment
- Phylogenetic tree construction and comparison
- Conservation analysis and motif discovery

### Database Integration
- Literature mining from PubMed
- Protein data from UniProt
- Nucleotide sequences from GenBank/RefSeq/Ensembl
- Structural data from PDB
- Pathway information from KEGG and Reactome

### Advanced Analytics
- RNA secondary structure prediction
- Post-translational modification analysis
- Cross-database reference mapping
- Fragment assembly and sequence reconstruction

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run inspect`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.