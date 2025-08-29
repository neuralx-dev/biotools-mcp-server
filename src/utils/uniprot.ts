/**
 * UniProtKB API utility functions
 */

import { 
  UniProtSearchResult, 
  UniProtEntry 
} from "../types/interfaces.js";
import { UNIPROT_BASE_URL, BIO_USER_AGENT } from "./config.js";

/**
 * Make a request to UniProt API
 */
export async function makeUniProtRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": BIO_USER_AGENT,
    "Accept": "application/json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making UniProt request:", error);
    return null;
  }
}

/**
 * Search UniProt entries
 */
export async function searchUniProtEntries(query: string, size: number = 5): Promise<UniProtEntry[] | null> {
  // Request ALL comprehensive fields for maximum data retrieval
  const fields = [
    // Basic identification and naming
    'accession', 'id', 'protein_name', 'gene_names', 'organism_name', 'organism_id',
    'length', 'mass', 'sequence', 'keywords', 'protein_existence', 'annotation_score',
    'lineage', 'virus_hosts', 'taxonomic_lineage', 'organism_common_name',
    
    // Comments - ALL types
    'cc_function', 'cc_subcellular_location', 'cc_interaction', 'cc_disease', 
    'cc_pathway', 'cc_catalytic_activity', 'cc_cofactor', 'cc_activity_regulation',
    'cc_biophysicochemical_properties', 'cc_developmental_stage', 'cc_induction',
    'cc_domain', 'cc_ptm', 'cc_rna_editing', 'cc_mass_spectrometry', 'cc_tissue_specificity',
    'cc_allergen', 'cc_biotechnology', 'cc_disruption_phenotype', 'cc_pharmaceutical',
    'cc_toxic_dose', 'cc_miscellaneous', 'cc_sequence_caution', 'cc_similarity',
    'cc_online_information', 'cc_web_resource', 'cc_alternative_products',
    
    // Features - ALL types
    'ft_domain', 'ft_region', 'ft_site', 'ft_binding', 'ft_act_site', 'ft_metal',
    'ft_carbohyd', 'ft_lipid', 'ft_mod_res', 'ft_signal', 'ft_transit', 'ft_propep',
    'ft_chain', 'ft_peptide', 'ft_variant', 'ft_mutagen', 'ft_conflict', 'ft_unsure',
    'ft_non_cons', 'ft_non_ter', 'ft_helix', 'ft_strand', 'ft_turn', 'ft_coiled',
    'ft_init_met', 'ft_topo_dom', 'ft_transmem', 'ft_intramem', 'ft_repeat',
    'ft_ca_bind', 'ft_dna_bind', 'ft_np_bind', 'ft_motif', 'ft_compbias',
    'ft_se_cys', 'ft_crosslnk', 'ft_disulfid', 'ft_var_seq', 'ft_splice',
    
    // Cross-references - ALL databases
    'xref_pdb', 'xref_embl', 'xref_refseq', 'xref_ensembl', 'xref_string',
    'xref_interpro', 'xref_pfam', 'xref_smart', 'xref_prosite', 'xref_go',
    'xref_reactome', 'xref_kegg', 'xref_biocyc', 'xref_uniparc', 'xref_proteomes',
    'xref_alphafolddb', 'xref_smr', 'xref_biosystems', 'xref_mint', 'xref_intact',
    'xref_dip', 'xref_compluyeast_2dpage', 'xref_world_2dpage', 'xref_dosac_cobs_2dpage',
    'xref_reproduction_2dpage', 'xref_ogp', 'xref_cornea_2dpage', 'xref_hspi_2dpage',
    'xref_phci_2dpage', 'xref_pmma_2dpage', 'xref_ucd_2dpage', 'xref_siena_2dpage',
    'xref_upa_2dpage', 'xref_pride', 'xref_peptideatlas', 'xref_cptac', 'xref_prodb',
    'xref_topdownproteomics', 'xref_antibodypedia', 'xref_dnasu', 'xref_corum',
    'xref_complexportal', 'xref_ccds', 'xref_disprot', 'xref_ideal', 'xref_mobidb',
    'xref_elm', 'xref_treefam', 'xref_genetree', 'xref_hogenom', 'xref_hovergen',
    'xref_ko', 'xref_inparanoid', 'xref_orthodb', 'xref_phylomedb', 'xref_brenda',
    'xref_sabio_rk', 'xref_pathwaycommons', 'xref_signor', 'xref_signalink',
    'xref_unipathway', 'xref_pharos', 'xref_chitars', 'xref_genevisible',
    
    // Literature and references
    'lit_pubmed_id', 'lit_doi', 'literature', 'reviewed',
    
    // Dates and versioning
    'date_created', 'date_modified', 'date_sequence_modified', 'version',
    'date_integrated', 'date_name_changed', 'date_annotation_changed',
    
    // Additional fields
    'fragment', 'existence', 'tools', 'structure_3d', 'active_site',
    'binding_site', 'site', 'kinetics', 'ph_dependence', 'redox_potential',
    'temperature_dependence', 'absorption', 'alternative_products',
    'polymorphism', 'domain_architecture', 'proteome', 'cluster',
    'subcellular_location_note', 'tissue_specificity'
  ].join(',');
  
  const url = `${UNIPROT_BASE_URL}/search?query=${encodeURIComponent(query)}&format=json&size=${size}&fields=${fields}`;
  const data = await makeUniProtRequest<UniProtSearchResult>(url);
  
  if (!data || !data.results) {
    return null;
  }
  
  return data.results;
}

