/**
 * Protein sequence analysis MCP tools
 * Chapter 6: Protein sequence analysis
 */

import { 
  predictProteinProperties,
  predictTransmembraneRegions,
  scanProteinMotifs
} from "../utils/protein-analysis.js";
import { 
  predictProteinPropertiesSchema,
  predictTransmembraneRegionsSchema,
  scanProteinMotifsSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerProteinSequenceTools(server: McpServer) {
  
  // Tool 1: Predict Protein Properties
  server.tool(
    "predict_protein_properties",
    "Predict molecular weight, isoelectric point, amino acid composition, and other physicochemical properties using ProtParam algorithms",
    predictProteinPropertiesSchema,
    async ({ sequence, include_composition = true }) => {
      try {
        const result = predictProteinProperties(sequence);
        
        const output = [
          `=== PROTEIN PROPERTIES ANALYSIS ===`,
          "",
          "🧬 BASIC PROPERTIES",
          `Sequence Length: ${result.sequence_length} amino acids`,
          `Molecular Weight: ${result.molecular_weight.toLocaleString()} Da`,
          `Isoelectric Point (pI): ${result.isoelectric_point}`,
          `Charge at pH 7.0: ${result.charge_at_ph7 > 0 ? '+' : ''}${result.charge_at_ph7}`,
          "",
          "📊 PHYSICOCHEMICAL PROPERTIES",
          `Extinction Coefficient (280 nm): ${result.extinction_coefficient.at_280nm.toLocaleString()} M⁻¹cm⁻¹`,
          `Extinction Coefficient (reduced): ${result.extinction_coefficient.at_280nm_reduced.toLocaleString()} M⁻¹cm⁻¹`,
          `Instability Index: ${result.instability_index} ${result.instability_index > 40 ? '(unstable)' : '(stable)'}`,
          `Aliphatic Index: ${result.aliphatic_index}`,
          `Hydropathy (GRAVY): ${result.hydropathy} ${result.hydropathy > 0 ? '(hydrophobic)' : '(hydrophilic)'}`,
          ""
        ];

        if (include_composition) {
          output.push("🔬 AMINO ACID COMPOSITION");
          
          // Group amino acids by properties
          const hydrophobic = ['A', 'V', 'I', 'L', 'M', 'F', 'W', 'Y'];
          const polar = ['S', 'T', 'N', 'Q'];
          const charged = ['R', 'K', 'D', 'E', 'H'];
          const special = ['C', 'G', 'P'];
          
          const groups = [
            { name: 'Hydrophobic', aas: hydrophobic },
            { name: 'Polar', aas: polar },
            { name: 'Charged', aas: charged },
            { name: 'Special', aas: special }
          ];
          
          for (const group of groups) {
            const groupTotal = group.aas.reduce((sum, aa) => 
              sum + result.amino_acid_composition[aa].percentage, 0);
            output.push(`\n${group.name} (${groupTotal.toFixed(1)}%):`);
            
            for (const aa of group.aas) {
              const comp = result.amino_acid_composition[aa];
              if (comp.count > 0) {
                output.push(`  ${aa}: ${comp.count} (${comp.percentage}%)`);
              }
            }
          }
          output.push("");
        }

        // Protein characteristics
        output.push("🎯 PROTEIN CHARACTERISTICS");
        
        if (result.molecular_weight < 10000) {
          output.push("• Small protein/peptide (<10 kDa)");
        } else if (result.molecular_weight > 100000) {
          output.push("• Large protein (>100 kDa)");
        } else {
          output.push("• Medium-sized protein (10-100 kDa)");
        }
        
        if (result.isoelectric_point > 7.5) {
          output.push("• Basic protein (pI > 7.5)");
        } else if (result.isoelectric_point < 6.5) {
          output.push("• Acidic protein (pI < 6.5)");
        } else {
          output.push("• Neutral protein (pI 6.5-7.5)");
        }
        
        if (result.hydropathy > 0) {
          output.push("• Hydrophobic protein (GRAVY > 0)");
        } else if (result.hydropathy < -0.4) {
          output.push("• Very hydrophilic protein (GRAVY < -0.4)");
        } else {
          output.push("• Hydrophilic protein (GRAVY < 0)");
        }
        
        if (result.instability_index > 40) {
          output.push("• Potentially unstable in test tube");
        } else {
          output.push("• Stable in test tube");
        }

        return {
          content: [
            {
              type: "text",
              text: output.join('\n'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error predicting protein properties: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: Predict Transmembrane Regions
  server.tool(
    "predict_transmembrane_regions",
    "Identify transmembrane helices using hydropathy analysis and TMHMM-like algorithms",
    predictTransmembraneRegionsSchema,
    async ({ sequence, window_size = 19, threshold = 1.6 }) => {
      try {
        const result = predictTransmembraneRegions(sequence);
        
        const output = [
          `=== TRANSMEMBRANE REGION PREDICTION ===`,
          "",
          "📊 ANALYSIS SUMMARY",
          `Sequence Length: ${result.sequence_length} amino acids`,
          `Transmembrane Regions: ${result.transmembrane_regions.length}`,
          `Membrane Probability: ${(result.membrane_probability * 100).toFixed(1)}%`,
          `Predicted Topology: ${result.topology}`,
          ""
        ];

        // Signal peptide analysis
        output.push("🔍 SIGNAL PEPTIDE ANALYSIS");
        if (result.signal_peptide.present) {
          output.push(`Signal Peptide: DETECTED`);
          output.push(`Cleavage Site: Position ${result.signal_peptide.position}`);
          output.push(`Signal Sequence: ${result.signal_peptide.sequence}`);
        } else {
          output.push("Signal Peptide: NOT DETECTED");
        }
        output.push("");

        // Transmembrane regions
        if (result.transmembrane_regions.length > 0) {
          output.push("🧬 TRANSMEMBRANE HELICES");
          
          result.transmembrane_regions.forEach((tm, index) => {
            output.push(`\nHelix ${index + 1}:`);
            output.push(`  Position: ${tm.start} - ${tm.end}`);
            output.push(`  Length: ${tm.length} amino acids`);
            output.push(`  Hydropathy Score: ${tm.hydropathy_score}`);
            output.push(`  Confidence: ${tm.confidence.toUpperCase()}`);
            output.push(`  Sequence: ${tm.sequence}`);
          });
          
          output.push("");
          
          // Topology diagram
          output.push("📐 MEMBRANE TOPOLOGY");
          let topology = result.signal_peptide.present ? "Signal---" : "N-term---";
          
          for (let i = 0; i < result.transmembrane_regions.length; i++) {
            topology += `[TM${i + 1}]---`;
            if (i < result.transmembrane_regions.length - 1) {
              topology += i % 2 === 0 ? "Extracellular---" : "Cytoplasmic---";
            }
          }
          
          topology += result.transmembrane_regions.length % 2 === 1 ? "Extracellular" : "Cytoplasmic";
          output.push(topology);
          
        } else {
          output.push("🧬 TRANSMEMBRANE HELICES");
          output.push("No transmembrane regions detected");
          output.push("");
          
          output.push("📐 PREDICTED LOCALIZATION");
          if (result.signal_peptide.present) {
            output.push("Likely secreted or membrane-associated protein");
          } else if (result.membrane_probability > 0.3) {
            output.push("May have weak membrane association");
          } else {
            output.push("Likely cytoplasmic or nuclear protein");
          }
        }

        // Additional insights
        output.push("");
        output.push("💡 FUNCTIONAL INSIGHTS");
        
        if (result.transmembrane_regions.length >= 7) {
          output.push("• G-protein coupled receptor (GPCR) candidate");
        } else if (result.transmembrane_regions.length >= 2) {
          output.push("• Multi-pass membrane protein");
          output.push("• Possible transporter or channel");
        } else if (result.transmembrane_regions.length === 1) {
          output.push("• Single-pass membrane protein");
          output.push("• Possible receptor or membrane anchor");
        }
        
        if (result.signal_peptide.present && result.transmembrane_regions.length === 0) {
          output.push("• Likely secreted protein");
        }

        return {
          content: [
            {
              type: "text",
              text: output.join('\n'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error predicting transmembrane regions: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 3: Scan Protein Motifs
  server.tool(
    "scan_protein_motifs",
    "Detect functional motifs and domains using PROSITE patterns and other databases",
    scanProteinMotifsSchema,
    async ({ sequence, motif_database = 'prosite', min_score = 0.5 }) => {
      try {
        const result = scanProteinMotifs(sequence);
        
        const output = [
          `=== PROTEIN MOTIF ANALYSIS ===`,
          "",
          "📊 MOTIF SUMMARY",
          `Sequence Length: ${result.sequence_length} amino acids`,
          `Total Motifs Found: ${result.total_motifs}`,
          `Unique Motif Types: ${result.motifs_found.length}`,
          ""
        ];

        // Functional domain summary
        output.push("🎯 FUNCTIONAL DOMAINS");
        output.push(`Phosphorylation Sites: ${result.functional_domains.phosphorylation}`);
        output.push(`Glycosylation Sites: ${result.functional_domains.glycosylation}`);
        output.push(`Membrane Targeting: ${result.functional_domains.membrane_targeting}`);
        output.push(`Structural Motifs: ${result.functional_domains.structural}`);
        output.push("");

        // Detailed motif analysis
        if (result.motifs_found.length > 0) {
          output.push("🔍 DETECTED MOTIFS");
          
          // Group motifs by function
          const phosphorylationMotifs = result.motifs_found.filter(m => 
            m.name.includes('KINASE') || m.name.includes('PKA'));
          const glycosylationMotifs = result.motifs_found.filter(m => 
            m.name.includes('GLYCOSYLATION'));
          const targetingMotifs = result.motifs_found.filter(m => 
            m.name.includes('MYRISTYLATION') || m.name.includes('PRENYLATION'));
          const structuralMotifs = result.motifs_found.filter(m => 
            m.name.includes('ZIPPER'));
          
          const motifGroups = [
            { title: "Phosphorylation Sites", motifs: phosphorylationMotifs },
            { title: "Glycosylation Sites", motifs: glycosylationMotifs },
            { title: "Membrane Targeting", motifs: targetingMotifs },
            { title: "Structural Motifs", motifs: structuralMotifs }
          ];
          
          for (const group of motifGroups) {
            if (group.motifs.length > 0) {
              output.push(`\n${group.title}:`);
              
              for (const motif of group.motifs) {
                output.push(`\n${motif.description} (${motif.accession})`);
                output.push(`Pattern: ${motif.pattern}`);
                output.push(`Matches (${motif.matches.length}):`);
                
                motif.matches.forEach((match, index) => {
                  output.push(`  ${index + 1}. Position ${match.position}: ${match.sequence}`);
                });
              }
            }
          }
          
          // Other motifs
          const otherMotifs = result.motifs_found.filter(m => 
            ![...phosphorylationMotifs, ...glycosylationMotifs, ...targetingMotifs, ...structuralMotifs]
              .includes(m));
          
          if (otherMotifs.length > 0) {
            output.push("\nOther Motifs:");
            for (const motif of otherMotifs) {
              output.push(`\n${motif.description} (${motif.accession})`);
              output.push(`Matches: ${motif.matches.length}`);
              motif.matches.slice(0, 3).forEach((match, index) => {
                output.push(`  ${index + 1}. Position ${match.position}: ${match.sequence}`);
              });
              if (motif.matches.length > 3) {
                output.push(`  ... and ${motif.matches.length - 3} more`);
              }
            }
          }
          
        } else {
          output.push("🔍 DETECTED MOTIFS");
          output.push("No significant motifs detected with current parameters");
        }

        // Functional predictions
        output.push("");
        output.push("💡 FUNCTIONAL PREDICTIONS");
        
        if (result.functional_domains.phosphorylation > 5) {
          output.push("• Highly regulated protein (many phosphorylation sites)");
        } else if (result.functional_domains.phosphorylation > 0) {
          output.push("• Regulated by phosphorylation");
        }
        
        if (result.functional_domains.glycosylation > 0) {
          output.push("• Glycosylated protein (likely secreted or membrane-bound)");
        }
        
        if (result.functional_domains.membrane_targeting > 0) {
          output.push("• Membrane-targeted protein");
        }
        
        if (result.functional_domains.structural > 0) {
          output.push("• Contains structural motifs (protein-protein interactions)");
        }
        
        if (result.total_motifs === 0) {
          output.push("• Simple protein with few regulatory elements");
          output.push("• May be primarily structural or enzymatic");
        }

        return {
          content: [
            {
              type: "text",
              text: output.join('\n'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error scanning protein motifs: ${error}`,
            },
          ],
        };
      }
    }
  );
}
