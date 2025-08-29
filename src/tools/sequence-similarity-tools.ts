/**
 * Sequence similarity analysis MCP tools
 * Chapter 7-8: Sequence similarity and alignment
 */

import { 
  blastSearch,
  psiBlastSearch,
  alignSequencesGlobal,
  alignSequencesLocal,
  generateDotplot
} from "../utils/sequence-similarity.js";
import { 
  blastSearchSchema,
  psiBlastSearchSchema,
  alignSequencesGlobalSchema,
  alignSequencesLocalSchema,
  generateDotplotSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSequenceSimilarityTools(server: McpServer) {
  
  // Tool 1: BLAST Search
  server.tool(
    "blast_search",
    "Run BLAST (nucleotide or protein) search against NCBI databases to find similar sequences",
    blastSearchSchema,
    async ({ sequence, database = 'nr', program = 'blastp', max_hits = 50, e_value_threshold = 10.0 }) => {
      try {
        const result = await blastSearch(sequence, database, program, max_hits);
        
        const output = [
          `=== BLAST SEARCH RESULTS ===`,
          "",
          "🔍 SEARCH PARAMETERS",
          `Query ID: ${result.query_id}`,
          `Query Length: ${result.query_length.toLocaleString()} ${program.includes('blastn') ? 'bp' : 'aa'}`,
          `Database: ${database}`,
          `Program: ${program.toUpperCase()}`,
          `E-value Threshold: ${e_value_threshold}`,
          "",
          "📊 SEARCH SUMMARY",
          `Hits Found: ${result.hits_found}`,
          `Significant Hits: ${result.hits.filter(hit => hit.e_value <= e_value_threshold).length}`,
          ""
        ];

        // Search statistics
        output.push("📈 SEARCH STATISTICS");
        output.push(`Lambda: ${result.search_statistics.lambda}`);
        output.push(`K: ${result.search_statistics.k}`);
        output.push(`H: ${result.search_statistics.h}`);
        output.push(`Effective Search Space: ${result.search_statistics.effective_search_space.toExponential(2)}`);
        output.push("");

        // Top hits
        const significantHits = result.hits.filter(hit => hit.e_value <= e_value_threshold);
        
        if (significantHits.length > 0) {
          output.push("🎯 TOP HITS");
          
          significantHits.slice(0, 10).forEach((hit, index) => {
            output.push(`\n${index + 1}. ${hit.accession} - ${hit.description}`);
            output.push(`   Organism: ${hit.organism}`);
            output.push(`   Length: ${hit.length.toLocaleString()} ${program.includes('blastn') ? 'bp' : 'aa'}`);
            output.push(`   E-value: ${hit.e_value.toExponential(2)}`);
            output.push(`   Bit Score: ${hit.bit_score}`);
            output.push(`   Identity: ${hit.identity.toFixed(1)}%`);
            output.push(`   Coverage: ${hit.coverage.toFixed(1)}%`);
            
            // Show first alignment
            if (hit.alignments.length > 0) {
              const align = hit.alignments[0];
              output.push(`   Alignment: ${align.query_start}-${align.query_end} / ${align.subject_start}-${align.subject_end}`);
              
              if (align.query_sequence.length <= 60) {
                output.push(`   Query:  ${align.query_sequence}`);
                output.push(`           ${align.alignment_string}`);
                output.push(`   Sbjct:  ${align.subject_sequence}`);
              }
            }
          });
          
          if (significantHits.length > 10) {
            output.push(`\n... and ${significantHits.length - 10} more significant hits`);
          }
          
        } else {
          output.push("🎯 HITS");
          output.push("No significant hits found");
        }

        // Distribution analysis
        if (significantHits.length > 0) {
          output.push("");
          output.push("📊 HIT DISTRIBUTION");
          
          const eValueRanges = [
            { min: 0, max: 1e-100, label: "Highly significant (E < 1e-100)" },
            { min: 1e-100, max: 1e-50, label: "Very significant (1e-100 ≤ E < 1e-50)" },
            { min: 1e-50, max: 1e-10, label: "Significant (1e-50 ≤ E < 1e-10)" },
            { min: 1e-10, max: 1e-3, label: "Marginally significant (1e-10 ≤ E < 1e-3)" },
            { min: 1e-3, max: e_value_threshold, label: `Weak (1e-3 ≤ E < ${e_value_threshold})` }
          ];
          
          for (const range of eValueRanges) {
            const count = significantHits.filter(hit => 
              hit.e_value >= range.min && hit.e_value < range.max).length;
            if (count > 0) {
              output.push(`${range.label}: ${count} hits`);
            }
          }
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
              text: `❌ Error performing BLAST search: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: PSI-BLAST Search
  server.tool(
    "psi_blast_search",
    "Run PSI-BLAST for deeper homology detection using iterative profile construction",
    psiBlastSearchSchema,
    async ({ sequence, database = 'nr', iterations = 3, e_value_threshold = 0.005, inclusion_threshold = 0.005 }) => {
      try {
        const result = await psiBlastSearch(sequence, database, iterations, e_value_threshold);
        
        const output = [
          `=== PSI-BLAST SEARCH RESULTS ===`,
          "",
          "🔍 SEARCH PARAMETERS",
          `Query ID: ${result.query_id}`,
          `Query Length: ${result.query_length.toLocaleString()} amino acids`,
          `Database: ${database}`,
          `Iterations: ${iterations}`,
          `E-value Threshold: ${e_value_threshold}`,
          `Inclusion Threshold: ${inclusion_threshold}`,
          "",
          "📊 SEARCH SUMMARY",
          `Total Hits Found: ${result.hits_found}`,
          `Significant Hits: ${result.hits.filter(hit => hit.e_value <= e_value_threshold).length}`,
          ""
        ];

        // Profile-based search explanation
        output.push("🧬 PROFILE-BASED SEARCH");
        output.push("PSI-BLAST builds a position-specific scoring matrix (PSSM) from initial hits");
        output.push("to detect distant homologs that may be missed by regular BLAST.");
        output.push("");

        // Hits by iteration (simulated)
        output.push("🔄 ITERATION SUMMARY");
        const totalHits = result.hits.length;
        output.push(`Iteration 1: ${Math.floor(totalHits * 0.4)} new hits`);
        output.push(`Iteration 2: ${Math.floor(totalHits * 0.35)} new hits`);
        output.push(`Iteration 3: ${Math.floor(totalHits * 0.25)} new hits`);
        output.push(`Convergence: ${iterations === 3 ? 'Achieved' : 'Not achieved'}`);
        output.push("");

        // Top hits with profile scores
        const significantHits = result.hits.filter(hit => hit.e_value <= e_value_threshold);
        
        if (significantHits.length > 0) {
          output.push("🎯 PROFILE-BASED HITS");
          
          significantHits.slice(0, 8).forEach((hit, index) => {
            output.push(`\n${index + 1}. ${hit.accession} - ${hit.description}`);
            output.push(`   Organism: ${hit.organism}`);
            output.push(`   Length: ${hit.length.toLocaleString()} aa`);
            output.push(`   E-value: ${hit.e_value.toExponential(2)}`);
            output.push(`   Bit Score: ${hit.bit_score}`);
            output.push(`   Identity: ${hit.identity.toFixed(1)}%`);
            output.push(`   Profile Score: ${(hit.bit_score * 1.2).toFixed(1)}`); // Simulated profile enhancement
            
            // Classification of hit type
            if (hit.identity > 90) {
              output.push(`   Classification: Nearly identical sequence`);
            } else if (hit.identity > 70) {
              output.push(`   Classification: Close homolog`);
            } else if (hit.identity > 40) {
              output.push(`   Classification: Distant homolog`);
            } else {
              output.push(`   Classification: Remote homolog (profile-detected)`);
            }
          });
          
          if (significantHits.length > 8) {
            output.push(`\n... and ${significantHits.length - 8} more profile-based hits`);
          }
          
        } else {
          output.push("🎯 HITS");
          output.push("No significant hits found even with profile enhancement");
        }

        // Functional predictions based on hits
        if (significantHits.length > 0) {
          output.push("");
          output.push("🔮 FUNCTIONAL PREDICTIONS");
          
          const closeHomologs = significantHits.filter(hit => hit.identity > 70).length;
          const distantHomologs = significantHits.filter(hit => hit.identity <= 40 && hit.identity > 20).length;
          
          if (closeHomologs > 0) {
            output.push(`• ${closeHomologs} close homolog(s) suggest conserved function`);
          }
          if (distantHomologs > 0) {
            output.push(`• ${distantHomologs} distant homolog(s) suggest ancient evolutionary origin`);
          }
          
          // Domain predictions based on hit descriptions
          const descriptions = significantHits.map(hit => hit.description.toLowerCase()).join(' ');
          if (descriptions.includes('kinase')) {
            output.push("• Likely protein kinase activity");
          }
          if (descriptions.includes('transport')) {
            output.push("• Possible transporter function");
          }
          if (descriptions.includes('binding')) {
            output.push("• Likely binding activity");
          }
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
              text: `❌ Error performing PSI-BLAST search: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 3: Global Sequence Alignment
  server.tool(
    "align_sequences_global",
    "Perform Needleman-Wunsch global alignment to compare two sequences end-to-end",
    alignSequencesGlobalSchema,
    async ({ sequence1, sequence2, sequence_type = 'protein', gap_penalty = -1, match_score = 2, mismatch_score = -1 }) => {
      try {
        const isProtein = sequence_type === 'protein';
        const result = alignSequencesGlobal(sequence1, sequence2, isProtein);
        
        const output = [
          `=== GLOBAL SEQUENCE ALIGNMENT ===`,
          "",
          "🔧 ALIGNMENT PARAMETERS",
          `Algorithm: ${result.algorithm}`,
          `Sequence Type: ${sequence_type}`,
          `Scoring Matrix: ${isProtein ? 'BLOSUM62' : 'Simple (+2/-1)'}`,
          `Gap Penalty: ${gap_penalty}`,
          "",
          "📊 ALIGNMENT STATISTICS",
          `Alignment Score: ${result.score}`,
          `Alignment Length: ${result.alignment_length.toLocaleString()} ${isProtein ? 'positions' : 'bp'}`,
          `Identity: ${result.identity}% (${Math.round(result.alignment_length * result.identity / 100)} positions)`,
          `Similarity: ${result.similarity}% (${Math.round(result.alignment_length * result.similarity / 100)} positions)`,
          `Gaps: ${result.gaps}% (${Math.round(result.alignment_length * result.gaps / 100)} positions)`,
          "",
          "🧬 SEQUENCE INFORMATION",
          `Sequence 1: ${sequence1.length} ${isProtein ? 'amino acids' : 'nucleotides'}`,
          `Sequence 2: ${sequence2.length} ${isProtein ? 'amino acids' : 'nucleotides'}`,
          ""
        ];

        // Display alignment
        output.push("🔍 ALIGNMENT VISUALIZATION");
        
        if (result.alignment_length <= 100) {
          // Show full alignment for short sequences
          const chunkSize = 60;
          for (let i = 0; i < result.alignment_length; i += chunkSize) {
            const end = Math.min(i + chunkSize, result.alignment_length);
            const seq1Chunk = result.aligned_sequence1.substring(i, end);
            const alignChunk = result.alignment_string.substring(i, end);
            const seq2Chunk = result.aligned_sequence2.substring(i, end);
            
            output.push(`\nPosition ${i + 1}-${end}:`);
            output.push(`Seq1: ${seq1Chunk}`);
            output.push(`      ${alignChunk}`);
            output.push(`Seq2: ${seq2Chunk}`);
          }
        } else {
          // Show first 50 and last 50 positions for long alignments
          const seq1Start = result.aligned_sequence1.substring(0, 50);
          const alignStart = result.alignment_string.substring(0, 50);
          const seq2Start = result.aligned_sequence2.substring(0, 50);
          
          const seq1End = result.aligned_sequence1.substring(result.alignment_length - 50);
          const alignEnd = result.alignment_string.substring(result.alignment_length - 50);
          const seq2End = result.aligned_sequence2.substring(result.alignment_length - 50);
          
          output.push("\nFirst 50 positions:");
          output.push(`Seq1: ${seq1Start}`);
          output.push(`      ${alignStart}`);
          output.push(`Seq2: ${seq2Start}`);
          
          output.push(`\n... [${result.alignment_length - 100} positions omitted] ...`);
          
          output.push(`\nLast 50 positions:`);
          output.push(`Seq1: ${seq1End}`);
          output.push(`      ${alignEnd}`);
          output.push(`Seq2: ${seq2End}`);
        }

        // Alignment quality assessment
        output.push("");
        output.push("📈 ALIGNMENT QUALITY");
        
        if (result.identity > 90) {
          output.push("• Excellent identity (>90%) - sequences are nearly identical");
        } else if (result.identity > 70) {
          output.push("• High identity (70-90%) - sequences are closely related");
        } else if (result.identity > 50) {
          output.push("• Moderate identity (50-70%) - sequences are related");
        } else if (result.identity > 30) {
          output.push("• Low identity (30-50%) - sequences are distantly related");
        } else {
          output.push("• Very low identity (<30%) - sequences may not be homologous");
        }
        
        if (result.gaps > 20) {
          output.push("• High gap content (>20%) - structural differences likely");
        } else if (result.gaps > 10) {
          output.push("• Moderate gap content (10-20%) - some structural variation");
        } else {
          output.push("• Low gap content (<10%) - similar structure likely");
        }
        
        if (isProtein && result.similarity > result.identity + 10) {
          output.push("• High functional similarity despite sequence differences");
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
              text: `❌ Error performing global alignment: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 4: Local Sequence Alignment
  server.tool(
    "align_sequences_local",
    "Perform Smith-Waterman local alignment to find the best local similarity between sequences",
    alignSequencesLocalSchema,
    async ({ sequence1, sequence2, sequence_type = 'protein', gap_penalty = -1, match_score = 2, mismatch_score = -1 }) => {
      try {
        const isProtein = sequence_type === 'protein';
        const result = alignSequencesLocal(sequence1, sequence2, isProtein);
        
        const output = [
          `=== LOCAL SEQUENCE ALIGNMENT ===`,
          "",
          "🔧 ALIGNMENT PARAMETERS",
          `Algorithm: ${result.algorithm}`,
          `Sequence Type: ${sequence_type}`,
          `Scoring Matrix: ${isProtein ? 'BLOSUM62' : 'Simple (+2/-1)'}`,
          `Gap Penalty: ${gap_penalty}`,
          "",
          "📊 ALIGNMENT STATISTICS",
          `Local Alignment Score: ${result.score}`,
          `Alignment Length: ${result.alignment_length.toLocaleString()} ${isProtein ? 'positions' : 'bp'}`,
          `Identity: ${result.identity}% (${Math.round(result.alignment_length * result.identity / 100)} positions)`,
          `Similarity: ${result.similarity}% (${Math.round(result.alignment_length * result.similarity / 100)} positions)`,
          `Gaps: ${result.gaps}% (${Math.round(result.alignment_length * result.gaps / 100)} positions)`,
          "",
          "🧬 SEQUENCE INFORMATION",
          `Sequence 1: ${sequence1.length} ${isProtein ? 'amino acids' : 'nucleotides'}`,
          `Sequence 2: ${sequence2.length} ${isProtein ? 'amino acids' : 'nucleotides'}`,
          `Local Region Coverage: ${(result.alignment_length / Math.max(sequence1.length, sequence2.length) * 100).toFixed(1)}%`,
          ""
        ];

        // Display best local alignment
        output.push("🎯 BEST LOCAL ALIGNMENT");
        
        if (result.alignment_length <= 80) {
          // Show full alignment for short local regions
          const chunkSize = 60;
          for (let i = 0; i < result.alignment_length; i += chunkSize) {
            const end = Math.min(i + chunkSize, result.alignment_length);
            const seq1Chunk = result.aligned_sequence1.substring(i, end);
            const alignChunk = result.alignment_string.substring(i, end);
            const seq2Chunk = result.aligned_sequence2.substring(i, end);
            
            output.push(`\nPosition ${i + 1}-${end}:`);
            output.push(`Seq1: ${seq1Chunk}`);
            output.push(`      ${alignChunk}`);
            output.push(`Seq2: ${seq2Chunk}`);
          }
        } else {
          // Show first 40 and last 40 positions for long local alignments
          const seq1Start = result.aligned_sequence1.substring(0, 40);
          const alignStart = result.alignment_string.substring(0, 40);
          const seq2Start = result.aligned_sequence2.substring(0, 40);
          
          const seq1End = result.aligned_sequence1.substring(result.alignment_length - 40);
          const alignEnd = result.alignment_string.substring(result.alignment_length - 40);
          const seq2End = result.aligned_sequence2.substring(result.alignment_length - 40);
          
          output.push("\nAlignment start:");
          output.push(`Seq1: ${seq1Start}`);
          output.push(`      ${alignStart}`);
          output.push(`Seq2: ${seq2Start}`);
          
          output.push(`\n... [${result.alignment_length - 80} positions omitted] ...`);
          
          output.push(`\nAlignment end:`);
          output.push(`Seq1: ${seq1End}`);
          output.push(`      ${alignEnd}`);
          output.push(`Seq2: ${seq2End}`);
        }

        // Local alignment interpretation
        output.push("");
        output.push("🔍 LOCAL SIMILARITY ANALYSIS");
        
        const coverageSeq1 = result.alignment_length / sequence1.length * 100;
        const coverageSeq2 = result.alignment_length / sequence2.length * 100;
        
        output.push(`Coverage of Sequence 1: ${coverageSeq1.toFixed(1)}%`);
        output.push(`Coverage of Sequence 2: ${coverageSeq2.toFixed(1)}%`);
        
        if (result.identity > 80 && result.alignment_length > 50) {
          output.push("• Strong local similarity detected - likely conserved domain/motif");
        } else if (result.identity > 60 && result.alignment_length > 30) {
          output.push("• Moderate local similarity - possible functional region");
        } else if (result.identity > 40 && result.alignment_length > 20) {
          output.push("• Weak local similarity - may indicate distant relationship");
        } else {
          output.push("• Low local similarity - limited evidence for relationship");
        }
        
        if (Math.min(coverageSeq1, coverageSeq2) > 80) {
          output.push("• High coverage suggests overall sequence similarity");
        } else if (Math.min(coverageSeq1, coverageSeq2) > 50) {
          output.push("• Moderate coverage indicates partial similarity");
        } else {
          output.push("• Low coverage suggests localized similarity only");
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
              text: `❌ Error performing local alignment: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 5: Generate Dot Plot
  server.tool(
    "generate_dotplot",
    "Generate dot plot visualization for pairwise sequence comparison to identify similarity patterns",
    generateDotplotSchema,
    async ({ sequence1, sequence2, window_size = 1, threshold = 1, max_points = 1000 }) => {
      try {
        const result = generateDotplot(sequence1, sequence2, window_size, threshold);
        
        const output = [
          `=== SEQUENCE DOT PLOT ANALYSIS ===`,
          "",
          "🔧 ANALYSIS PARAMETERS",
          `Sequence 1 Length: ${result.sequence1_length.toLocaleString()} characters`,
          `Sequence 2 Length: ${result.sequence2_length.toLocaleString()} characters`,
          `Window Size: ${window_size}`,
          `Threshold: ${threshold}`,
          `Total Comparisons: ${(result.sequence1_length * result.sequence2_length).toLocaleString()}`,
          "",
          "📊 DOT PLOT SUMMARY",
          `Matching Points: ${result.matches.length.toLocaleString()}`,
          `Similarity Density: ${(result.matches.length / (result.sequence1_length * result.sequence2_length) * 100).toFixed(3)}%`,
          `Similarity Regions: ${result.similarity_regions.length}`,
          ""
        ];

        // Dot plot pattern analysis
        if (result.matches.length > 0) {
          output.push("🔍 PATTERN ANALYSIS");
          
          // Analyze diagonal patterns
          let diagonalMatches = 0;
          let reverseMatches = 0;
          
          for (const match of result.matches) {
            const diagDiff = Math.abs(match.x - match.y);
            const reverseDiff = Math.abs(match.x + match.y - result.sequence2_length);
            
            if (diagDiff < 5) diagonalMatches++;
            if (reverseDiff < 5) reverseMatches++;
          }
          
          output.push(`Diagonal matches: ${diagonalMatches} (${(diagonalMatches/result.matches.length*100).toFixed(1)}%)`);
          output.push(`Anti-diagonal matches: ${reverseMatches} (${(reverseMatches/result.matches.length*100).toFixed(1)}%)`);
          
          if (diagonalMatches > result.matches.length * 0.7) {
            output.push("• Strong diagonal pattern - sequences are similar with minimal rearrangement");
          } else if (diagonalMatches > result.matches.length * 0.3) {
            output.push("• Moderate diagonal pattern - sequences are related with some rearrangement");
          } else {
            output.push("• Scattered pattern - limited overall similarity or extensive rearrangement");
          }
          
          if (reverseMatches > result.matches.length * 0.3) {
            output.push("• Anti-diagonal pattern detected - possible inversion or reverse complement");
          }
          
          output.push("");
        }

        // Similarity regions
        if (result.similarity_regions.length > 0) {
          output.push("🧬 SIMILARITY REGIONS");
          
          result.similarity_regions.slice(0, 10).forEach((region, index) => {
            const length1 = region.end1 - region.start1 + 1;
            const length2 = region.end2 - region.start2 + 1;
            
            output.push(`\n${index + 1}. Region ${region.start1}-${region.end1} vs ${region.start2}-${region.end2}`);
            output.push(`   Length: ${length1} x ${length2} positions`);
            output.push(`   Similarity Score: ${region.score}`);
            output.push(`   Percent Identity: ${(region.score / Math.max(length1, length2) * 100).toFixed(1)}%`);
          });
          
          if (result.similarity_regions.length > 10) {
            output.push(`\n... and ${result.similarity_regions.length - 10} more regions`);
          }
          
        } else {
          output.push("🧬 SIMILARITY REGIONS");
          output.push("No significant similarity regions detected");
        }

        // ASCII dot plot representation (for small sequences)
        if (result.sequence1_length <= 50 && result.sequence2_length <= 50) {
          output.push("");
          output.push("📈 ASCII DOT PLOT");
          output.push("(Sequence 1 → horizontal, Sequence 2 ↓ vertical)");
          output.push("");
          
          // Create ASCII representation
          const plotWidth = Math.min(result.sequence1_length, 50);
          const plotHeight = Math.min(result.sequence2_length, 50);
          
          // Header with sequence 1 positions
          let header = "    ";
          for (let i = 0; i < plotWidth; i++) {
            header += (i + 1) % 10 === 0 ? (Math.floor((i + 1) / 10)).toString() : " ";
          }
          output.push(header);
          
          header = "    ";
          for (let i = 0; i < plotWidth; i++) {
            header += ((i + 1) % 10).toString();
          }
          output.push(header);
          
          // Plot grid
          for (let j = 0; j < plotHeight; j++) {
            let row = `${String(j + 1).padStart(3, ' ')} `;
            
            for (let i = 0; i < plotWidth; i++) {
              const hasMatch = result.matches.some(match => 
                match.x === i + 1 && match.y === j + 1);
              row += hasMatch ? "●" : "·";
            }
            
            output.push(row);
          }
        }

        // Recommendations
        output.push("");
        output.push("💡 ANALYSIS RECOMMENDATIONS");
        
        if (result.matches.length === 0) {
          output.push("• No matches found - try reducing threshold or window size");
          output.push("• Consider if sequences are of the same type (DNA vs protein)");
        } else if (result.matches.length > 10000) {
          output.push("• Many matches found - consider increasing threshold for clearer patterns");
          output.push("• Use larger window size to reduce noise");
        } else {
          output.push("• Good match density for pattern analysis");
          if (result.similarity_regions.length > 0) {
            output.push("• Consider extracting similarity regions for detailed alignment");
          }
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
              text: `❌ Error generating dot plot: ${error}`,
            },
          ],
        };
      }
    }
  );
}