/**
 * Get specific UniProt entry by accession
 */
export async function getUniProtEntry(accession: string): Promise<UniProtEntry | null> {
  const url = `${UNIPROT_BASE_URL}/${accession}.json`;
  const data = await makeUniProtRequest<UniProtEntry>(url);
  return data;
}

/**
 * Get UniProt sequence in FASTA format
 */
export async function getUniProtSequence(accession: string): Promise<string | null> {
  const url = `${UNIPROT_BASE_URL}/${accession}.fasta`;
  
  const headers = {
    "User-Agent": BIO_USER_AGENT,
    "Accept": "text/plain",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error("Error fetching UniProt sequence:", error);
    return null;
  }
}

/**
 * Format UniProt entry for comprehensive display
 */
export function formatUniProtEntry(entry: UniProtEntry): string {
  const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || 
                     entry.proteinDescription?.submissionNames?.[0]?.fullName?.value || 
                     "Unknown protein";
  
  // Extract alternative names
  const altNames = entry.proteinDescription?.alternativeNames?.map(alt => 
    alt.fullName?.value || alt.shortNames?.[0]?.value
  ).filter(Boolean) || [];
  
  // Extract EC numbers
  const ecNumbers = [
    ...(entry.proteinDescription?.recommendedName?.ecNumbers?.map(ec => ec.value) || []),
    ...(entry.proteinDescription?.alternativeNames?.flatMap(alt => 
      alt.ecNumbers?.map(ec => ec.value) || []
    ) || [])
  ];
  
  // Gene information
  const geneNames: string[] = [];
  const synonyms: string[] = [];
  const orderedLoci: string[] = [];
  if (entry.genes && entry.genes.length > 0) {
    entry.genes.forEach(gene => {
      if (gene.geneName?.value) geneNames.push(gene.geneName.value);
      if (gene.synonyms) synonyms.push(...gene.synonyms.map(s => s.value));
      if (gene.orderedLocusNames) orderedLoci.push(...gene.orderedLocusNames.map(o => o.value));
    });
  }

  // Organism details
  const organism = entry.organism?.scientificName || "Unknown organism";
  const commonName = entry.organism?.commonName;
  const taxonomyId = entry.organism?.taxonId;
  const lineage = entry.organism?.lineage?.slice(-5).join(" > ") || "Unknown lineage"; // Last 5 levels

  // Function information
  const functionComments = entry.comments?.filter(c => c.commentType === "FUNCTION") || [];
  const functionText = functionComments.map(c => 
    c.texts?.map(t => t.value).join(" ")
  ).join(" ").substring(0, 300) + (functionComments.length > 0 ? "..." : "No function annotation");

  // Subcellular location
  const locationComments = entry.comments?.filter(c => c.commentType === "SUBCELLULAR LOCATION") || [];
  const locations = locationComments.map(c => 
    c.texts?.map(t => t.value).join(" ")
  ).join("; ") || "Unknown location";

  // Pathway information
  const pathwayComments = entry.comments?.filter(c => c.commentType === "PATHWAY") || [];
  const pathways = pathwayComments.map(c => 
    c.texts?.map(t => t.value).join(" ")
  ).join("; ") || "No pathway annotation";

  // Disease associations
  const diseaseComments = entry.comments?.filter(c => c.commentType === "DISEASE") || [];
  const diseases = diseaseComments.map(c => 
    c.texts?.map(t => t.value).join(" ")
  ).join("; ") || "No disease associations";

  // Features
  const domains = entry.features?.filter(f => f.type === "DOMAIN").slice(0, 3).map(d => 
    `${d.description || "Domain"} (${d.location.start.value}-${d.location.end.value})`
  ) || [];

  const bindingSites = entry.features?.filter(f => f.type === "BINDING").slice(0, 3).map(b => 
    `${b.description || "Binding site"} (${b.location.start.value})`
  ) || [];

  const activeSites = entry.features?.filter(f => f.type === "ACT_SITE").slice(0, 3).map(a => 
    `${a.description || "Active site"} (${a.location.start.value})`
  ) || [];

  // Cross-references
  const pdbRefs = entry.uniProtKBCrossReferences?.filter(ref => ref.database === "PDB").slice(0, 3).map(ref => ref.id) || [];
  const ensemblRefs = entry.uniProtKBCrossReferences?.filter(ref => ref.database === "Ensembl").slice(0, 2).map(ref => ref.id) || [];
  const goRefs = entry.uniProtKBCrossReferences?.filter(ref => ref.database === "GO").slice(0, 5).map(ref => ref.id) || [];

  // Keywords by category
  const keywords = entry.keywords?.slice(0, 8).map(k => k.name) || [];
  
  const sequenceLength = entry.sequence?.length || "Unknown";
  const molecularWeight = entry.sequence?.molWeight ? `${(entry.sequence.molWeight / 1000).toFixed(1)} kDa` : "Unknown";

  return [
    `Accession: ${entry.primaryAccession}`,
    `UniProt ID: ${entry.uniProtkbId}`,
    `Protein Name: ${proteinName}`,
    altNames.length ? `Alternative Names: ${altNames.slice(0, 2).join(", ")}` : "",
    ecNumbers.length ? `EC Numbers: ${ecNumbers.join(", ")}` : "",
    "",
    `Gene Names: ${geneNames.length ? geneNames.join(", ") : "No gene names"}`,
    synonyms.length ? `Gene Synonyms: ${synonyms.slice(0, 3).join(", ")}` : "",
    orderedLoci.length ? `Locus Names: ${orderedLoci.slice(0, 2).join(", ")}` : "",
    "",
    `Organism: ${organism}${commonName ? ` (${commonName})` : ""}`,
    `Taxonomy ID: ${taxonomyId || "Unknown"}`,
    `Lineage: ${lineage}`,
    "",
    `Sequence: ${sequenceLength} amino acids, ${molecularWeight}`,
    `Protein Existence: ${entry.proteinExistence?.evidenceLabel || "Unknown"}`,
    `Annotation Score: ${entry.annotationScore || "Unknown"}/5`,
    "",
    `Function: ${functionText}`,
    "",
    `Subcellular Location: ${locations.substring(0, 150)}${locations.length > 150 ? "..." : ""}`,
    pathways !== "No pathway annotation" ? `Pathways: ${pathways.substring(0, 150)}${pathways.length > 150 ? "..." : ""}` : "",
    diseases !== "No disease associations" ? `Disease Associations: ${diseases.substring(0, 150)}${diseases.length > 150 ? "..." : ""}` : "",
    "",
    domains.length ? `Domains: ${domains.join(", ")}` : "",
    bindingSites.length ? `Binding Sites: ${bindingSites.join(", ")}` : "",
    activeSites.length ? `Active Sites: ${activeSites.join(", ")}` : "",
    "",
    `Keywords: ${keywords.length ? keywords.join(", ") : "No keywords"}`,
    "",
    pdbRefs.length ? `PDB Structures: ${pdbRefs.join(", ")}` : "",
    ensemblRefs.length ? `Ensembl IDs: ${ensemblRefs.join(", ")}` : "",
    goRefs.length ? `GO Terms: ${goRefs.slice(0, 3).join(", ")}${goRefs.length > 3 ? ` (+${goRefs.length - 3} more)` : ""}` : "",
    "",
    `Entry Version: ${entry.entryAudit?.entryVersion || "Unknown"}`,
    `Last Updated: ${entry.entryAudit?.lastAnnotationUpdateDate || "Unknown"}`,
    "",
  ].filter(line => line !== "").join("\n");
}
