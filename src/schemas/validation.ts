/**
 * Zod validation schemas for MCP tools
 */

import { z } from "zod";

// PubMed tool schemas
export const searchPubMedSchema = {
  term: z.string().describe("Search term for PubMed (e.g., 'CRISPR gene editing', 'COVID-19 vaccines')"),
  max_results: z.number().min(1).max(20).optional().describe("Maximum number of results to return (default: 5, max: 20)"),
};

export const getPublicationDetailsSchema = {
  pmid: z.string().describe("PubMed ID of the publication (e.g., '12345678')"),
};

export const getPublicationAbstractSchema = {
  pmid: z.string().describe("PubMed ID of the publication (e.g., '12345678')"),
};

// UniProt tool schemas
export const searchUniProtSchema = {
  query: z.string().describe("Search query for UniProtKB (e.g., 'insulin', 'gene:BRCA1', 'organism:9606 AND diabetes', 'P04637')"),
  max_results: z.number().min(1).max(50).optional().describe("Maximum number of results to return (default: 5, max: 50)"),
};

export const getProteinEntrySchema = {
  accession: z.string().describe("UniProt accession number (e.g., 'P04637', 'Q9Y6K1')"),
};

export const getProteinSequenceSchema = {
  accession: z.string().describe("UniProt accession number (e.g., 'P04637', 'Q9Y6K1')"),
};

// Chapter 3: Nucleotide sequence analysis schemas
export const getNucleotideSequenceSchema = {
  accession: z.string().describe("GenBank/RefSeq accession number (e.g., 'NM_000546', 'NC_000001')"),
  database: z.enum(['genbank', 'refseq', 'ensembl']).optional().describe("Database to search (default: genbank)"),
  format: z.enum(['fasta', 'genbank', 'json']).optional().describe("Output format (default: fasta)"),
};

export const compareAnnotationsSchema = {
  seq1_id: z.string().describe("First sequence identifier (GenBank/RefSeq accession)"),
  seq2_id: z.string().describe("Second sequence identifier (GenBank/RefSeq accession)"),
  organism_type: z.enum(['prokaryotic', 'eukaryotic', 'auto']).optional().describe("Organism type filter (default: auto-detect)"),
  feature_types: z.array(z.string()).optional().describe("Specific feature types to compare (e.g., ['CDS', 'gene', 'tRNA'])"),
};

export const findIntronExonsSchema = {
  sequence_id: z.string().describe("Gene sequence identifier (GenBank/RefSeq accession)"),
  organism: z.string().optional().describe("Organism name or taxonomy ID for context"),
  gene_name: z.string().optional().describe("Gene name for additional validation"),
  splice_site_analysis: z.boolean().optional().describe("Include splice site consensus analysis (default: true)"),
};

export const alignPromotersSchema = {
  sequence_list: z.array(z.string()).min(2).max(10).describe("List of gene identifiers to analyze promoter regions"),
  organism: z.string().optional().describe("Organism name or taxonomy ID"),
  upstream_length: z.number().min(100).max(5000).optional().describe("Length of upstream region to analyze (default: 2000 bp)"),
  motif_search: z.boolean().optional().describe("Search for known promoter motifs (default: true)"),
};

// Chapter 4: Enhanced protein analysis schemas
export const getCrossReferencesSchema = {
  protein_id: z.string().describe("UniProt accession number (e.g., 'P04637')"),
  databases: z.array(z.enum(['kegg', 'pfam', 'pdb', 'interpro', 'go', 'reactome'])).optional().describe("Specific databases to query (default: all)"),
  include_details: z.boolean().optional().describe("Include detailed information for each reference (default: true)"),
};

export const analyzePTMsSchema = {
  protein_id: z.string().describe("UniProt accession number (e.g., 'P04637')"),
  ptm_types: z.array(z.string()).optional().describe("Specific PTM types to analyze (e.g., ['phosphorylation', 'acetylation', 'ubiquitination'])"),
  functional_analysis: z.boolean().optional().describe("Include functional impact analysis (default: true)"),
  confidence_threshold: z.enum(['high', 'medium', 'low']).optional().describe("Minimum confidence level for PTMs (default: medium)"),
};

