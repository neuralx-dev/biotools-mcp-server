/**
 * UniProt MCP tools
 */

import { 
  searchUniProtEntries, 
  getUniProtEntry, 
  getUniProtSequence,
  formatUniProtEntry 
} from "../utils/uniprot.js";
import { 
  searchUniProtSchema, 
  getProteinEntrySchema, 
  getProteinSequenceSchema,
  validateUniProtAccession 
} from "../schemas/validation.js";
// MCP tool response types are handled by the SDK
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerUniProtTools(server: McpServer) {
  server.tool(
    "search_uniprot",
    "Search UniProtKB database for proteins and return formatted results",
    searchUniProtSchema,
    async ({ query, max_results = 5 }) => {
      try {
        // Limit max_results to reasonable bounds
        const limitedResults = Math.min(Math.max(1, max_results), 50);
        
        // Search for proteins
        const entries = await searchUniProtEntries(query, limitedResults);
        
        if (!entries || entries.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No results found for search query: '${query}'`,
              },
            ],
          };
        }
        
        // Format results
        const formattedEntries = entries.map(formatUniProtEntry);
        const resultHeader = `Found ${formattedEntries.length} protein(s) for search query: '${query}'\n\n`;
        const resultText = resultHeader + formattedEntries.join("---\n");
        
        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching UniProtKB: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "get_protein_entry",
    "Get detailed information for a specific UniProt protein entry by accession",
    getProteinEntrySchema,
    async ({ accession }) => {
      try {
        // Validate accession format
        if (!validateUniProtAccession(accession)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid UniProt accession format: '${accession}'. Accession should be alphanumeric (e.g., P04637).`,
              },
            ],
          };
        }
        
        // Fetch detailed entry
        const entry = await getUniProtEntry(accession.toUpperCase());
        
        if (!entry) {
          return {
            content: [
              {
                type: "text",
                text: `No protein entry found for accession: ${accession}`,
              },
            ],
          };
        }
        
        // Format comprehensive detailed information
        const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || 
                           entry.proteinDescription?.submissionNames?.[0]?.fullName?.value || 
                           "Unknown protein";
        
        // Extract all protein names and EC numbers
        const shortNames = entry.proteinDescription?.recommendedName?.shortNames?.map(s => s.value) || [];
        const altNames = entry.proteinDescription?.alternativeNames?.map(alt => 
          alt.fullName?.value || alt.shortNames?.[0]?.value
        ).filter(Boolean) || [];
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
        const orfNames: string[] = [];
        if (entry.genes && entry.genes.length > 0) {
          entry.genes.forEach(gene => {
            if (gene.geneName?.value) geneNames.push(gene.geneName.value);
            if (gene.synonyms) synonyms.push(...gene.synonyms.map(s => s.value));
            if (gene.orderedLocusNames) orderedLoci.push(...gene.orderedLocusNames.map(o => o.value));
            if (gene.orfNames) orfNames.push(...gene.orfNames.map(o => o.value));
          });
        }

        // Organism details
        const organism = entry.organism?.scientificName || "Unknown organism";
        const commonName = entry.organism?.commonName;
        const taxonomyId = entry.organism?.taxonId || "Unknown";
        const lineage = entry.organism?.lineage?.slice(-7).join(" > ") || "Unknown lineage";

        // Sequence information
        const sequenceLength = entry.sequence?.length || "Unknown";
        const molecularWeight = entry.sequence?.molWeight ? `${(entry.sequence.molWeight / 1000).toFixed(2)} kDa` : "Unknown";
        const crc64 = entry.sequence?.crc64;
        const md5 = entry.sequence?.md5;

        // Comprehensive comments by type
        const commentsByType = entry.comments?.reduce((acc, comment) => {
          if (!acc[comment.commentType]) acc[comment.commentType] = [];
          acc[comment.commentType].push(comment.texts?.map(t => t.value).join(" ") || "");
          return acc;
        }, {} as Record<string, string[]>) || {};

        // Extract specific comment types
        const functionText = commentsByType["FUNCTION"]?.join(" ") || "No functional annotation available";
        const subcellularLocation = commentsByType["SUBCELLULAR LOCATION"]?.join("; ") || "Unknown location";
        const pathways = commentsByType["PATHWAY"]?.join("; ") || "No pathway information";
        const diseases = commentsByType["DISEASE"]?.join("; ") || "No disease associations";
        const catalyticActivity = commentsByType["CATALYTIC ACTIVITY"]?.join("; ") || "No catalytic activity data";
        const cofactors = commentsByType["COFACTOR"]?.join("; ") || "No cofactor information";
        const interactions = commentsByType["INTERACTION"]?.join("; ") || "No interaction data";
        const ptm = commentsByType["PTM"]?.join("; ") || "No post-translational modifications";
        const biophysProperties = commentsByType["BIOPHYSICOCHEMICAL PROPERTIES"]?.join("; ") || "No biophysical data";

        // Features organized by type
        const featuresByType = entry.features?.reduce((acc, feature) => {
          if (!acc[feature.type]) acc[feature.type] = [];
          acc[feature.type].push(feature);
          return acc;
        }, {} as Record<string, typeof entry.features>) || {};

        const domains = featuresByType["DOMAIN"]?.slice(0, 5).map(d => 
          `${d.description || "Domain"} (${d.location.start.value}-${d.location.end.value})`
        ) || [];
        
        const bindingSites = featuresByType["BINDING"]?.slice(0, 5).map(b => 
          `${b.description || "Binding site"} (${b.location.start.value})`
        ) || [];
        
        const activeSites = featuresByType["ACT_SITE"]?.slice(0, 3).map(a => 
          `${a.description || "Active site"} (${a.location.start.value})`
        ) || [];
        
        const modifications = featuresByType["MOD_RES"]?.slice(0, 5).map(m => 
          `${m.description || "Modified residue"} (${m.location.start.value})`
        ) || [];
        
        const metalSites = featuresByType["METAL"]?.slice(0, 3).map(m => 
          `${m.description || "Metal binding"} (${m.location.start.value})`
        ) || [];

        const signals = featuresByType["SIGNAL"]?.slice(0, 2).map(s => 
          `${s.description || "Signal peptide"} (${s.location.start.value}-${s.location.end.value})`
        ) || [];

        // Cross-references organized by database
        const crossRefsByDB = entry.uniProtKBCrossReferences?.reduce((acc, ref) => {
          if (!acc[ref.database]) acc[ref.database] = [];
          acc[ref.database].push(ref.id);
          return acc;
        }, {} as Record<string, string[]>) || {};

        // Important databases
        const pdbRefs = crossRefsByDB["PDB"]?.slice(0, 5) || [];
        const ensemblRefs = crossRefsByDB["Ensembl"]?.slice(0, 3) || [];
        const refSeqRefs = crossRefsByDB["RefSeq"]?.slice(0, 3) || [];
        const goRefs = crossRefsByDB["GO"]?.slice(0, 10) || [];
        const interproRefs = crossRefsByDB["InterPro"]?.slice(0, 5) || [];
        const pfamRefs = crossRefsByDB["Pfam"]?.slice(0, 5) || [];
        const reactomeRefs = crossRefsByDB["Reactome"]?.slice(0, 3) || [];
        const keggRefs = crossRefsByDB["KEGG"]?.slice(0, 3) || [];
        const stringRefs = crossRefsByDB["STRING"]?.slice(0, 1) || [];

        // Keywords by category if available
        const keywords = entry.keywords?.map(k => k.name) || [];
        const keywordsByCategory = entry.keywords?.reduce((acc, kw) => {
          if (!acc[kw.category]) acc[kw.category] = [];
          acc[kw.category].push(kw.name);
          return acc;
        }, {} as Record<string, string[]>) || {};

        const details = [
          `=== COMPREHENSIVE PROTEIN ENTRY DETAILS FOR ${accession.toUpperCase()} ===`,
          "",
          "📋 BASIC INFORMATION",
          `Primary Accession: ${entry.primaryAccession}`,
          `UniProt ID: ${entry.uniProtkbId}`,
          `Secondary Accessions: ${entry.secondaryAccessions?.join(", ") || "None"}`,
          "",
          "🧬 PROTEIN IDENTIFICATION",
          `Recommended Name: ${proteinName}`,
          shortNames.length ? `Short Names: ${shortNames.join(", ")}` : "",
          altNames.length ? `Alternative Names: ${altNames.slice(0, 3).join(", ")}${altNames.length > 3 ? ` (+${altNames.length - 3} more)` : ""}` : "",
          ecNumbers.length ? `EC Numbers: ${ecNumbers.join(", ")}` : "",
          "",
          "🧪 GENE INFORMATION",
          `Gene Names: ${geneNames.length ? geneNames.join(", ") : "No gene names"}`,
          synonyms.length ? `Gene Synonyms: ${synonyms.slice(0, 5).join(", ")}${synonyms.length > 5 ? ` (+${synonyms.length - 5} more)` : ""}` : "",
          orderedLoci.length ? `Ordered Locus Names: ${orderedLoci.slice(0, 3).join(", ")}` : "",
          orfNames.length ? `ORF Names: ${orfNames.slice(0, 3).join(", ")}` : "",
          "",
          "🔬 ORGANISM & TAXONOMY",
          `Organism: ${organism}${commonName ? ` (${commonName})` : ""}`,
          `Taxonomy ID: ${taxonomyId}`,
          `Lineage: ${lineage}`,
          "",
          "📏 SEQUENCE PROPERTIES",
          `Length: ${sequenceLength} amino acids`,
          `Molecular Weight: ${molecularWeight}`,
          crc64 ? `CRC64 Checksum: ${crc64}` : "",
          md5 ? `MD5 Checksum: ${md5}` : "",
          `Protein Existence: ${entry.proteinExistence?.evidenceLabel || "Unknown"}`,
          `Annotation Score: ${entry.annotationScore || "Unknown"}/5`,
          "",
          "⚡ FUNCTIONAL ANNOTATION",
          `Function: ${functionText.length > 800 ? functionText.substring(0, 800) + "..." : functionText}`,
          "",
          catalyticActivity !== "No catalytic activity data" ? `Catalytic Activity: ${catalyticActivity.length > 400 ? catalyticActivity.substring(0, 400) + "..." : catalyticActivity}` : "",
          cofactors !== "No cofactor information" ? `Cofactors: ${cofactors.length > 300 ? cofactors.substring(0, 300) + "..." : cofactors}` : "",
          "",
          "📍 CELLULAR LOCATION & PATHWAYS",
          `Subcellular Location: ${subcellularLocation.length > 300 ? subcellularLocation.substring(0, 300) + "..." : subcellularLocation}`,
          pathways !== "No pathway information" ? `Pathways: ${pathways.length > 400 ? pathways.substring(0, 400) + "..." : pathways}` : "",
          "",
          diseases !== "No disease associations" ? "🏥 DISEASE ASSOCIATIONS" : "",
          diseases !== "No disease associations" ? `Diseases: ${diseases.length > 400 ? diseases.substring(0, 400) + "..." : diseases}` : "",
          diseases !== "No disease associations" ? "" : "",
          
          "🔧 STRUCTURAL FEATURES",
          domains.length ? `Domains: ${domains.join(", ")}` : "",
          bindingSites.length ? `Binding Sites: ${bindingSites.join(", ")}` : "",
          activeSites.length ? `Active Sites: ${activeSites.join(", ")}` : "",
          signals.length ? `Signal Peptides: ${signals.join(", ")}` : "",
          "",
          "⚙️ POST-TRANSLATIONAL MODIFICATIONS",
          modifications.length ? `Modified Residues: ${modifications.join(", ")}` : "",
          metalSites.length ? `Metal Binding Sites: ${metalSites.join(", ")}` : "",
          ptm !== "No post-translational modifications" ? `PTM Details: ${ptm.length > 300 ? ptm.substring(0, 300) + "..." : ptm}` : "",
          "",
          interactions !== "No interaction data" ? "🤝 INTERACTIONS" : "",
          interactions !== "No interaction data" ? `Protein Interactions: ${interactions.length > 300 ? interactions.substring(0, 300) + "..." : interactions}` : "",
          interactions !== "No interaction data" ? "" : "",
          
          biophysProperties !== "No biophysical data" ? "⚗️ BIOPHYSICAL PROPERTIES" : "",
          biophysProperties !== "No biophysical data" ? `Properties: ${biophysProperties.length > 300 ? biophysProperties.substring(0, 300) + "..." : biophysProperties}` : "",
          biophysProperties !== "No biophysical data" ? "" : "",
          
          "🏷️ KEYWORDS & CLASSIFICATION",
          Object.keys(keywordsByCategory).length ? 
            Object.entries(keywordsByCategory).slice(0, 5).map(([cat, kws]) => 
              `${cat}: ${kws.slice(0, 5).join(", ")}${kws.length > 5 ? ` (+${kws.length - 5} more)` : ""}`
            ).join("\n") :
            `Keywords: ${keywords.slice(0, 12).join(", ")}${keywords.length > 12 ? ` (+${keywords.length - 12} more)` : ""}`,
          "",
          "🔗 DATABASE CROSS-REFERENCES",
          pdbRefs.length ? `PDB Structures: ${pdbRefs.join(", ")}` : "",
          ensemblRefs.length ? `Ensembl: ${ensemblRefs.join(", ")}` : "",
          refSeqRefs.length ? `RefSeq: ${refSeqRefs.join(", ")}` : "",
          stringRefs.length ? `STRING: ${stringRefs.join(", ")}` : "",
          interproRefs.length ? `InterPro: ${interproRefs.join(", ")}` : "",
          pfamRefs.length ? `Pfam: ${pfamRefs.join(", ")}` : "",
          reactomeRefs.length ? `Reactome: ${reactomeRefs.join(", ")}` : "",
          keggRefs.length ? `KEGG: ${keggRefs.join(", ")}` : "",
          goRefs.length ? `GO Terms: ${goRefs.slice(0, 8).join(", ")}${goRefs.length > 8 ? ` (+${goRefs.length - 8} more)` : ""}` : "",
          "",
          "📅 VERSION INFORMATION",
          `Entry Version: ${entry.entryAudit?.entryVersion || "Unknown"}`,
          `First Public: ${entry.entryAudit?.firstPublicDate || "Unknown"}`,
          `Last Annotation Update: ${entry.entryAudit?.lastAnnotationUpdateDate || "Unknown"}`,
          `Last Sequence Update: ${entry.entryAudit?.lastSequenceUpdateDate || "Unknown"}`,
          `Sequence Version: ${entry.entryAudit?.sequenceVersion || "Unknown"}`,
          "",
        ].filter(line => line !== "").join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: details,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching protein entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "get_protein_sequence",
    "Get the protein sequence for a specific UniProt entry in FASTA format",
    getProteinSequenceSchema,
    async ({ accession }) => {
      try {
        // Validate accession format
        if (!validateUniProtAccession(accession)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid UniProt accession format: '${accession}'. Accession should be alphanumeric (e.g., P04637).`,
              },
            ],
          };
        }
        
        // First get basic info for context
        const entry = await getUniProtEntry(accession.toUpperCase());
        
        if (!entry) {
          return {
            content: [
              {
                type: "text",
                text: `No protein entry found for accession: ${accession}`,
              },
            ],
          };
        }
        
        // Get FASTA sequence
        const fastaSequence = await getUniProtSequence(accession.toUpperCase());
        
        if (!fastaSequence) {
          return {
            content: [
              {
                type: "text",
                text: `Unable to fetch sequence for accession: ${accession}`,
              },
            ],
          };
        }
        
        // Extract comprehensive sequence information
        const proteinName = entry.proteinDescription?.recommendedName?.fullName?.value || 
                           entry.proteinDescription?.submissionNames?.[0]?.fullName?.value || 
                           "Unknown protein";
        
        const organism = entry.organism?.scientificName || "Unknown organism";
        const commonName = entry.organism?.commonName;
        const taxonomyId = entry.organism?.taxonId;
        
        // Sequence properties
        const sequenceLength = entry.sequence?.length || "Unknown";
        const molecularWeight = entry.sequence?.molWeight ? `${(entry.sequence.molWeight / 1000).toFixed(2)} kDa` : "Unknown";
        const crc64 = entry.sequence?.crc64;
        const md5 = entry.sequence?.md5;
        
        // Gene information
        const geneNames: string[] = [];
        if (entry.genes && entry.genes.length > 0) {
          entry.genes.forEach(gene => {
            if (gene.geneName?.value) geneNames.push(gene.geneName.value);
          });
        }
        
        // Functional domains in sequence
        const domains = entry.features?.filter(f => f.type === "DOMAIN").slice(0, 5).map(d => 
          `${d.description || "Domain"} (${d.location.start.value}-${d.location.end.value})`
        ) || [];
        
        // Important sequence features
        const signals = entry.features?.filter(f => f.type === "SIGNAL").slice(0, 2).map(s => 
          `Signal peptide (${s.location.start.value}-${s.location.end.value})`
        ) || [];
        
        const transmembrane = entry.features?.filter(f => f.type === "TRANSMEM").slice(0, 3).map(t => 
          `Transmembrane (${t.location.start.value}-${t.location.end.value})`
        ) || [];
        
        // Cross-references relevant to sequence
        const pdbRefs = entry.uniProtKBCrossReferences?.filter(ref => ref.database === "PDB").slice(0, 3).map(ref => ref.id) || [];
        const ensemblRefs = entry.uniProtKBCrossReferences?.filter(ref => ref.database === "Ensembl").slice(0, 2).map(ref => ref.id) || [];
        
        const result = [
          `=== PROTEIN SEQUENCE INFORMATION FOR ${accession.toUpperCase()} ===`,
          "",
          "📋 PROTEIN IDENTIFICATION",
          `Primary Accession: ${entry.primaryAccession}`,
          `UniProt ID: ${entry.uniProtkbId}`,
          `Protein Name: ${proteinName}`,
          `Gene Names: ${geneNames.length ? geneNames.join(", ") : "No gene names"}`,
          "",
          "🔬 ORGANISM",
          `Scientific Name: ${organism}${commonName ? ` (${commonName})` : ""}`,
          `Taxonomy ID: ${taxonomyId || "Unknown"}`,
          "",
          "📏 SEQUENCE PROPERTIES",
          `Length: ${sequenceLength} amino acids`,
          `Molecular Weight: ${molecularWeight}`,
          `Protein Existence: ${entry.proteinExistence?.evidenceLabel || "Unknown"}`,
          crc64 ? `CRC64 Checksum: ${crc64}` : "",
          md5 ? `MD5 Checksum: ${md5}` : "",
          "",
          "🔧 SEQUENCE FEATURES",
          domains.length ? `Functional Domains: ${domains.join(", ")}` : "",
          signals.length ? `Signal Peptides: ${signals.join(", ")}` : "",
          transmembrane.length ? `Transmembrane Regions: ${transmembrane.join(", ")}` : "",
          "",
          "🔗 STRUCTURAL REFERENCES",
          pdbRefs.length ? `PDB Structures Available: ${pdbRefs.join(", ")}` : "No PDB structures available",
          ensemblRefs.length ? `Ensembl Gene IDs: ${ensemblRefs.join(", ")}` : "",
          "",
          "🧬 FASTA SEQUENCE",
          fastaSequence,
          "",
          "📊 SEQUENCE STATISTICS",
          `Entry Version: ${entry.entryAudit?.entryVersion || "Unknown"}`,
          `Last Sequence Update: ${entry.entryAudit?.lastSequenceUpdateDate || "Unknown"}`,
          `Sequence Version: ${entry.entryAudit?.sequenceVersion || "Unknown"}`,
        ].filter(line => line !== "").join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching protein sequence: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );
}
