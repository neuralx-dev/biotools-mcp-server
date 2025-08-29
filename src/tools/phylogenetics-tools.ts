/**
 * Phylogenetic analysis MCP tools
 * Chapter 13: Phylogenetics
 */

import { 
  buildPhylogeneticTree,
  comparePhylogeneticTrees,
  SequenceRecord
} from "../utils/phylogenetics.js";
import { 
  buildPhylogeneticTreeSchema,
  comparePhylogeneticTreesSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPhylogeneticsTools(server: McpServer) {
  
  // Tool 1: Build Phylogenetic Tree
  server.tool(
    "build_phylogenetic_tree",
    "Build phylogenetic tree from multiple sequences using Neighbor-Joining, UPGMA, or Maximum Parsimony",
    buildPhylogeneticTreeSchema,
    async ({ sequences, method = 'neighbor-joining', bootstrap_replicates = 0 }) => {
      try {
        if (sequences.length < 3) {
          return {
            content: [
              {
                type: "text",
                text: "❌ At least 3 sequences are required for phylogenetic tree construction",
              },
            ],
          };
        }
        
        const sequenceRecords: SequenceRecord[] = sequences.map((seq, index) => ({
          id: seq.id || `Seq${index + 1}`,
          sequence: seq.sequence.toUpperCase().replace(/\s+/g, ''),
          description: seq.description
        }));
        
        const result = buildPhylogeneticTree(sequenceRecords, method, bootstrap_replicates);
        
        const output = [
          `=== PHYLOGENETIC TREE CONSTRUCTION ===`,
          "",
          "🔧 ANALYSIS PARAMETERS",
          `Method: ${result.method.toUpperCase()}`,
          `Sequences: ${sequenceRecords.length}`,
          `Bootstrap Replicates: ${bootstrap_replicates}`,
          `Tree Format: ${result.tree_format}`,
          "",
          "📊 TREE STATISTICS",
          `Total Tree Length: ${result.total_length.toFixed(4)}`,
          `Average Branch Length: ${result.statistics.average_branch_length}`,
          `Tree Depth: ${result.statistics.tree_depth.toFixed(4)}`,
          `Polytomies: ${result.statistics.polytomies}`,
          "",
          "🧬 SEQUENCE INFORMATION"
        ];

        // Sequence details
        sequenceRecords.forEach((seq, index) => {
          const originalLength = seq.sequence.replace(/-/g, '').length;
          output.push(`${index + 1}. ${seq.id}: ${originalLength} ${seq.sequence.includes('T') ? 'nucleotides' : 'amino acids'}`);
          if (seq.description) {
            output.push(`   Description: ${seq.description}`);
          }
        });
        
        output.push("");

        // Tree topology
        output.push("🌳 TREE TOPOLOGY");
        output.push(`Newick Format:`);
        output.push(`${result.newick_string}`);
        output.push("");

        // Leaf information
        output.push("🍃 LEAF NODES");
        result.leaves.forEach((leaf, index) => {
          output.push(`${index + 1}. ${leaf.name}:`);
          output.push(`   Branch Length: ${leaf.branch_length.toFixed(4)}`);
          output.push(`   Distance to Root: ${leaf.distance_to_root.toFixed(4)}`);
        });
        output.push("");

        // Internal nodes with bootstrap support
        const internalNodes = result.nodes.filter(node => !node.is_leaf);
        if (internalNodes.length > 0) {
          output.push("🔗 INTERNAL NODES");
          internalNodes.forEach((node, index) => {
            output.push(`Node ${index + 1} (${node.id}):`);
            output.push(`  Children: ${node.children.length}`);
            output.push(`  Branch Length: ${node.branch_length.toFixed(4)}`);
            if (node.bootstrap_support !== undefined) {
              output.push(`  Bootstrap Support: ${node.bootstrap_support.toFixed(0)}%`);
            }
          });
          output.push("");
        }

        // Method-specific information
        output.push("🧮 METHOD INFORMATION");
        switch (result.method) {
          case 'neighbor-joining':
            output.push("• Neighbor-Joining: Distance-based method");
            output.push("• Assumes molecular clock relaxation");
            output.push("• Good for closely related sequences");
            output.push("• Computationally efficient");
            break;
          case 'upgma':
            output.push("• UPGMA: Assumes constant evolutionary rate");
            output.push("• Ultrametric tree (molecular clock)");
            output.push("• Good for sequences with similar rates");
            output.push("• Simple clustering algorithm");
            break;
          case 'maximum-parsimony':
            output.push("• Maximum Parsimony: Minimizes evolutionary changes");
            output.push("• Character-based method");
            output.push("• Good for discrete character data");
            output.push("• Can handle homoplasy");
            break;
        }
        output.push("");

        // Tree quality assessment
        output.push("📈 TREE QUALITY ASSESSMENT");
        
        if (result.statistics.average_branch_length < 0.01) {
          output.push("• Very short branches - sequences are highly similar");
        } else if (result.statistics.average_branch_length > 0.5) {
          output.push("• Long branches - sequences are highly divergent");
        } else {
          output.push("• Moderate branch lengths - good phylogenetic signal");
        }
        
        if (result.statistics.polytomies > 0) {
          output.push(`• ${result.statistics.polytomies} polytomie(s) detected - uncertain relationships`);
        } else {
          output.push("• Fully resolved tree - all relationships well-supported");
        }
        
        if (bootstrap_replicates > 0) {
          const highSupport = result.nodes.filter(node => 
            node.bootstrap_support && node.bootstrap_support >= 70).length;
          const totalInternal = internalNodes.length;
          
          if (totalInternal > 0) {
            const supportPercentage = (highSupport / totalInternal * 100).toFixed(0);
            output.push(`• Bootstrap support: ${highSupport}/${totalInternal} nodes (${supportPercentage}%) have ≥70% support`);
            
            if (highSupport / totalInternal >= 0.8) {
              output.push("• Excellent bootstrap support - tree is well-supported");
            } else if (highSupport / totalInternal >= 0.6) {
              output.push("• Good bootstrap support - most relationships reliable");
            } else {
              output.push("• Weak bootstrap support - tree should be interpreted cautiously");
            }
          }
        }

        // Evolutionary insights
        output.push("");
        output.push("🔮 EVOLUTIONARY INSIGHTS");
        
        // Find most distant sequences
        const maxDistance = Math.max(...result.leaves.map(leaf => leaf.distance_to_root));
        const minDistance = Math.min(...result.leaves.map(leaf => leaf.distance_to_root));
        const mostDistant = result.leaves.find(leaf => leaf.distance_to_root === maxDistance);
        const leastDistant = result.leaves.find(leaf => leaf.distance_to_root === minDistance);
        
        if (mostDistant && leastDistant && mostDistant !== leastDistant) {
          output.push(`• Most divergent: ${mostDistant.name} (distance: ${maxDistance.toFixed(4)})`);
          output.push(`• Least divergent: ${leastDistant.name} (distance: ${minDistance.toFixed(4)})`);
        }
        
        // Rate variation
        const distanceRange = maxDistance - minDistance;
        if (distanceRange > result.statistics.average_branch_length) {
          output.push("• Significant rate variation detected across lineages");
        } else {
          output.push("• Relatively uniform evolutionary rates");
        }
        
        // Tree balance
        const leafDistances = result.leaves.map(leaf => leaf.distance_to_root);
        const variance = leafDistances.reduce((sum, dist) => sum + Math.pow(dist - result.statistics.tree_depth/2, 2), 0) / leafDistances.length;
        
        if (variance < 0.01) {
          output.push("• Well-balanced tree - similar evolutionary distances");
        } else {
          output.push("• Unbalanced tree - variable evolutionary rates");
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
              text: `❌ Error building phylogenetic tree: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: Compare Phylogenetic Trees
  server.tool(
    "compare_phylogenetic_trees",
    "Compare two phylogenetic trees using Robinson-Foulds distance and other metrics",
    comparePhylogeneticTreesSchema,
    async ({ tree1_sequences, tree2_sequences, tree1_method = 'neighbor-joining', tree2_method = 'neighbor-joining' }) => {
      try {
        // Build both trees
        const sequences1: SequenceRecord[] = tree1_sequences.map((seq, index) => ({
          id: seq.id || `T1_Seq${index + 1}`,
          sequence: seq.sequence.toUpperCase().replace(/\s+/g, ''),
          description: seq.description
        }));
        
        const sequences2: SequenceRecord[] = tree2_sequences.map((seq, index) => ({
          id: seq.id || `T2_Seq${index + 1}`,
          sequence: seq.sequence.toUpperCase().replace(/\s+/g, ''),
          description: seq.description
        }));
        
        const tree1 = buildPhylogeneticTree(sequences1, tree1_method);
        const tree2 = buildPhylogeneticTree(sequences2, tree2_method);
        
        const result = comparePhylogeneticTrees(tree1, tree2);
        
        const output = [
          `=== PHYLOGENETIC TREE COMPARISON ===`,
          "",
          "🔧 COMPARISON PARAMETERS",
          `Tree 1: ${result.tree1_info.method} (${result.tree1_info.leaves} taxa)`,
          `Tree 2: ${result.tree2_info.method} (${result.tree2_info.leaves} taxa)`,
          "",
          "📊 TREE INFORMATION",
          "",
          "Tree 1:",
          `  Method: ${result.tree1_info.method}`,
          `  Taxa: ${result.tree1_info.leaves}`,
          `  Total Length: ${result.tree1_info.total_length.toFixed(4)}`,
          "",
          "Tree 2:",
          `  Method: ${result.tree2_info.method}`,
          `  Taxa: ${result.tree2_info.leaves}`,
          `  Total Length: ${result.tree2_info.total_length.toFixed(4)}`,
          ""
        ];

        // Comparison metrics
        output.push("📏 DISTANCE METRICS");
        output.push(`Robinson-Foulds Distance: ${result.comparison_metrics.robinson_foulds_distance}`);
        output.push(`Normalized RF Distance: ${result.comparison_metrics.normalized_rf_distance}`);
        output.push(`Shared Bipartitions: ${result.comparison_metrics.shared_bipartitions}/${result.comparison_metrics.total_bipartitions}`);
        output.push(`Topological Similarity: ${(result.comparison_metrics.topological_similarity * 100).toFixed(1)}%`);
        output.push("");

        // Branch length comparison
        if (result.branch_length_comparison) {
          output.push("📐 BRANCH LENGTH COMPARISON");
          output.push(`Correlation: ${result.branch_length_comparison.correlation.toFixed(3)}`);
          output.push(`RMSE: ${result.branch_length_comparison.rmse.toFixed(4)}`);
          output.push(`Mean Difference: ${result.branch_length_comparison.mean_difference.toFixed(4)}`);
          output.push("");
        }

        // Interpretation of similarities/differences
        output.push("🔍 SIMILARITY ANALYSIS");
        
        if (result.comparison_metrics.normalized_rf_distance === 0) {
          output.push("• Trees have IDENTICAL topology");
        } else if (result.comparison_metrics.normalized_rf_distance < 0.2) {
          output.push("• Trees have VERY SIMILAR topology");
        } else if (result.comparison_metrics.normalized_rf_distance < 0.5) {
          output.push("• Trees have MODERATELY SIMILAR topology");
        } else if (result.comparison_metrics.normalized_rf_distance < 0.8) {
          output.push("• Trees have DIFFERENT topology");
        } else {
          output.push("• Trees have VERY DIFFERENT topology");
        }
        
        const sharedPercent = (result.comparison_metrics.shared_bipartitions / Math.max(result.comparison_metrics.total_bipartitions, 1) * 100);
        output.push(`• ${sharedPercent.toFixed(1)}% of bipartitions are shared between trees`);
        
        if (result.branch_length_comparison) {
          if (result.branch_length_comparison.correlation > 0.8) {
            output.push("• Branch lengths are HIGHLY correlated");
          } else if (result.branch_length_comparison.correlation > 0.5) {
            output.push("• Branch lengths are MODERATELY correlated");
          } else {
            output.push("• Branch lengths are POORLY correlated");
          }
        }
        
        output.push("");

        // Detailed differences
        if (result.differences.length > 0) {
          output.push("⚠️ DETECTED DIFFERENCES");
          
          result.differences.forEach((diff, index) => {
            output.push(`\n${index + 1}. ${diff.type.toUpperCase()} (${diff.significance} significance):`);
            output.push(`   ${diff.description}`);
            if (diff.affected_taxa.length > 0) {
              output.push(`   Affected taxa: ${diff.affected_taxa.join(', ')}`);
            }
          });
          
          output.push("");
        }

        // Statistical significance
        output.push("📈 STATISTICAL ASSESSMENT");
        
        if (result.comparison_metrics.robinson_foulds_distance === 0) {
          output.push("• Trees are topologically identical");
          output.push("• All internal relationships are conserved");
        } else {
          const maxRF = 2 * (Math.max(result.tree1_info.leaves, result.tree2_info.leaves) - 3);
          const rfPercent = (result.comparison_metrics.robinson_foulds_distance / maxRF * 100).toFixed(1);
          output.push(`• ${rfPercent}% of possible topological differences present`);
        }
        
        if (result.comparison_metrics.topological_similarity > 0.8) {
          output.push("• High topological congruence (>80%)");
        } else if (result.comparison_metrics.topological_similarity > 0.6) {
          output.push("• Moderate topological congruence (60-80%)");
        } else {
          output.push("• Low topological congruence (<60%)");
        }

        // Methodological considerations
        output.push("");
        output.push("🧮 METHODOLOGICAL CONSIDERATIONS");
        
        if (tree1_method !== tree2_method) {
          output.push(`• Trees built with different methods (${tree1_method} vs ${tree2_method})`);
          output.push("• Method differences may contribute to topological variation");
        } else {
          output.push(`• Both trees built with ${tree1_method}`);
          output.push("• Differences reflect data variation, not method artifacts");
        }
        
        if (result.tree1_info.leaves !== result.tree2_info.leaves) {
          output.push("• Trees have different numbers of taxa");
          output.push("• Only shared taxa can be compared");
        }

        // Recommendations
        output.push("");
        output.push("💡 RECOMMENDATIONS");
        
        if (result.comparison_metrics.normalized_rf_distance > 0.5) {
          output.push("• Significant topological differences detected");
          output.push("• Consider additional taxa or alternative methods");
          output.push("• Examine conflicting signal in data");
        }
        
        if (result.branch_length_comparison && result.branch_length_comparison.correlation < 0.5) {
          output.push("• Branch lengths poorly correlated");
          output.push("• Check for rate variation or model violations");
        }
        
        if (result.comparison_metrics.topological_similarity < 0.7) {
          output.push("• Low topological congruence");
          output.push("• Bootstrap analysis recommended");
          output.push("• Consider consensus methods");
        } else {
          output.push("• Good topological congruence");
          output.push("• Trees largely support same relationships");
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
              text: `❌ Error comparing phylogenetic trees: ${error}`,
            },
          ],
        };
      }
    }
  );
}