export const getPathwayDataSchema = {
  protein_id: z.string().describe("UniProt accession number (e.g., 'P04637')"),
  pathway_db: z.enum(['kegg', 'reactome', 'wikipathways', 'biocyc']).optional().describe("Pathway database to query (default: kegg)"),
  include_reactions: z.boolean().optional().describe("Include detailed reaction information (default: true)"),
  related_proteins: z.boolean().optional().describe("Include related proteins in pathways (default: false)"),
};

// Validation helper functions
export const validatePmid = (pmid: string): boolean => {
  return /^\d+$/.test(pmid);
};

export const validateUniProtAccession = (accession: string): boolean => {
  return /^[A-Z0-9][A-Z0-9-]*[0-9]$/.test(accession.toUpperCase());
};

export const validateGenBankAccession = (accession: string): boolean => {
  // GenBank/RefSeq patterns: NM_000546, NC_000001, XM_123456, etc.
  return /^[A-Z]{1,2}_\d+(\.\d+)?$/.test(accession.toUpperCase());
};

export const validateEnsemblId = (id: string): boolean => {
  // Ensembl patterns: ENSG00000141510, ENST00000269305, etc.
  return /^ENS[A-Z]*[GTE]\d{11}(\.\d+)?$/.test(id.toUpperCase());
};

// DNA Analysis tool schemas
export const analyzeGCContentSchema = {
  sequence: z.string().min(1).describe("DNA sequence to analyze for GC content and composition"),
};

export const findRestrictionSitesSchema = {
  sequence: z.string().min(1).describe("DNA sequence to search for restriction enzyme cut sites"),
  enzymes: z.array(z.string()).optional().describe("Specific restriction enzymes to search for (default: common enzymes)"),
  include_fragment_analysis: z.boolean().optional().describe("Include fragment size analysis (default: true)"),
};

export const predictORFsSchema = {
  sequence: z.string().min(1).describe("DNA sequence to scan for open reading frames"),
  min_length: z.number().min(30).optional().describe("Minimum ORF length in base pairs (default: 100)"),
  show_sequences: z.boolean().optional().describe("Include amino acid sequences in output (default: false)"),
};

export const assembleFragmentsSchema = {
  fragments: z.array(z.object({
    id: z.string().optional().describe("Fragment identifier"),
    sequence: z.string().min(1).describe("DNA sequence of the fragment")
  })).min(1).describe("Array of DNA fragments to assemble"),
  min_overlap: z.number().min(3).optional().describe("Minimum overlap length for assembly (default: 10)"),
  show_assembly: z.boolean().optional().describe("Include assembled sequence in output (default: true)"),
};

// Protein Sequence Analysis tool schemas
export const predictProteinPropertiesSchema = {
  sequence: z.string().min(1).describe("Protein sequence (single letter amino acid codes)"),
  include_composition: z.boolean().optional().describe("Include detailed amino acid composition (default: true)"),
};

export const predictTransmembraneRegionsSchema = {
  sequence: z.string().min(1).describe("Protein sequence to analyze for transmembrane regions"),
  window_size: z.number().min(7).max(25).optional().describe("Sliding window size for hydropathy analysis (default: 19)"),
  threshold: z.number().min(0.5).max(3.0).optional().describe("Hydropathy threshold for TM detection (default: 1.6)"),
};

export const scanProteinMotifsSchema = {
  sequence: z.string().min(1).describe("Protein sequence to scan for functional motifs"),
  motif_database: z.enum(['prosite', 'pfam', 'interpro']).optional().describe("Motif database to use (default: prosite)"),
  min_score: z.number().min(0).max(1).optional().describe("Minimum confidence score for motif matches (default: 0.5)"),
};

// Sequence Similarity tool schemas
export const blastSearchSchema = {
  sequence: z.string().min(1).describe("Query sequence for BLAST search"),
  database: z.enum(['nr', 'nt', 'refseq_protein', 'refseq_genomic', 'swissprot', 'pdb']).optional().describe("BLAST database to search (default: nr)"),
  program: z.enum(['blastp', 'blastn', 'blastx', 'tblastn', 'tblastx']).optional().describe("BLAST program to use (default: blastp)"),
  max_hits: z.number().min(1).max(500).optional().describe("Maximum number of hits to return (default: 50)"),
  e_value_threshold: z.number().min(1e-200).max(1000).optional().describe("E-value threshold for significance (default: 10.0)"),
};

