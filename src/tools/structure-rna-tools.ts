/**
 * Protein structure and RNA analysis MCP tools
 * Chapter 11-12: Structure & RNA analysis
 */

import { 
  getProteinStructure,
  analyzeSecondaryStructure,
  predictRNASecondaryStructure,
  scanRNAMotifs
} from "../utils/structure-rna.js";
import { 
  getProteinStructureSchema,
  analyzeSecondaryStructureSchema,
  predictRNASecondaryStructureSchema,
  scanRNAMotifsSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerStructureRNATools(server: McpServer) {
  
  // Tool 1: Get Protein Structure
  server.tool(
    "get_protein_structure",
    "Retrieve 3D protein structure data from PDB database with comprehensive metadata",
    getProteinStructureSchema,
    async ({ pdb_id }) => {
      try {
        const result = await getProteinStructure(pdb_id);
        
        const output = [
          `=== PROTEIN STRUCTURE: ${result.pdb_id} ===`,
          "",
          "📋 STRUCTURE INFORMATION",
          `PDB ID: ${result.pdb_id}`,
          `Title: ${result.title}`,
          `Classification: ${result.classification}`,
          `Organism: ${result.organism}`,
          `Resolution: ${result.resolution.toFixed(2)} Å`,
          `Method: ${result.method}`,
          `Release Date: ${result.release_date}`,
          "",
          "👥 AUTHORS & PUBLICATION",
          `Authors: ${result.authors.join(', ')}`,
          `Journal: ${result.journal}`,
          result.doi ? `DOI: ${result.doi}` : "",
          "",
          "🏷️ KEYWORDS",
          result.keywords.join(', '),
          ""
        ];

        // Chain information
        output.push("🧬 CHAIN INFORMATION");
        result.chains.forEach((chain, index) => {
          output.push(`\nChain ${chain.chain_id}:`);
          output.push(`  Molecule Type: ${chain.molecule_type}`);
          output.push(`  Length: ${chain.length} residues`);
          output.push(`  Organism: ${chain.organism}`);
          
          if (chain.sequence.length <= 100) {
            output.push(`  Sequence: ${chain.sequence}`);
          } else {
            output.push(`  Sequence: ${chain.sequence.substring(0, 50)}...${chain.sequence.substring(chain.sequence.length - 50)}`);
            output.push(`  (Showing first 50 and last 50 residues of ${chain.length} total)`);
          }
          
          // Secondary structure summary
          const ssElements = chain.secondary_structures;
          const helices = ssElements.filter(ss => ss.type === 'helix').length;
          const sheets = ssElements.filter(ss => ss.type === 'sheet').length;
          const turns = ssElements.filter(ss => ss.type === 'turn').length;
          
          output.push(`  Secondary Structure: ${helices} helices, ${sheets} sheets, ${turns} turns`);
        });

        // Ligand information
        if (result.ligands.length > 0) {
          output.push("");
          output.push("🧪 BOUND LIGANDS");
          result.ligands.forEach((ligand, index) => {
            output.push(`\n${index + 1}. ${ligand.name} (${ligand.id})`);
            output.push(`   Formula: ${ligand.formula}`);
            output.push(`   Molecular Weight: ${ligand.molecular_weight} Da`);
            output.push(`   Chains: ${ligand.chains.join(', ')}`);
          });
        }

        // Structural quality assessment
        output.push("");
        output.push("🔬 STRUCTURAL QUALITY");
        if (result.resolution <= 2.0) {
          output.push("• High resolution structure (≤2.0 Å) - excellent atomic detail");
        } else if (result.resolution <= 3.0) {
          output.push("• Medium resolution structure (2.0-3.0 Å) - good structural detail");
        } else {
          output.push("• Lower resolution structure (>3.0 Å) - limited atomic detail");
        }
        
        if (result.method === 'X-RAY DIFFRACTION') {
          output.push("• X-ray crystallography - static structure");
        } else if (result.method === 'NMR') {
          output.push("• NMR spectroscopy - solution structure with dynamics");
        } else if (result.method === 'ELECTRON MICROSCOPY') {
          output.push("• Cryo-electron microscopy - large complex structure");
        }

        // Functional predictions
        output.push("");
        output.push("🔮 FUNCTIONAL INSIGHTS");
        if (result.classification.includes('TRANSFERASE')) {
          output.push("• Enzyme with transferase activity");
        }
        if (result.classification.includes('DNA')) {
          output.push("• DNA-binding protein");
        }
        if (result.ligands.some(l => l.id === 'ATP')) {
          output.push("• ATP-binding protein - likely kinase or ATPase");
        }
        if (result.ligands.some(l => l.id === 'MG')) {
          output.push("• Magnesium-dependent protein");
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
              text: `❌ Error retrieving protein structure: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: Analyze Secondary Structure
  server.tool(
    "analyze_secondary_structure",
    "Analyze protein secondary structure from PDB data or predict from sequence",
    analyzeSecondaryStructureSchema,
    async ({ sequence, pdb_id }) => {
      try {
        let pdbData;
        if (pdb_id) {
          pdbData = await getProteinStructure(pdb_id);
        }
        
        const result = analyzeSecondaryStructure(sequence, pdbData);
        
        const output = [
          `=== SECONDARY STRUCTURE ANALYSIS ===`,
          "",
          "🔧 ANALYSIS PARAMETERS",
          `Method: ${pdbData ? 'Experimental (PDB)' : 'Predicted (Chou-Fasman like)'}`,
          pdb_id ? `PDB ID: ${pdb_id}` : "",
          `Sequence Length: ${result.sequence_length} amino acids`,
          "",
          "📊 SECONDARY STRUCTURE COMPOSITION",
          `α-Helix: ${result.helix_content}% (${Math.round(result.sequence_length * result.helix_content / 100)} residues)`,
          `β-Sheet: ${result.sheet_content}% (${Math.round(result.sequence_length * result.sheet_content / 100)} residues)`,
          `β-Turn: ${result.turn_content}% (${Math.round(result.sequence_length * result.turn_content / 100)} residues)`,
          `Random Coil: ${result.coil_content}% (${Math.round(result.sequence_length * result.coil_content / 100)} residues)`,
          "",
          "🏗️ STRUCTURAL MOTIFS",
          `α-Helices: ${result.structural_motifs.alpha_helices}`,
          `β-Sheets: ${result.structural_motifs.beta_sheets}`,
          `β-Turns: ${result.structural_motifs.beta_turns}`,
          `Loops: ${result.structural_motifs.loops}`,
          ""
        ];

        // Detailed secondary structure elements
        if (result.secondary_structures.length > 0) {
          output.push("🧬 SECONDARY STRUCTURE ELEMENTS");
          
          const helices = result.secondary_structures.filter(ss => ss.type === 'helix');
          const sheets = result.secondary_structures.filter(ss => ss.type === 'sheet');
          const turns = result.secondary_structures.filter(ss => ss.type === 'turn');
          
          if (helices.length > 0) {
            output.push(`\nα-Helices (${helices.length}):`);
            helices.forEach((helix, index) => {
              output.push(`  H${index + 1}: ${helix.start}-${helix.end} (${helix.length} residues)`);
            });
          }
          
          if (sheets.length > 0) {
            output.push(`\nβ-Sheets (${sheets.length}):`);
            sheets.forEach((sheet, index) => {
              output.push(`  E${index + 1}: ${sheet.start}-${sheet.end} (${sheet.length} residues)`);
            });
          }
          
          if (turns.length > 0) {
            output.push(`\nβ-Turns (${turns.length}):`);
            turns.forEach((turn, index) => {
              output.push(`  T${index + 1}: ${turn.start}-${turn.end} (${turn.length} residues)`);
            });
          }
        }

        // Structure classification
        output.push("");
        output.push("📈 STRUCTURAL CLASSIFICATION");
        
        const helixPercent = result.helix_content;
        const sheetPercent = result.sheet_content;
        
        if (helixPercent > 60) {
          output.push("• All-α protein - predominantly helical");
        } else if (sheetPercent > 60) {
          output.push("• All-β protein - predominantly sheet");
        } else if (helixPercent > 30 && sheetPercent > 30) {
          output.push("• α/β protein - mixed secondary structure");
        } else if (helixPercent > 20 || sheetPercent > 20) {
          output.push("• α+β protein - separate α and β regions");
        } else {
          output.push("• Small protein or extended structure");
        }
        
        // Stability predictions
        if (result.helix_content + result.sheet_content > 70) {
          output.push("• High structural order - likely stable fold");
        } else if (result.coil_content > 50) {
          output.push("• High disorder content - may be intrinsically disordered");
        }
        
        // Functional predictions
        output.push("");
        output.push("🔮 FUNCTIONAL PREDICTIONS");
        
        if (result.structural_motifs.alpha_helices >= 3 && result.helix_content > 40) {
          output.push("• Potential DNA-binding domain (helix-turn-helix motif)");
        }
        
        if (result.structural_motifs.beta_sheets >= 4 && result.sheet_content > 30) {
          output.push("• Potential β-barrel or immunoglobulin fold");
        }
        
        if (result.structural_motifs.beta_turns >= 5) {
          output.push("• Highly flexible protein with many turns");
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
              text: `❌ Error analyzing secondary structure: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 3: Predict RNA Secondary Structure
  server.tool(
    "predict_rna_secondary_structure",
    "Predict RNA secondary structure using thermodynamic algorithms",
    predictRNASecondaryStructureSchema,
    async ({ sequence }) => {
      try {
        const result = predictRNASecondaryStructure(sequence);
        
        const output = [
          `=== RNA SECONDARY STRUCTURE PREDICTION ===`,
          "",
          "🔧 PREDICTION PARAMETERS",
          `Algorithm: Dynamic Programming (Nussinov-like)`,
          `Sequence Length: ${result.sequence_length} nucleotides`,
          `Free Energy: ${result.free_energy} kcal/mol`,
          "",
          "🧬 SEQUENCE & STRUCTURE",
          `RNA Sequence: ${result.sequence.length <= 100 ? result.sequence : result.sequence.substring(0, 50) + '...' + result.sequence.substring(result.sequence.length - 50)}`,
          `Structure:    ${result.structure.length <= 100 ? result.structure : result.structure.substring(0, 50) + '...' + result.structure.substring(result.structure.length - 50)}`,
          result.sequence.length > 100 ? `(Showing first 50 and last 50 nucleotides of ${result.sequence_length} total)` : "",
          "",
          "📊 STRUCTURAL STATISTICS",
          `Structure Type: ${result.structure_type}`,
          `Base Pairs: ${result.base_pairs.length}`,
          `Loops: ${result.loops.length}`,
          `Stems: ${result.stems.length}`,
          ""
        ];

        // Base pair analysis
        if (result.base_pairs.length > 0) {
          output.push("🔗 BASE PAIR ANALYSIS");
          
          const wcPairs = result.base_pairs.filter(bp => bp.pair_type === 'watson-crick').length;
          const wobblePairs = result.base_pairs.filter(bp => bp.pair_type === 'wobble').length;
          const mismatchPairs = result.base_pairs.filter(bp => bp.pair_type === 'mismatch').length;
          
          output.push(`Watson-Crick pairs: ${wcPairs} (${(wcPairs/result.base_pairs.length*100).toFixed(1)}%)`);
          output.push(`Wobble pairs (G-U): ${wobblePairs} (${(wobblePairs/result.base_pairs.length*100).toFixed(1)}%)`);
          if (mismatchPairs > 0) {
            output.push(`Mismatched pairs: ${mismatchPairs} (${(mismatchPairs/result.base_pairs.length*100).toFixed(1)}%)`);
          }
          
          // Show first few base pairs
          output.push("\nBase Pairs (first 10):");
          result.base_pairs.slice(0, 10).forEach((bp, index) => {
            output.push(`  ${index + 1}. ${bp.nucleotide1}${bp.position1}-${bp.nucleotide2}${bp.position2} (${bp.pair_type}, ${bp.energy.toFixed(1)} kcal/mol)`);
          });
          
          if (result.base_pairs.length > 10) {
            output.push(`  ... and ${result.base_pairs.length - 10} more base pairs`);
          }
          output.push("");
        }

        // Stem analysis
        if (result.stems.length > 0) {
          output.push("🌿 STEM ANALYSIS");
          result.stems.forEach((stem, index) => {
            output.push(`Stem ${index + 1}: ${stem.start1}-${stem.end1} paired with ${stem.end2}-${stem.start2}`);
            output.push(`  Length: ${stem.length} base pairs`);
            output.push(`  Stability: ${stem.stability} kcal/mol`);
          });
          output.push("");
        }

        // Loop analysis
        if (result.loops.length > 0) {
          output.push("🔄 LOOP ANALYSIS");
          
          const hairpins = result.loops.filter(l => l.type === 'hairpin');
          const bulges = result.loops.filter(l => l.type === 'bulge');
          const internal = result.loops.filter(l => l.type === 'internal');
          const multi = result.loops.filter(l => l.type === 'multi');
          
          if (hairpins.length > 0) {
            output.push(`\nHairpin Loops (${hairpins.length}):`);
            hairpins.forEach((loop, index) => {
              output.push(`  H${index + 1}: ${loop.start}-${loop.end} (${loop.length} nt) "${loop.sequence}" (${loop.energy.toFixed(1)} kcal/mol)`);
            });
          }
          
          if (bulges.length > 0) {
            output.push(`\nBulge Loops (${bulges.length}):`);
            bulges.forEach((loop, index) => {
              output.push(`  B${index + 1}: ${loop.start}-${loop.end} (${loop.length} nt) "${loop.sequence}"`);
            });
          }
          
          if (internal.length > 0) {
            output.push(`\nInternal Loops (${internal.length}):`);
            internal.forEach((loop, index) => {
              output.push(`  I${index + 1}: ${loop.start}-${loop.end} (${loop.length} nt) "${loop.sequence}"`);
            });
          }
          
          if (multi.length > 0) {
            output.push(`\nMulti-branch Loops (${multi.length}):`);
            multi.forEach((loop, index) => {
              output.push(`  M${index + 1}: ${loop.start}-${loop.end} (${loop.length} nt)`);
            });
          }
          output.push("");
        }

        // Thermodynamic stability
        output.push("🌡️ THERMODYNAMIC ANALYSIS");
        if (result.free_energy < -10) {
          output.push("• Very stable structure (ΔG < -10 kcal/mol)");
        } else if (result.free_energy < -5) {
          output.push("• Moderately stable structure (-10 < ΔG < -5 kcal/mol)");
        } else if (result.free_energy < 0) {
          output.push("• Weakly stable structure (-5 < ΔG < 0 kcal/mol)");
        } else {
          output.push("• Unstable structure (ΔG > 0 kcal/mol)");
        }
        
        const pairingEfficiency = result.base_pairs.length / (result.sequence_length / 2) * 100;
        output.push(`• Base pairing efficiency: ${pairingEfficiency.toFixed(1)}%`);

        // Functional predictions
        output.push("");
        output.push("🔮 FUNCTIONAL PREDICTIONS");
        
        if (result.structure_type.includes('hairpin')) {
          output.push("• Simple hairpin structure - potential regulatory element");
        }
        
        if (result.stems.length >= 3) {
          output.push("• Multi-stem structure - potential ribozyme or riboswitch");
        }
        
        if (result.loops.some(l => l.type === 'hairpin' && l.length >= 4 && l.length <= 8)) {
          output.push("• Contains stable tetraloops - common in catalytic RNAs");
        }
        
        if (result.free_energy < -20) {
          output.push("• Highly stable fold - likely functional RNA");
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
              text: `❌ Error predicting RNA secondary structure: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 4: Scan RNA Motifs
  server.tool(
    "scan_rna_motifs",
    "Identify functional RNA motifs and regulatory elements in sequence",
    scanRNAMotifsSchema,
    async ({ sequence, structure_context = false }) => {
      try {
        // Get structure context if requested
        let rnaStructure;
        if (structure_context) {
          rnaStructure = predictRNASecondaryStructure(sequence);
        }
        
        const result = scanRNAMotifs(sequence, rnaStructure?.structure);
        
        const output = [
          `=== RNA MOTIF ANALYSIS ===`,
          "",
          "🔧 ANALYSIS PARAMETERS",
          `Sequence Length: ${result.sequence_length} nucleotides`,
          `Structure Context: ${structure_context ? 'Included' : 'Sequence only'}`,
          `Total Motifs Found: ${result.motifs_found}`,
          `Unique Motif Types: ${result.motifs.length}`,
          "",
          "📊 FUNCTIONAL ELEMENT SUMMARY",
          `Regulatory Elements: ${result.functional_elements.regulatory_elements}`,
          `Hairpin Structures: ${result.functional_elements.hairpins}`,
          `Pseudoknots: ${result.functional_elements.pseudoknots}`,
          `Riboswitches: ${result.functional_elements.riboswitches}`,
          ""
        ];

        // Group motifs by type
        const regulatoryMotifs = result.motifs.filter(m => m.type === 'regulatory');
        const structuralMotifs = result.motifs.filter(m => m.type === 'structural');
        const catalyticMotifs = result.motifs.filter(m => m.type === 'catalytic');
        
        // Regulatory motifs
        if (regulatoryMotifs.length > 0) {
          output.push("🎛️ REGULATORY MOTIFS");
          
          regulatoryMotifs.forEach(motif => {
            output.push(`\n${motif.name}:`);
            output.push(`  Description: ${motif.description}`);
            output.push(`  Pattern: ${motif.pattern}`);
            output.push(`  Matches: ${motif.matches.length}`);
            
            motif.matches.slice(0, 5).forEach((match, index) => {
              output.push(`    ${index + 1}. Position ${match.position}: ${match.sequence} (score: ${match.score})`);
              if (structure_context && match.structure) {
                output.push(`       Structure: ${match.structure}`);
              }
            });
            
            if (motif.matches.length > 5) {
              output.push(`    ... and ${motif.matches.length - 5} more matches`);
            }
          });
          output.push("");
        }

        // Structural motifs
        if (structuralMotifs.length > 0) {
          output.push("🏗️ STRUCTURAL MOTIFS");
          
          structuralMotifs.forEach(motif => {
            output.push(`\n${motif.name}:`);
            output.push(`  Description: ${motif.description}`);
            output.push(`  Matches: ${motif.matches.length}`);
            
            motif.matches.slice(0, 3).forEach((match, index) => {
              output.push(`    ${index + 1}. Position ${match.position}: ${match.sequence}`);
              if (structure_context && match.structure) {
                output.push(`       Structure: ${match.structure}`);
              }
            });
            
            if (motif.matches.length > 3) {
              output.push(`    ... and ${motif.matches.length - 3} more matches`);
            }
          });
          output.push("");
        }

        // Catalytic motifs
        if (catalyticMotifs.length > 0) {
          output.push("⚗️ CATALYTIC MOTIFS");
          
          catalyticMotifs.forEach(motif => {
            output.push(`\n${motif.name}:`);
            output.push(`  Description: ${motif.description}`);
            output.push(`  Matches: ${motif.matches.length}`);
            
            motif.matches.forEach((match, index) => {
              output.push(`    ${index + 1}. Position ${match.position}: ${match.sequence} (score: ${match.score})`);
            });
          });
          output.push("");
        }

        // No motifs found
        if (result.motifs.length === 0) {
          output.push("🔍 MOTIF SEARCH RESULTS");
          output.push("No significant RNA motifs detected in the sequence");
          output.push("");
          output.push("💡 SUGGESTIONS");
          output.push("• Sequence may be too short for motif detection");
          output.push("• Try including secondary structure context");
          output.push("• Consider that the RNA may have novel or species-specific motifs");
        }

        // Functional predictions
        output.push("🔮 FUNCTIONAL PREDICTIONS");
        
        if (result.functional_elements.regulatory_elements > 0) {
          output.push(`• ${result.functional_elements.regulatory_elements} regulatory element(s) detected - potential gene expression control`);
        }
        
        if (result.functional_elements.hairpins > 0) {
          output.push(`• ${result.functional_elements.hairpins} hairpin structure(s) - stable secondary structures`);
        }
        
        if (result.functional_elements.pseudoknots > 0) {
          output.push(`• ${result.functional_elements.pseudoknots} pseudoknot(s) - complex tertiary structure`);
        }
        
        if (catalyticMotifs.length > 0) {
          output.push("• Catalytic motifs present - potential ribozyme activity");
        }
        
        if (regulatoryMotifs.some(m => m.name.includes('RIBOSOME'))) {
          output.push("• Ribosome binding sites detected - translational control");
        }
        
        if (regulatoryMotifs.some(m => m.name.includes('IRES'))) {
          output.push("• IRES elements detected - cap-independent translation");
        }
        
        if (result.motifs_found === 0) {
          output.push("• No known motifs detected - may be non-coding or novel functional RNA");
        }

        // RNA class prediction
        output.push("");
        output.push("🧬 RNA CLASS PREDICTION");
        
        if (regulatoryMotifs.some(m => m.name.includes('RIBOSOME')) || 
            regulatoryMotifs.some(m => m.name.includes('KOZAK'))) {
          output.push("• Likely mRNA with translation signals");
        } else if (structuralMotifs.length > regulatoryMotifs.length) {
          output.push("• Likely structural RNA (rRNA, tRNA, or snRNA)");
        } else if (catalyticMotifs.length > 0) {
          output.push("• Likely catalytic RNA (ribozyme)");
        } else if (regulatoryMotifs.length > 0) {
          output.push("• Likely regulatory RNA (miRNA, siRNA, or lncRNA)");
        } else {
          output.push("• RNA class unclear - may be novel or poorly characterized");
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
              text: `❌ Error scanning RNA motifs: ${error}`,
            },
          ],
        };
      }
    }
  );
}
