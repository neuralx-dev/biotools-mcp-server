/**
 * DNA sequence analysis MCP tools
 * Chapter 3: Basic DNA sequence analysis
 */

import { 
  analyzeGCContent,
  findRestrictionSites,
  predictORFs,
  assembleFragments,
  AssemblyFragment
} from "../utils/dna-analysis.js";
import { 
  analyzeGCContentSchema,
  findRestrictionSitesSchema,
  predictORFsSchema,
  assembleFragmentsSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerDNAAnalysisTools(server: McpServer) {
  
  // Tool 1: Analyze GC Content
  server.tool(
    "analyze_gc_content",
    "Calculate GC percentage and nucleotide composition of a DNA sequence",
    analyzeGCContentSchema,
    async ({ sequence }) => {
      try {
        const result = analyzeGCContent(sequence);
        
        const output = [
          `=== GC CONTENT ANALYSIS ===`,
          "",
          "📊 SEQUENCE COMPOSITION",
          `Sequence Length: ${result.sequence_length.toLocaleString()} bp`,
          `GC Content: ${result.gc_content.toFixed(4)} (${result.gc_percentage})`,
          `AT Content: ${result.at_content.toFixed(4)} (${result.at_percentage})`,
          "",
          "🧬 NUCLEOTIDE COUNTS",
          `A (Adenine): ${result.composition.A} (${(result.composition.A / result.sequence_length * 100).toFixed(2)}%)`,
          `T (Thymine): ${result.composition.T} (${(result.composition.T / result.sequence_length * 100).toFixed(2)}%)`,
          `G (Guanine): ${result.composition.G} (${(result.composition.G / result.sequence_length * 100).toFixed(2)}%)`,
          `C (Cytosine): ${result.composition.C} (${(result.composition.C / result.sequence_length * 100).toFixed(2)}%)`,
          result.composition.N > 0 ? `N (Ambiguous): ${result.composition.N}` : "",
          result.composition.others > 0 ? `Other characters: ${result.composition.others}` : "",
          "",
          "📈 COMPOSITIONAL BIAS",
          `GC Skew: ${result.gc_skew} [(G-C)/(G+C)]`,
          `AT Skew: ${result.at_skew} [(A-T)/(A+T)]`,
          "",
          "🔬 SEQUENCE CHARACTERISTICS",
          result.gc_content > 0.6 ? "• High GC content (>60%) - typical of prokaryotes" : 
          result.gc_content < 0.4 ? "• Low GC content (<40%) - typical of AT-rich regions" :
          "• Moderate GC content (40-60%) - typical of eukaryotic coding regions",
          
          Math.abs(result.gc_skew) > 0.1 ? `• Significant GC skew detected (${result.gc_skew > 0 ? 'G-rich' : 'C-rich'})` : "",
          Math.abs(result.at_skew) > 0.1 ? `• Significant AT skew detected (${result.at_skew > 0 ? 'A-rich' : 'T-rich'})` : ""
        ].filter(line => line !== "").join('\n');
        
        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error analyzing GC content: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: Find Restriction Sites
  server.tool(
    "find_restriction_sites",
    "Identify restriction enzyme cut sites in DNA sequence using REBASE database motifs",
    findRestrictionSitesSchema,
    async ({ sequence, enzymes, include_fragment_analysis = true }) => {
      try {
        const result = findRestrictionSites(sequence, enzymes);
        
        const output = [
          `=== RESTRICTION ENZYME ANALYSIS ===`,
          "",
          "📊 SUMMARY",
          `Sequence Length: ${result.sequence_length.toLocaleString()} bp`,
          `Total Restriction Sites: ${result.total_sites}`,
          `Enzymes with Sites: ${Object.keys(result.sites_by_enzyme).length}`,
          `Enzymes with No Sites: ${result.enzymes_with_no_sites.length}`,
          ""
        ];

        // Sites by enzyme
        if (Object.keys(result.sites_by_enzyme).length > 0) {
          output.push("🔪 RESTRICTION SITES FOUND");
          for (const [enzyme, sites] of Object.entries(result.sites_by_enzyme)) {
            output.push(`\n${enzyme} (${sites[0].pattern}) - ${sites.length} site(s):`);
            sites.forEach((site, index) => {
              output.push(`  ${index + 1}. Position ${site.position} - ${site.cut_site}`);
              output.push(`     Context: ...${site.sequence_context}...`);
            });
          }
          output.push("");
        }

        // Fragment analysis
        if (include_fragment_analysis && result.fragment_analysis.length > 0) {
          output.push("📏 FRAGMENT ANALYSIS");
          result.fragment_analysis.forEach(analysis => {
            output.push(`\n${analysis.enzyme}:`);
            output.push(`  Fragments: ${analysis.fragments}`);
            output.push(`  Sizes (bp): ${analysis.fragment_sizes.join(', ')}`);
            if (analysis.fragment_sizes.length > 1) {
              const minSize = Math.min(...analysis.fragment_sizes);
              const maxSize = Math.max(...analysis.fragment_sizes);
              const avgSize = analysis.fragment_sizes.reduce((a, b) => a + b, 0) / analysis.fragment_sizes.length;
              output.push(`  Range: ${minSize} - ${maxSize} bp (avg: ${avgSize.toFixed(0)} bp)`);
            }
          });
          output.push("");
        }

        // Enzymes with no sites
        if (result.enzymes_with_no_sites.length > 0) {
          output.push("❌ ENZYMES WITH NO SITES");
          output.push(result.enzymes_with_no_sites.join(', '));
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
              text: `❌ Error finding restriction sites: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 3: Predict ORFs
  server.tool(
    "predict_orfs",
    "Scan all 6 reading frames for start/stop codons to detect open reading frames (ORFs)",
    predictORFsSchema,
    async ({ sequence, min_length = 100, show_sequences = false }) => {
      try {
        const result = predictORFs(sequence, min_length);
        
        const output = [
          `=== OPEN READING FRAME ANALYSIS ===`,
          "",
          "📊 SUMMARY",
          `Sequence Length: ${result.sequence_length.toLocaleString()} bp`,
          `Total ORFs Found: ${result.orfs_found}`,
          `ORFs ≥${min_length} bp: ${result.orfs_found}`,
          `ORFs ≥300 bp: ${result.orfs_above_threshold.length}`,
          ""
        ];

        // Longest ORF
        if (result.longest_orf) {
          const orf = result.longest_orf;
          output.push("🏆 LONGEST ORF");
          output.push(`Frame: ${orf.frame > 0 ? '+' : ''}${orf.frame}`);
          output.push(`Position: ${orf.start} - ${orf.end}`);
          output.push(`Length: ${orf.length} bp (${Math.floor(orf.length / 3)} amino acids)`);
          output.push(`GC Content: ${orf.gc_content}%`);
          output.push(`Start/Stop: ${orf.start_codon} / ${orf.stop_codon}`);
          if (show_sequences && orf.amino_acid_sequence.length <= 100) {
            output.push(`Protein: ${orf.amino_acid_sequence}`);
          }
          output.push("");
        }

        // ORFs by frame
        output.push("🧬 ORFs BY READING FRAME");
        result.orfs_by_frame.forEach(frameData => {
          output.push(`\nFrame ${frameData.frame > 0 ? '+' : ''}${frameData.frame}: ${frameData.orfs.length} ORF(s)`);
          
          if (frameData.orfs.length > 0) {
            // Show top 5 ORFs per frame
            const topORFs = frameData.orfs
              .sort((a, b) => b.length - a.length)
              .slice(0, 5);
            
            topORFs.forEach((orf, index) => {
              output.push(`  ${index + 1}. ${orf.start}-${orf.end} (${orf.length} bp, GC: ${orf.gc_content}%)`);
              if (show_sequences && orf.amino_acid_sequence.length <= 50) {
                output.push(`     ${orf.amino_acid_sequence}`);
              }
            });
            
            if (frameData.orfs.length > 5) {
              output.push(`     ... and ${frameData.orfs.length - 5} more ORFs`);
            }
          }
        });

        // Significant ORFs
        if (result.orfs_above_threshold.length > 0) {
          output.push("\n⭐ SIGNIFICANT ORFs (≥300 bp)");
          const sortedORFs = result.orfs_above_threshold
            .sort((a, b) => b.length - a.length)
            .slice(0, 10);

          sortedORFs.forEach((orf, index) => {
            output.push(`${index + 1}. Frame ${orf.frame > 0 ? '+' : ''}${orf.frame}: ${orf.start}-${orf.end}`);
            output.push(`   Length: ${orf.length} bp (${Math.floor(orf.length / 3)} aa), GC: ${orf.gc_content}%`);
            if (show_sequences && orf.amino_acid_sequence.length <= 100) {
              output.push(`   Protein: ${orf.amino_acid_sequence}`);
            }
          });
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
              text: `❌ Error predicting ORFs: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 4: Assemble Fragments
  server.tool(
    "assemble_fragments",
    "Assemble short DNA sequences into one using overlap-based merging",
    assembleFragmentsSchema,
    async ({ fragments, min_overlap = 10, show_assembly = true }) => {
      try {
        // Parse fragment input
        const assemblyFragments: AssemblyFragment[] = fragments.map((frag, index) => ({
          id: frag.id || `fragment_${index + 1}`,
          sequence: frag.sequence.toUpperCase().replace(/\s+/g, ''),
          length: frag.sequence.length
        }));

        const result = assembleFragments(assemblyFragments, min_overlap);
        
        const output = [
          `=== DNA FRAGMENT ASSEMBLY ===`,
          "",
          "📊 ASSEMBLY SUMMARY",
          `Input Fragments: ${result.input_fragments}`,
          `Assembled Length: ${result.assembled_length.toLocaleString()} bp`,
          `Overlaps Used: ${result.overlaps_used.length}`,
          `Assembly Coverage: ${(result.assembly_statistics.coverage * 100).toFixed(1)}%`,
          `Gaps Remaining: ${result.assembly_statistics.gaps}`,
          result.assembly_statistics.ambiguous_bases > 0 ? 
            `Ambiguous Bases: ${result.assembly_statistics.ambiguous_bases}` : "",
          ""
        ];

        // Input fragments info
        output.push("📋 INPUT FRAGMENTS");
        assemblyFragments.forEach((frag, index) => {
          output.push(`${index + 1}. ${frag.id}: ${frag.length} bp`);
        });
        output.push("");

        // Overlaps used
        if (result.overlaps_used.length > 0) {
          output.push("🔗 OVERLAPS DETECTED");
          result.overlaps_used.forEach((overlap, index) => {
            output.push(`${index + 1}. ${overlap.fragment1} → ${overlap.fragment2}`);
            output.push(`   Overlap: ${overlap.overlap_length} bp (score: ${overlap.score})`);
            output.push(`   Sequence: ${overlap.overlap_sequence}`);
          });
          output.push("");
        }

        // Assembly statistics
        if (result.assembly_statistics.gaps > 0) {
          output.push("⚠️  ASSEMBLY ISSUES");
          output.push(`${result.assembly_statistics.gaps} fragment(s) could not be assembled due to insufficient overlap`);
          output.push("");
        }

        // Show assembled sequence
        if (show_assembly && result.assembled_sequence) {
          output.push("🧬 ASSEMBLED SEQUENCE");
          if (result.assembled_length <= 500) {
            // Show full sequence for short assemblies
            const formattedSeq = result.assembled_sequence.match(/.{1,60}/g)?.join('\n') || result.assembled_sequence;
            output.push(formattedSeq);
          } else {
            // Show first and last 100 bp for long assemblies
            const start = result.assembled_sequence.substring(0, 100);
            const end = result.assembled_sequence.substring(result.assembled_length - 100);
            output.push(`First 100 bp: ${start}`);
            output.push(`... [${(result.assembled_length - 200).toLocaleString()} bp omitted] ...`);
            output.push(`Last 100 bp:  ${end}`);
          }
        }

        return {
          content: [
            {
              type: "text",
              text: output.filter(line => line !== "").join('\n'),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error assembling fragments: ${error}`,
            },
          ],
        };
      }
    }
  );
}
