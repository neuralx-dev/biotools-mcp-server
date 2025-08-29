/**
 * Enhanced protein analysis MCP tools
 */

import { 
  getCrossReferences,
  analyzePTMs,
  getPathwayData
} from "../utils/protein-enhanced.js";
import { 
  getCrossReferencesSchema,
  analyzePTMsSchema,
  getPathwayDataSchema,
  validateUniProtAccession
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerProteinEnhancedTools(server: McpServer) {
  server.tool(
    "get_cross_references",
    "Get comprehensive cross-references for a protein from KEGG, Pfam, PDB, InterPro, and GO databases",
    getCrossReferencesSchema,
    async ({ protein_id, databases, include_details = true }) => {
      try {
        // Validate UniProt accession format
        if (!validateUniProtAccession(protein_id)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid UniProt accession format: '${protein_id}'. Accession should be alphanumeric (e.g., P04637).`,
              },
            ],
          };
        }
        
        // Get cross-references
        const crossRefs = await getCrossReferences(protein_id.toUpperCase(), databases, include_details);
        
        if (!crossRefs) {
          return {
            content: [
              {
                type: "text",
                text: `No protein entry found for accession: ${protein_id}`,
              },
            ],
          };
        }
        
        // Format cross-reference results
        const result = [
          `=== CROSS-REFERENCES FOR ${crossRefs.proteinId} ===`,
          "",
          "🔗 DATABASE CROSS-REFERENCES",
          "",
        ];
        
        // KEGG References
        if (crossRefs.references.kegg && crossRefs.references.kegg.length > 0) {
          result.push("🧬 KEGG PATHWAY DATABASE");
          crossRefs.references.kegg.forEach((kegg, index) => {
            result.push(`${index + 1}. ID: ${kegg.id} (${kegg.database})`);
            if (kegg.pathway) result.push(`   Pathway: ${kegg.pathway}`);
            if (kegg.module) result.push(`   Module: ${kegg.module}`);
            if (kegg.reaction) result.push(`   Reaction: ${kegg.reaction}`);
          });
          result.push("");
        }
        
        // Pfam References
        if (crossRefs.references.pfam && crossRefs.references.pfam.length > 0) {
          result.push("🧩 PFAM PROTEIN FAMILIES");
          crossRefs.references.pfam.forEach((pfam, index) => {
            result.push(`${index + 1}. ${pfam.id}: ${pfam.name}`);
            if (pfam.description) result.push(`   Description: ${pfam.description}`);
            if (pfam.start && pfam.end) {
              result.push(`   Domain Region: ${pfam.start}-${pfam.end}`);
            }
            if (pfam.evalue) result.push(`   E-value: ${pfam.evalue}`);
          });
          result.push("");
        }
        
        // PDB References
        if (crossRefs.references.pdb && crossRefs.references.pdb.length > 0) {
          result.push("🏗️ PDB STRUCTURAL DATA");
          crossRefs.references.pdb.forEach((pdb, index) => {
            result.push(`${index + 1}. PDB ID: ${pdb.id}`);
            if (pdb.title) result.push(`   Title: ${pdb.title.substring(0, 80)}${pdb.title.length > 80 ? '...' : ''}`);
            if (pdb.method) result.push(`   Method: ${pdb.method}`);
            if (pdb.resolution) result.push(`   Resolution: ${pdb.resolution}`);
            if (pdb.chains && pdb.chains.length > 0) {
              result.push(`   Chains: ${pdb.chains.slice(0, 5).join(', ')}${pdb.chains.length > 5 ? ` (+${pdb.chains.length - 5} more)` : ''}`);
            }
          });
          result.push("");
        }
        
        // InterPro References
        if (crossRefs.references.interpro && crossRefs.references.interpro.length > 0) {
          result.push("🔍 INTERPRO PROTEIN ANALYSIS");
          crossRefs.references.interpro.forEach((interpro, index) => {
            result.push(`${index + 1}. ${interpro.id}: ${interpro.name}`);
            result.push(`   Type: ${interpro.type}`);
            if (interpro.start && interpro.end) {
              result.push(`   Region: ${interpro.start}-${interpro.end}`);
            }
          });
          result.push("");
        }
        
        // GO References
        if (crossRefs.references.go && crossRefs.references.go.length > 0) {
          result.push("📊 GENE ONTOLOGY ANNOTATIONS");
          
          // Group by category
          const goByCategory = crossRefs.references.go.reduce((acc, go) => {
            if (!acc[go.category]) acc[go.category] = [];
            acc[go.category].push(go);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(goByCategory).forEach(([category, goTerms]) => {
            const categoryName = category.replace(/_/g, ' ').toUpperCase();
            result.push(`  ${categoryName}:`);
            goTerms.slice(0, 8).forEach(go => {
              result.push(`  - ${go.id}: ${go.term} ${go.evidence ? `[${go.evidence}]` : ''}`);
            });
            if (goTerms.length > 8) {
              result.push(`  ... and ${goTerms.length - 8} more ${categoryName.toLowerCase()} terms`);
            }
            result.push("");
          });
        }
        
        // Summary
        const totalRefs = Object.values(crossRefs.references).reduce((sum, refs) => 
          sum + (refs ? refs.length : 0), 0
        );
        
        result.push("📈 SUMMARY");
        result.push(`Total Cross-references: ${totalRefs}`);
        
        const dbCounts = Object.entries(crossRefs.references)
          .filter(([_, refs]) => refs && refs.length > 0)
          .map(([db, refs]) => `${db.toUpperCase()}: ${refs!.length}`)
          .join(', ');
        
        result.push(`Database Coverage: ${dbCounts}`);
        result.push("");
        
        if (include_details) {
          result.push("💡 FUNCTIONAL INSIGHTS");
          if (crossRefs.references.kegg && crossRefs.references.kegg.length > 0) {
            result.push("- Protein participates in metabolic pathways (KEGG coverage)");
          }
          if (crossRefs.references.pdb && crossRefs.references.pdb.length > 0) {
            result.push("- 3D structural information available (PDB structures)");
          }
          if (crossRefs.references.pfam && crossRefs.references.pfam.length > 0) {
            result.push("- Contains characterized protein domains (Pfam coverage)");
          }
          if (crossRefs.references.go && crossRefs.references.go.length > 0) {
            result.push("- Well-annotated with functional information (GO terms)");
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: result.join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching cross-references: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "analyze_ptms",
    "Analyze post-translational modifications with functional impact assessment",
    analyzePTMsSchema,
    async ({ protein_id, ptm_types, functional_analysis = true, confidence_threshold = 'medium' }) => {
      try {
        // Validate UniProt accession format
        if (!validateUniProtAccession(protein_id)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid UniProt accession format: '${protein_id}'. Accession should be alphanumeric (e.g., P04637).`,
              },
            ],
          };
        }
        
        // Analyze PTMs
        const ptmAnalysis = await analyzePTMs(
          protein_id.toUpperCase(), 
          ptm_types, 
          functional_analysis, 
          confidence_threshold
        );
        
        if (!ptmAnalysis) {
          return {
            content: [
              {
                type: "text",
                text: `No protein entry found for accession: ${protein_id}`,
              },
            ],
          };
        }
        
        // Format PTM analysis results
        const result = [
          `=== POST-TRANSLATIONAL MODIFICATION ANALYSIS: ${ptmAnalysis.proteinId} ===`,
          "",
          "📋 PROTEIN INFORMATION",
          `Protein: ${ptmAnalysis.proteinName}`,
          `Sequence Length: ${ptmAnalysis.sequence.length} amino acids`,
          `Analysis Scope: ${ptm_types ? ptm_types.join(', ') : 'All PTM types'}`,
          `Confidence Threshold: ${confidence_threshold}`,
          "",
          "📊 PTM SUMMARY",
          `Total Modifications Found: ${ptmAnalysis.summary.totalModifications}`,
          "",
          "🔬 MODIFICATION TYPES",
          Object.entries(ptmAnalysis.summary.modificationTypes).length > 0 ?
            Object.entries(ptmAnalysis.summary.modificationTypes)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => `- ${type}: ${count} sites`)
              .join('\n') :
            "No modifications detected",
          "",
        ];
        
        // Functional categories if functional analysis is enabled
        if (functional_analysis && Object.keys(ptmAnalysis.summary.functionalCategories).length > 0) {
          result.push("🎯 FUNCTIONAL IMPACT CATEGORIES");
          Object.entries(ptmAnalysis.summary.functionalCategories)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
              result.push(`- ${category}: ${count} modifications`);
            });
          result.push("");
        }
        
        // Detailed modifications
        if (ptmAnalysis.modifications.length > 0) {
          result.push("🔍 DETAILED MODIFICATION SITES");
          
          // Group by modification type
          const modsByType = ptmAnalysis.modifications.reduce((acc, mod) => {
            if (!acc[mod.type]) acc[mod.type] = [];
            acc[mod.type].push(mod);
            return acc;
          }, {} as Record<string, any[]>);
          
          Object.entries(modsByType).forEach(([type, mods]) => {
            result.push(`\n${type.toUpperCase()} (${mods.length} sites):`);
            
            mods
              .sort((a, b) => a.position - b.position)
              .slice(0, 15) // Limit to 15 sites per type
              .forEach((mod, index) => {
                result.push(`  ${index + 1}. Position ${mod.position}: ${mod.residue} → ${mod.modifiedResidue}`);
                result.push(`     Description: ${mod.description}`);
                result.push(`     Evidence: ${mod.evidence}`);
                
                if (functional_analysis && mod.functionalImpact) {
                  result.push(`     Functional Impact: ${mod.functionalImpact.category} (${mod.functionalImpact.confidence})`);
                  result.push(`     Details: ${mod.functionalImpact.description}`);
                }
                result.push("");
              });
            
            if (mods.length > 15) {
              result.push(`     ... and ${mods.length - 15} more ${type.toLowerCase()} sites`);
              result.push("");
            }
          });
        } else {
          result.push("No post-translational modifications found matching the specified criteria.");
          result.push("");
        }
        
        // Functional insights
        if (functional_analysis && ptmAnalysis.modifications.length > 0) {
          result.push("💡 FUNCTIONAL INSIGHTS");
          
          const highConfidenceMods = ptmAnalysis.modifications.filter(mod => 
            mod.functionalImpact?.confidence === 'high'
          );
          
          if (highConfidenceMods.length > 0) {
            result.push(`- ${highConfidenceMods.length} high-confidence functional modifications identified`);
          }
          
          // Type-specific insights
          const phosphoSites = ptmAnalysis.modifications.filter(mod => 
            mod.type.toLowerCase().includes('phospho')
          );
          if (phosphoSites.length > 0) {
            result.push(`- ${phosphoSites.length} phosphorylation sites may regulate protein activity and signaling`);
          }
          
          const acetylSites = ptmAnalysis.modifications.filter(mod => 
            mod.type.toLowerCase().includes('acetyl')
          );
          if (acetylSites.length > 0) {
            result.push(`- ${acetylSites.length} acetylation sites may affect gene regulation and protein interactions`);
          }
          
          const ubiqSites = ptmAnalysis.modifications.filter(mod => 
            mod.type.toLowerCase().includes('ubiquitin')
          );
          if (ubiqSites.length > 0) {
            result.push(`- ${ubiqSites.length} ubiquitination sites may target protein for degradation or trafficking`);
          }
        }
        
        return {
          content: [
            {
              type: "text",
              text: result.join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing PTMs: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "get_pathway_data",
    "Get detailed pathway information and metabolic context for a protein",
    getPathwayDataSchema,
    async ({ protein_id, pathway_db = 'kegg', include_reactions = true, related_proteins = false }) => {
      try {
        // Validate UniProt accession format
        if (!validateUniProtAccession(protein_id)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid UniProt accession format: '${protein_id}'. Accession should be alphanumeric (e.g., P04637).`,
              },
            ],
          };
        }
        
        // Get pathway data
        const pathwayData = await getPathwayData(
          protein_id.toUpperCase(),
          pathway_db,
          include_reactions,
          related_proteins
        );
        
        if (!pathwayData) {
          return {
            content: [
              {
                type: "text",
                text: `No pathway data found for protein: ${protein_id} in ${pathway_db} database`,
              },
            ],
          };
        }
        
        // Format pathway results
        const result = [
          `=== PATHWAY ANALYSIS: ${pathwayData.proteinId} ===`,
          "",
          "📋 ANALYSIS PARAMETERS",
          `Protein ID: ${pathwayData.proteinId}`,
          `Pathway Database: ${pathway_db.toUpperCase()}`,
          `Include Reactions: ${include_reactions ? 'Yes' : 'No'}`,
          `Related Proteins: ${related_proteins ? 'Yes' : 'No'}`,
          "",
          "📊 PATHWAY SUMMARY",
          `Total Pathways Found: ${pathwayData.pathways.length}`,
          "",
        ];
        
        if (pathwayData.pathways.length > 0) {
          result.push("🛤️ PATHWAY DETAILS");
          
          pathwayData.pathways.forEach((pathway, index) => {
            result.push(`\n${index + 1}. ${pathway.name} (${pathway.id})`);
            result.push(`   Database: ${pathway.database}`);
            result.push(`   Category: ${pathway.category}`);
            
            if (pathway.description) {
              result.push(`   Description: ${pathway.description.length > 150 ? 
                pathway.description.substring(0, 150) + '...' : 
                pathway.description}`);
            }
            
            if (pathway.organisms && pathway.organisms.length > 0) {
              result.push(`   Organisms: ${pathway.organisms.slice(0, 5).join(', ')}${
                pathway.organisms.length > 5 ? ` (+${pathway.organisms.length - 5} more)` : ''
              }`);
            }
            
            if (include_reactions && pathway.reactions && pathway.reactions.length > 0) {
              result.push(`   Reactions: ${pathway.reactions.length} biochemical reactions`);
              pathway.reactions.slice(0, 3).forEach((reaction, rIndex) => {
                result.push(`     ${rIndex + 1}. ${reaction.id}: ${reaction.equation || 'Equation not available'} ${
                  reaction.reversible ? '(Reversible)' : '(Irreversible)'
                }`);
              });
              if (pathway.reactions.length > 3) {
                result.push(`     ... and ${pathway.reactions.length - 3} more reactions`);
              }
            }
            
            if (pathway.modules && pathway.modules.length > 0) {
              result.push(`   Modules: ${pathway.modules.length} functional modules`);
              pathway.modules.slice(0, 2).forEach((module, mIndex) => {
                result.push(`     ${mIndex + 1}. ${module.id}: ${module.name}`);
                if (module.definition) {
                  result.push(`        Definition: ${module.definition.length > 100 ? 
                    module.definition.substring(0, 100) + '...' : 
                    module.definition}`);
                }
              });
              if (pathway.modules.length > 2) {
                result.push(`     ... and ${pathway.modules.length - 2} more modules`);
              }
            }
            
            if (related_proteins && pathway.relatedProteins && pathway.relatedProteins.length > 0) {
              result.push(`   Related Proteins: ${pathway.relatedProteins.slice(0, 8).join(', ')}${
                pathway.relatedProteins.length > 8 ? ` (+${pathway.relatedProteins.length - 8} more)` : ''
              }`);
            }
          });
          
          result.push("");
          result.push("💡 METABOLIC CONTEXT");
          
          // Analyze pathway categories
          const categories = pathwayData.pathways.map(p => p.category);
          const uniqueCategories = [...new Set(categories)];
          
          if (uniqueCategories.length > 0) {
            result.push(`Functional Categories: ${uniqueCategories.join(', ')}`);
          }
          
          // Count total reactions
          const totalReactions = pathwayData.pathways.reduce((sum, p) => 
            sum + (p.reactions ? p.reactions.length : 0), 0
          );
          
          if (totalReactions > 0) {
            result.push(`Total Biochemical Reactions: ${totalReactions}`);
          }
          
          // Suggest functional role
          if (pathwayData.pathways.some(p => p.category.toLowerCase().includes('metabol'))) {
            result.push("This protein appears to play a role in cellular metabolism");
          }
          
          if (pathwayData.pathways.some(p => p.category.toLowerCase().includes('signal'))) {
            result.push("This protein is involved in cellular signaling pathways");
          }
          
          if (pathwayData.pathways.some(p => p.name.toLowerCase().includes('cancer'))) {
            result.push("This protein has connections to cancer-related pathways");
          }
          
        } else {
          result.push("No pathway information found in the specified database.");
          result.push("");
          result.push("💡 SUGGESTIONS");
          result.push("- Try searching in a different pathway database (KEGG, Reactome, WikiPathways, BioCyc)");
          result.push("- Check if the protein has alternative names or isoforms");
          result.push("- Verify that the protein is involved in metabolic or signaling processes");
        }
        
        return {
          content: [
            {
              type: "text",
              text: result.join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching pathway data: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );
}