export const psiBlastSearchSchema = {
  sequence: z.string().min(1).describe("Query protein sequence for PSI-BLAST search"),
  database: z.enum(['nr', 'refseq_protein', 'swissprot', 'pdb']).optional().describe("Protein database to search (default: nr)"),
  iterations: z.number().min(1).max(10).optional().describe("Number of PSI-BLAST iterations (default: 3)"),
  e_value_threshold: z.number().min(1e-200).max(1.0).optional().describe("E-value threshold for significance (default: 0.005)"),
  inclusion_threshold: z.number().min(1e-10).max(1.0).optional().describe("E-value threshold for profile inclusion (default: 0.005)"),
};

export const alignSequencesGlobalSchema = {
  sequence1: z.string().min(1).describe("First sequence for alignment"),
  sequence2: z.string().min(1).describe("Second sequence for alignment"),
  sequence_type: z.enum(['protein', 'dna', 'rna']).optional().describe("Type of sequences being aligned (default: protein)"),
  gap_penalty: z.number().max(0).optional().describe("Gap penalty for alignment (default: -1)"),
  match_score: z.number().min(0).optional().describe("Match score for DNA/RNA alignment (default: 2)"),
  mismatch_score: z.number().max(0).optional().describe("Mismatch penalty for DNA/RNA alignment (default: -1)"),
};

export const alignSequencesLocalSchema = {
  sequence1: z.string().min(1).describe("First sequence for local alignment"),
  sequence2: z.string().min(1).describe("Second sequence for local alignment"),
  sequence_type: z.enum(['protein', 'dna', 'rna']).optional().describe("Type of sequences being aligned (default: protein)"),
  gap_penalty: z.number().max(0).optional().describe("Gap penalty for alignment (default: -1)"),
  match_score: z.number().min(0).optional().describe("Match score for DNA/RNA alignment (default: 2)"),
  mismatch_score: z.number().max(0).optional().describe("Mismatch penalty for DNA/RNA alignment (default: -1)"),
};

export const generateDotplotSchema = {
  sequence1: z.string().min(1).describe("First sequence for dot plot comparison"),
  sequence2: z.string().min(1).describe("Second sequence for dot plot comparison"),
  window_size: z.number().min(1).max(50).optional().describe("Window size for comparison (default: 1)"),
  threshold: z.number().min(0).optional().describe("Minimum matches in window for dot (default: 1)"),
  max_points: z.number().min(100).max(100000).optional().describe("Maximum number of points to display (default: 1000)"),
};

// Multiple Alignment tool schemas
export const multipleSequenceAlignmentSchema = {
  sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Sequence data")
  })).min(2).max(20).describe("Array of sequences to align (2-20 sequences)"),
  sequence_type: z.enum(['protein', 'dna', 'rna']).optional().describe("Type of sequences being aligned (default: protein)"),
  gap_penalty: z.number().max(0).optional().describe("Gap penalty for alignment (default: -1)"),
};

export const highlightConservedRegionsSchema = {
  alignment_sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Aligned sequence data")
  })).min(2).describe("Array of aligned sequences"),
  min_length: z.number().min(2).max(50).optional().describe("Minimum length for conserved regions (default: 5)"),
  conservation_threshold: z.number().min(0.5).max(1.0).optional().describe("Conservation threshold (default: 0.8)"),
};

export const generateSequenceLogoSchema = {
  alignment_sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Aligned sequence data")
  })).min(2).describe("Array of aligned sequences"),
  include_gaps: z.boolean().optional().describe("Include gap positions in logo (default: false)"),
  information_threshold: z.number().min(0).max(4).optional().describe("Minimum information content to display (default: 0.1)"),
};

