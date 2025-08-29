/**
 * Nucleotide sequence analysis MCP tools
 */

import { 
  getNucleotideSequence,
  compareAnnotations,
  findIntronExons,
  alignPromoters
} from "../utils/nucleotide.js";
import { 
  getNucleotideSequenceSchema,
  compareAnnotationsSchema,
  findIntronExonsSchema,
  alignPromotersSchema,
  validateGenBankAccession,
  validateEnsemblId
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerNucleotideTools(server: McpServer) {
  server.tool(
    "get_nucleotide_sequence",
    "Retrieve nucleotide sequences from GenBank, RefSeq, or Ensembl databases",
    getNucleotideSequenceSchema,
    async ({ accession, database = 'genbank', format = 'fasta' }) => {
      try {
        // Validate accession format
        if (database === 'ensembl' && !validateEnsemblId(accession)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid Ensembl ID format: '${accession}'. Expected format: ENSG00000000000 or similar.`,
              },
            ],
          };
        } else if (database !== 'ensembl' && !validateGenBankAccession(accession)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid GenBank/RefSeq accession format: '${accession}'. Expected format: NM_000000 or NC_000000.`,
              },
            ],
          };
        }
        
        // Fetch sequence data
        const sequenceData = await getNucleotideSequence(accession, database, format);
        
        if (!sequenceData) {
          return {
            content: [
              {
                type: "text",
                text: `No sequence found for accession: ${accession} in ${database}`,
              },
            ],
          };
        }
        
        // Format output based on format type
        if (format === 'fasta' || typeof sequenceData === 'string') {
          return {
            content: [
              {
                type: "text",
                text: `=== NUCLEOTIDE SEQUENCE: ${accession.toUpperCase()} ===\n\nDatabase: ${database.toUpperCase()}\nFormat: ${format.toUpperCase()}\n\n${sequenceData}`,
              },
            ],
          };
        }
        
        // Handle JSON format
        if (typeof sequenceData === 'object' && 'sequences' in sequenceData) {
          const seq = sequenceData.sequences[0];
          const result = [
            `=== NUCLEOTIDE SEQUENCE DETAILS: ${accession.toUpperCase()} ===`,
            "",
            "📋 SEQUENCE INFORMATION",
            `Accession: ${seq.accession}`,
            `Version: ${seq.version}`,
            `Title: ${seq.title}`,
            `Organism: ${seq.organism}`,
            `Length: ${seq.length.toLocaleString()} bp`,
            `Molecule Type: ${seq.moleculeType}`,
            `Topology: ${seq.topology}`,
            "",
            "📅 DATES",
            `Created: ${seq.createDate || "Unknown"}`,
            `Updated: ${seq.updateDate || "Unknown"}`,
            "",
            "🧬 SEQUENCE FEATURES",
            seq.features && seq.features.length > 0 ? 
              seq.features.slice(0, 10).map(f => 
                `- ${f.type}: ${f.location} ${f.qualifiers?.gene ? `(${f.qualifiers.gene[0]})` : ''}`
              ).join('\n') + 
              (seq.features.length > 10 ? `\n... and ${seq.features.length - 10} more features` : '') :
              "No features annotated",
            "",
            "🧬 SEQUENCE",
            seq.sequence.length > 1000 ? 
              `${seq.sequence.substring(0, 1000)}...\n\n[Sequence truncated - showing first 1000 bp of ${seq.sequence.length} total]` :
              seq.sequence,
            "",
          ].filter(line => line !== "").join("\n");
          
          return {
            content: [
              {
                type: "text",
                text: result,
              },
            ],
          };
        }
        
        // Handle Ensembl format
        if (typeof sequenceData === 'object' && 'id' in sequenceData) {
          const ensemblSeq = sequenceData;
          const result = [
            `=== ENSEMBL SEQUENCE: ${accession.toUpperCase()} ===`,
            "",
            "📋 SEQUENCE INFORMATION",
            `ID: ${ensemblSeq.id}`,
            `Description: ${ensemblSeq.desc}`,
            `Length: ${ensemblSeq.length.toLocaleString()} bp`,
            `Assembly: ${ensemblSeq.assembly}`,
            `Coordinate System: ${ensemblSeq.coord_system}`,
            `Coordinates: ${ensemblSeq.start}-${ensemblSeq.end} (strand ${ensemblSeq.strand})`,
            "",
            "🧬 SEQUENCE",
            ensemblSeq.seq.length > 1000 ? 
              `${ensemblSeq.seq.substring(0, 1000)}...\n\n[Sequence truncated - showing first 1000 bp of ${ensemblSeq.seq.length} total]` :
              ensemblSeq.seq,
            "",
          ].join("\n");
          
          return {
            content: [
              {
                type: "text",
                text: result,
              },
            ],
          };
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully retrieved sequence for ${accession}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error retrieving nucleotide sequence: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "compare_annotations",
    "Compare genomic annotations between prokaryotic and eukaryotic sequences",
    compareAnnotationsSchema,
    async ({ seq1_id, seq2_id, organism_type = 'auto', feature_types }) => {
      try {
        // Validate accession formats
        if (!validateGenBankAccession(seq1_id)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid GenBank accession format for seq1_id: '${seq1_id}'. Expected format: NM_000000 or NC_000000.`,
              },
            ],
          };
        }
        
        if (!validateGenBankAccession(seq2_id)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid GenBank accession format for seq2_id: '${seq2_id}'. Expected format: NM_000000 or NC_000000.`,
              },
            ],
          };
        }
        
        // Perform annotation comparison
        const comparison = await compareAnnotations(seq1_id, seq2_id, organism_type, feature_types);
        
        if (!comparison) {
          return {
            content: [
              {
                type: "text",
                text: `Unable to compare annotations for sequences ${seq1_id} and ${seq2_id}. Please check that both sequences exist and have annotation data.`,
              },
            ],
          };
        }
        
        // Format comparison results
        const result = [
          `=== ANNOTATION COMPARISON: ${seq1_id.toUpperCase()} vs ${seq2_id.toUpperCase()} ===`,
          "",
          "📊 SEQUENCE INFORMATION",
          `Sequence 1: ${comparison.sequence1.id} (${comparison.sequence1.organism})`,
          `  - Type: ${comparison.sequence1.type}`,
          `  - Features: ${comparison.sequence1.features.length}`,
          "",
          `Sequence 2: ${comparison.sequence2.id} (${comparison.sequence2.organism})`,
          `  - Type: ${comparison.sequence2.type}`,
          `  - Features: ${comparison.sequence2.features.length}`,
          "",
          "🔍 COMPARISON RESULTS",
          `Common Features: ${comparison.comparison.commonFeatures.length}`,
          `Unique to Sequence 1: ${comparison.comparison.uniqueToSeq1.length}`,
          `Unique to Sequence 2: ${comparison.comparison.uniqueToSeq2.length}`,
          "",
          "✅ SIMILARITIES",
          comparison.comparison.similarities.length > 0 ?
            comparison.comparison.similarities.map(s => `- ${s}`).join('\n') :
            "No specific similarities identified",
          "",
          "❗ DIFFERENCES",
          comparison.comparison.differences.length > 0 ?
            comparison.comparison.differences.map(d => `- ${d}`).join('\n') :
            "No specific differences identified",
          "",
          "🧬 COMMON FEATURES",
          comparison.comparison.commonFeatures.length > 0 ?
            comparison.comparison.commonFeatures.slice(0, 10).map(f => 
              `- ${f.type}: ${f.start}-${f.end} ${f.gene ? `(${f.gene})` : ''} ${f.product ? `[${f.product}]` : ''}`
            ).join('\n') + 
            (comparison.comparison.commonFeatures.length > 10 ? 
              `\n... and ${comparison.comparison.commonFeatures.length - 10} more common features` : '') :
            "No common features found",
          "",
          "🔸 UNIQUE TO SEQUENCE 1",
          comparison.comparison.uniqueToSeq1.length > 0 ?
            comparison.comparison.uniqueToSeq1.slice(0, 8).map(f => 
              `- ${f.type}: ${f.start}-${f.end} ${f.gene ? `(${f.gene})` : ''} ${f.product ? `[${f.product}]` : ''}`
            ).join('\n') + 
            (comparison.comparison.uniqueToSeq1.length > 8 ? 
              `\n... and ${comparison.comparison.uniqueToSeq1.length - 8} more unique features` : '') :
            "No unique features to sequence 1",
          "",
          "🔹 UNIQUE TO SEQUENCE 2",
          comparison.comparison.uniqueToSeq2.length > 0 ?
            comparison.comparison.uniqueToSeq2.slice(0, 8).map(f => 
              `- ${f.type}: ${f.start}-${f.end} ${f.gene ? `(${f.gene})` : ''} ${f.product ? `[${f.product}]` : ''}`
            ).join('\n') + 
            (comparison.comparison.uniqueToSeq2.length > 8 ? 
              `\n... and ${comparison.comparison.uniqueToSeq2.length - 8} more unique features` : '') :
            "No unique features to sequence 2",
          "",
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
              text: `Error comparing annotations: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "find_intron_exons",
    "Detect intron-exon boundaries in gene sequences with splice site analysis",
    findIntronExonsSchema,
    async ({ sequence_id, organism, gene_name, splice_site_analysis = true }) => {
      try {
        // Validate accession format
        if (!validateGenBankAccession(sequence_id)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid GenBank accession format: '${sequence_id}'. Expected format: NM_000000 or NC_000000.`,
              },
            ],
          };
        }
        
        // Analyze gene structure
        const geneStructure = await findIntronExons(sequence_id, organism, gene_name, splice_site_analysis);
        
        if (!geneStructure) {
          return {
            content: [
              {
                type: "text",
                text: `Unable to analyze gene structure for sequence ${sequence_id}. Please ensure the sequence exists and contains gene annotation data.`,
              },
            ],
          };
        }
        
        // Format results
        const result = [
          `=== INTRON-EXON ANALYSIS: ${sequence_id.toUpperCase()} ===`,
          "",
          "📋 GENE INFORMATION",
          `Sequence ID: ${geneStructure.sequenceId}`,
          `Organism: ${geneStructure.organism}`,
          gene_name ? `Gene Name: ${gene_name}` : "",
          "",
          "📊 GENE STRUCTURE SUMMARY",
          `Total Exons: ${geneStructure.geneStructure.totalExons}`,
          `Total Introns: ${geneStructure.geneStructure.totalIntrons}`,
          `Coding Sequence Length: ${geneStructure.geneStructure.codingSequence.length} bp`,
          "",
          "🧬 EXON DETAILS",
          geneStructure.geneStructure.exons.length > 0 ?
            geneStructure.geneStructure.exons.map(exon => 
              `Exon ${exon.number}: ${exon.start}-${exon.end} (${exon.length} bp)`
            ).join('\n') :
            "No exons detected",
          "",
          "🔗 INTRON DETAILS",
          geneStructure.geneStructure.introns.length > 0 ?
            geneStructure.geneStructure.introns.map(intron => 
              `Intron ${intron.number}: ${intron.start}-${intron.end} (${intron.length} bp)` +
              (splice_site_analysis ? ` | Splice sites: ${intron.spliceSites.donor}-....-${intron.spliceSites.acceptor}` : '')
            ).join('\n') :
            "No introns detected",
          "",
          splice_site_analysis && geneStructure.geneStructure.introns.length > 0 ? "🔬 SPLICE SITE ANALYSIS" : "",
          splice_site_analysis && geneStructure.geneStructure.introns.length > 0 ?
            geneStructure.geneStructure.introns.map(intron => {
              const isCanonical = intron.spliceSites.donor === 'GT' && intron.spliceSites.acceptor === 'AG';
              return `Intron ${intron.number}: ${intron.spliceSites.donor}...${intron.spliceSites.acceptor} ${isCanonical ? '(Canonical)' : '(Non-canonical)'}`;
            }).join('\n') : "",
          splice_site_analysis && geneStructure.geneStructure.introns.length > 0 ? "" : "",
          "🧬 CODING SEQUENCE",
          geneStructure.geneStructure.codingSequence.length > 300 ?
            `${geneStructure.geneStructure.codingSequence.substring(0, 300)}...\n\n[Coding sequence truncated - showing first 300 bp of ${geneStructure.geneStructure.codingSequence.length} total]` :
            geneStructure.geneStructure.codingSequence,
          "",
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
              text: `Error analyzing intron-exon structure: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "align_promoters",
    "Align promoter regions from multiple genes to discover conserved regulatory elements",
    alignPromotersSchema,
    async ({ sequence_list, organism, upstream_length = 2000, motif_search = true }) => {
      try {
        // Validate sequence list
        if (sequence_list.length < 2) {
          return {
            content: [
              {
                type: "text",
                text: "At least 2 sequences are required for promoter alignment analysis.",
              },
            ],
          };
        }
        
        if (sequence_list.length > 10) {
          return {
            content: [
              {
                type: "text",
                text: "Maximum of 10 sequences allowed for promoter alignment analysis.",
              },
            ],
          };
        }
        
        // Validate accession formats
        for (const seqId of sequence_list) {
          if (!validateGenBankAccession(seqId)) {
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid GenBank accession format: '${seqId}'. Expected format: NM_000000 or NC_000000.`,
                },
              ],
            };
          }
        }
        
        // Perform promoter alignment
        const alignment = await alignPromoters(sequence_list, organism, upstream_length, motif_search);
        
        if (!alignment) {
          return {
            content: [
              {
                type: "text",
                text: `Unable to align promoter regions. Please ensure at least 2 sequences have valid gene annotations.`,
              },
            ],
          };
        }
        
        // Format alignment results
        const result = [
          `=== PROMOTER ALIGNMENT ANALYSIS ===`,
          "",
          "📋 ANALYSIS PARAMETERS",
          `Sequences Analyzed: ${alignment.sequences.length}`,
          `Upstream Length: ${upstream_length} bp`,
          `Organism Context: ${organism || "Not specified"}`,
          `Motif Search: ${motif_search ? "Enabled" : "Disabled"}`,
          "",
          "📊 SEQUENCE INFORMATION",
          alignment.sequences.map((seq, index) => 
            `${index + 1}. ${seq.id} (${seq.organism}) - TSS: ${seq.tssPosition}, Length: ${seq.promoterRegion.length} bp`
          ).join('\n'),
          "",
          "🧬 CONSENSUS SEQUENCE",
          `Length: ${alignment.alignment.consensusSequence.length} bp`,
          alignment.alignment.consensusSequence.length > 200 ?
            `${alignment.alignment.consensusSequence.substring(0, 200)}...\n[Consensus truncated - showing first 200 bp of ${alignment.alignment.consensusSequence.length} total]` :
            alignment.alignment.consensusSequence,
          "",
          motif_search && alignment.alignment.conservedElements.length > 0 ? "🔍 CONSERVED REGULATORY ELEMENTS" : "",
          motif_search && alignment.alignment.conservedElements.length > 0 ?
            alignment.alignment.conservedElements.map((element, index) => 
              `${index + 1}. ${element.type} motif at position ${element.position}: ${element.sequence} (${(element.conservation * 100).toFixed(1)}% conserved)`
            ).join('\n') :
            motif_search ? "No highly conserved motifs detected (>70% conservation)" : "",
          motif_search && alignment.alignment.conservedElements.length > 0 ? "" : "",
          "📋 ALIGNMENT MATRIX",
          "Sequences aligned (showing first 100 bp):",
          alignment.alignment.alignmentMatrix.map((seq, index) => 
            `${alignment.sequences[index].id}: ${seq.substring(0, 100)}${seq.length > 100 ? '...' : ''}`
          ).join('\n'),
          "",
          "📈 CONSERVATION ANALYSIS",
          alignment.alignment.conservedElements.length > 0 ?
            `Found ${alignment.alignment.conservedElements.length} conserved elements with >70% conservation` :
            "No highly conserved elements detected in the analyzed region",
          "",
          motif_search ? "💡 FUNCTIONAL INSIGHTS" : "",
          motif_search ? alignment.alignment.conservedElements.length > 0 ?
            "The identified conserved elements may represent important regulatory sequences for transcriptional control. " +
            "TATA boxes typically occur 25-30 bp upstream of TSS, while CAAT boxes are found 70-80 bp upstream." :
            "Consider extending the upstream analysis region or including more related sequences to identify conserved regulatory elements." : "",
          "",
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
              text: `Error aligning promoter regions: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );
}
