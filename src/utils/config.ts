/**
 * Configuration constants for the biotools MCP server
 */

// Existing API endpoints
export const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
export const UNIPROT_BASE_URL = "https://rest.uniprot.org/uniprotkb";

// New API endpoints for nucleotide sequence analysis
export const NCBI_NUCLEOTIDE_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
export const ENSEMBL_BASE_URL = "https://rest.ensembl.org";
export const GENBANK_BASE_URL = "https://www.ncbi.nlm.nih.gov/nuccore/";

// Enhanced protein analysis endpoints
export const KEGG_BASE_URL = "https://rest.kegg.jp";
export const PFAM_BASE_URL = "https://pfam.xfam.org/family";
export const PDB_BASE_URL = "https://data.rcsb.org/rest/v1/core";
export const INTERPRO_BASE_URL = "https://www.ebi.ac.uk/interpro/api";
export const REACTOME_BASE_URL = "https://reactome.org/ContentService";

// User agent for all requests
export const BIO_USER_AGENT = "BioTools-MCP-Server/1.0";

// API limits and timeouts
export const DEFAULT_REQUEST_TIMEOUT = 30000; // 30 seconds
export const MAX_SEQUENCE_LENGTH = 100000; // 100kb max sequence
export const MAX_ALIGNMENT_SEQUENCES = 10;