export const exportAlignmentSchema = {
  alignment_sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Aligned sequence data")
  })).min(2).describe("Array of aligned sequences"),
  format: z.enum(['fasta', 'phylip', 'clustal', 'msf']).optional().describe("Export format (default: fasta)"),
  include_description: z.boolean().optional().describe("Include sequence descriptions (default: true)"),
};

// Structure & RNA Analysis tool schemas
export const getProteinStructureSchema = {
  pdb_id: z.string().min(4).max(4).describe("PDB identifier (4 characters, e.g., '1ABC')"),
};

export const analyzeSecondaryStructureSchema = {
  sequence: z.string().min(1).describe("Protein sequence to analyze"),
  pdb_id: z.string().min(4).max(4).optional().describe("Optional PDB ID for experimental structure data"),
};

export const predictRNASecondaryStructureSchema = {
  sequence: z.string().min(1).describe("RNA sequence for secondary structure prediction"),
};

export const scanRNAMotifsSchema = {
  sequence: z.string().min(1).describe("RNA sequence to scan for motifs"),
  structure_context: z.boolean().optional().describe("Include secondary structure context (default: false)"),
};

// Phylogenetics tool schemas
export const buildPhylogeneticTreeSchema = {
  sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Sequence data")
  })).min(3).max(50).describe("Array of sequences for tree building (3-50 sequences)"),
  method: z.enum(['neighbor-joining', 'nj', 'upgma', 'maximum-parsimony', 'mp']).optional().describe("Tree building method (default: neighbor-joining)"),
  bootstrap_replicates: z.number().min(0).max(1000).optional().describe("Number of bootstrap replicates (default: 0)"),
};

export const comparePhylogeneticTreesSchema = {
  tree1_sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Sequence data")
  })).min(3).max(50).describe("Sequences for first tree"),
  tree2_sequences: z.array(z.object({
    id: z.string().optional().describe("Sequence identifier"),
    description: z.string().optional().describe("Sequence description"),
    sequence: z.string().min(1).describe("Sequence data")
  })).min(3).max(50).describe("Sequences for second tree"),
  tree1_method: z.enum(['neighbor-joining', 'nj', 'upgma', 'maximum-parsimony', 'mp']).optional().describe("Method for first tree (default: neighbor-joining)"),
  tree2_method: z.enum(['neighbor-joining', 'nj', 'upgma', 'maximum-parsimony', 'mp']).optional().describe("Method for second tree (default: neighbor-joining)"),
};

// Documentation & Resource tool schemas
export const logAnalysisParametersSchema = {
  tool_name: z.string().min(1).describe("Name of the tool used in the analysis"),
  analysis_type: z.string().min(1).describe("Type of analysis performed"),
  parameters: z.record(z.any()).optional().describe("Analysis parameters used"),
  input_data: z.any().optional().describe("Input data characteristics"),
  results: z.any().optional().describe("Analysis results summary"),
  execution_time_ms: z.number().min(0).optional().describe("Execution time in milliseconds"),
  metadata: z.object({
    user_id: z.string().optional().describe("User identifier"),
    project_name: z.string().optional().describe("Project name"),
    workflow_id: z.string().optional().describe("Workflow identifier"),
    notes: z.string().optional().describe("Analysis notes"),
    tags: z.array(z.string()).optional().describe("Analysis tags")
  }).optional().describe("Additional metadata"),
};

export const generateResourceMapSchema = {
  focus_areas: z.array(z.string()).optional().describe("Specific areas of bioinformatics to focus on"),
  include_citations: z.boolean().optional().describe("Include recommended citations (default: true)"),
  include_workflow_guide: z.boolean().optional().describe("Include workflow recommendations (default: true)"),
  custom_resources: z.object({
    databases: z.array(z.any()).optional().describe("Custom database resources"),
    algorithms: z.array(z.any()).optional().describe("Custom algorithm resources"),
    web_services: z.array(z.any()).optional().describe("Custom web service resources"),
    software_tools: z.array(z.any()).optional().describe("Custom software tool resources"),
    file_formats: z.array(z.any()).optional().describe("Custom file format resources")
  }).optional().describe("Custom resource definitions"),
};

export const validateTaxonomyId = (taxId: string): boolean => {
  return /^\d+$/.test(taxId);
};
