/**
 * Multiple sequence alignment MCP tools
 * Chapter 9-10: Multiple alignments and editing
 */

import { 
  multipleSequenceAlignment,
  highlightConservedRegions,
  generateSequenceLogo,
  exportAlignment,
  SequenceRecord
} from "../utils/multiple-alignment.js";
import { 
  multipleSequenceAlignmentSchema,
  highlightConservedRegionsSchema,
  generateSequenceLogoSchema,
  exportAlignmentSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerMultipleAlignmentTools(server: McpServer) {
  
  // Tool 1: Multiple Sequence Alignment
  server.tool(
    "multiple_sequence_alignment",
    "Align 2-8 protein or nucleotide sequences using progressive alignment algorithms",
    multipleSequenceAlignmentSchema,
    async ({ sequences, sequence_type = 'protein', gap_penalty = -1 }) => {
      try {
        if (sequences.length < 2) {
          return {
            content: [
              {
                type: "text",
                text: "❌ At least 2 sequences are required for multiple alignment",
              },
            ],
          };
        }
        
        const sequenceRecords: SequenceRecord[] = sequences.map((seq, index) => ({
          id: seq.id || `Seq${index + 1}`,
          description: seq.description,
          sequence: seq.sequence.toUpperCase().replace(/\s+/g, '')
        }));
        
        const result = multipleSequenceAlignment(sequenceRecords);
        
        const output = [
          `=== MULTIPLE SEQUENCE ALIGNMENT ===`,
          "",
          "🔧 ALIGNMENT PARAMETERS",
          `Algorithm: Progressive alignment`,
          `Sequence Type: ${sequence_type}`,
          `Gap Penalty: ${gap_penalty}`,
          `Input Sequences: ${result.sequence_count}`,
          "",
          "📊 ALIGNMENT STATISTICS",
          `Alignment Length: ${result.alignment_length.toLocaleString()} positions`,
          `Overall Identity: ${result.overall_identity}%`,
          `Conserved Positions: ${result.conserved_positions} (${(result.conserved_positions/result.alignment_length*100).toFixed(1)}%)`,
          `Gap Content: ${result.gaps_percentage}%`,
          "",
          "🧬 SEQUENCE INFORMATION"
        ];

        // Sequence details
        result.sequences.forEach((seq, index) => {
          const originalLength = seq.sequence.replace(/-/g, '').length;
          const gapCount = seq.sequence.length - originalLength;
          output.push(`${index + 1}. ${seq.id}: ${originalLength} residues, ${gapCount} gaps`);
          if (seq.description) {
            output.push(`   Description: ${seq.description}`);
          }
        });
        
        output.push("");

        // Display alignment
        output.push("🔍 ALIGNMENT VISUALIZATION");
        
        if (result.alignment_length <= 120) {
          // Show full alignment for shorter sequences
          const chunkSize = 60;
          for (let start = 0; start < result.alignment_length; start += chunkSize) {
            const end = Math.min(start + chunkSize, result.alignment_length);
            
            output.push(`\nPositions ${start + 1}-${end}:`);
            
            result.sequences.forEach(seq => {
              const chunk = seq.sequence.slice(start, end);
              output.push(`${seq.id.padEnd(12)} ${chunk}`);
            });
            
            // Conservation line
            let conservation = ' '.repeat(12);
            for (let i = start; i < end; i++) {
              const pos = result.positions[i];
              if (pos.is_conserved) {
                conservation += '*';
              } else if (pos.conservation_score > 0.7) {
                conservation += ':';
              } else if (pos.conservation_score > 0.3) {
                conservation += '.';
              } else {
                conservation += ' ';
              }
            }
            output.push(`${'Conservation'.padEnd(12)} ${conservation}`);
          }
        } else {
          // Show first 40 and last 40 positions for long alignments
          output.push("\nFirst 40 positions:");
          result.sequences.forEach(seq => {
            const chunk = seq.sequence.slice(0, 40);
            output.push(`${seq.id.padEnd(12)} ${chunk}`);
          });
          
          let conservationStart = ' '.repeat(12);
          for (let i = 0; i < 40; i++) {
            const pos = result.positions[i];
            conservationStart += pos.is_conserved ? '*' : pos.conservation_score > 0.5 ? ':' : ' ';
          }
          output.push(`${'Conservation'.padEnd(12)} ${conservationStart}`);
          
          output.push(`\n... [${result.alignment_length - 80} positions omitted] ...`);
          
          output.push("\nLast 40 positions:");
          const startPos = result.alignment_length - 40;
          result.sequences.forEach(seq => {
            const chunk = seq.sequence.slice(startPos);
            output.push(`${seq.id.padEnd(12)} ${chunk}`);
          });
          
          let conservationEnd = ' '.repeat(12);
          for (let i = startPos; i < result.alignment_length; i++) {
            const pos = result.positions[i];
            conservationEnd += pos.is_conserved ? '*' : pos.conservation_score > 0.5 ? ':' : ' ';
          }
          output.push(`${'Conservation'.padEnd(12)} ${conservationEnd}`);
        }

        // Alignment quality assessment
        output.push("");
        output.push("📈 ALIGNMENT QUALITY");
        
        if (result.overall_identity > 80) {
          output.push("• Excellent overall identity (>80%) - sequences are very similar");
        } else if (result.overall_identity > 60) {
          output.push("• Good overall identity (60-80%) - sequences are related");
        } else if (result.overall_identity > 40) {
          output.push("• Moderate overall identity (40-60%) - sequences are distantly related");
        } else if (result.overall_identity > 20) {
          output.push("• Low overall identity (20-40%) - sequences may be homologous");
        } else {
          output.push("• Very low overall identity (<20%) - alignment may not be meaningful");
        }
        
        if (result.gaps_percentage > 30) {
          output.push("• High gap content (>30%) - significant insertions/deletions");
        } else if (result.gaps_percentage > 15) {
          output.push("• Moderate gap content (15-30%) - some structural variation");
        } else {
          output.push("• Low gap content (<15%) - good structural conservation");
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
              text: `❌ Error performing multiple sequence alignment: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: Highlight Conserved Regions
  server.tool(
    "highlight_conserved_regions",
    "Find and analyze conserved regions in a multiple sequence alignment",
    highlightConservedRegionsSchema,
    async ({ alignment_sequences, min_length = 5, conservation_threshold = 0.8 }) => {
      try {
        const sequenceRecords: SequenceRecord[] = alignment_sequences.map((seq, index) => ({
          id: seq.id || `Seq${index + 1}`,
          description: seq.description,
          sequence: seq.sequence.toUpperCase()
        }));
        
        // Create alignment object
        const alignment = multipleSequenceAlignment(sequenceRecords);
        const conservedRegions = highlightConservedRegions(alignment, min_length);
        
        const output = [
          `=== CONSERVED REGIONS ANALYSIS ===`,
          "",
          "🔧 ANALYSIS PARAMETERS",
          `Sequences: ${alignment.sequence_count}`,
          `Alignment Length: ${alignment.alignment_length} positions`,
          `Minimum Region Length: ${min_length} positions`,
          `Conservation Threshold: ${conservation_threshold}`,
          "",
          "📊 CONSERVATION SUMMARY",
          `Total Conserved Regions: ${conservedRegions.length}`,
          `Highly Conserved Positions: ${alignment.positions.filter(p => p.conservation_score >= 0.9).length}`,
          `Well Conserved Positions: ${alignment.positions.filter(p => p.conservation_score >= 0.7).length}`,
          `Overall Conservation: ${alignment.overall_identity}%`,
          ""
        ];

        if (conservedRegions.length > 0) {
          output.push("🎯 CONSERVED REGIONS");
          
          conservedRegions.forEach((region, index) => {
            output.push(`\n${index + 1}. Region ${region.start}-${region.end} (${region.length} positions)`);
            output.push(`   Conservation Score: ${region.conservation_score} (${(region.conservation_score * 100).toFixed(1)}%)`);
            output.push(`   Classification: ${region.description}`);
            output.push(`   Consensus: ${region.consensus_sequence}`);
            
            // Show the region alignment
            if (region.length <= 50) {
              output.push(`   Alignment:`);
              alignment.sequences.forEach(seq => {
                const regionSeq = seq.sequence.slice(region.start - 1, region.end);
                output.push(`     ${seq.id.padEnd(12)} ${regionSeq}`);
              });
            }
          });
          
        } else {
          output.push("🎯 CONSERVED REGIONS");
          output.push("No conserved regions found with current parameters");
          output.push("");
          output.push("💡 SUGGESTIONS");
          output.push("• Try reducing minimum length or conservation threshold");
          output.push("• Check if sequences are properly aligned");
          output.push("• Consider if sequences are evolutionarily related");
        }

        // Conservation statistics by position
        output.push("");
        output.push("📈 POSITION-WISE CONSERVATION");
        
        const conservationLevels = [
          { min: 0.9, max: 1.0, label: "Highly conserved (>90%)" },
          { min: 0.7, max: 0.9, label: "Well conserved (70-90%)" },
          { min: 0.5, max: 0.7, label: "Moderately conserved (50-70%)" },
          { min: 0.3, max: 0.5, label: "Weakly conserved (30-50%)" },
          { min: 0.0, max: 0.3, label: "Variable (<30%)" }
        ];
        
        conservationLevels.forEach(level => {
          const count = alignment.positions.filter(p => 
            p.conservation_score >= level.min && p.conservation_score < level.max).length;
          if (count > 0) {
            output.push(`${level.label}: ${count} positions (${(count/alignment.alignment_length*100).toFixed(1)}%)`);
          }
        });

        // Functional predictions
        if (conservedRegions.length > 0) {
          output.push("");
          output.push("🔮 FUNCTIONAL PREDICTIONS");
          
          const longRegions = conservedRegions.filter(r => r.length >= 20);
          const mediumRegions = conservedRegions.filter(r => r.length >= 10 && r.length < 20);
          const shortRegions = conservedRegions.filter(r => r.length < 10);
          
          if (longRegions.length > 0) {
            output.push(`• ${longRegions.length} long conserved region(s) - likely functional domains`);
          }
          if (mediumRegions.length > 0) {
            output.push(`• ${mediumRegions.length} medium conserved region(s) - possible binding sites or motifs`);
          }
          if (shortRegions.length > 0) {
            output.push(`• ${shortRegions.length} short conserved region(s) - critical residues or turn regions`);
          }
          
          const highlyConservedRegions = conservedRegions.filter(r => r.conservation_score >= 0.95);
          if (highlyConservedRegions.length > 0) {
            output.push(`• ${highlyConservedRegions.length} highly conserved region(s) - essential for function`);
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
              text: `❌ Error analyzing conserved regions: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 3: Generate Sequence Logo
  server.tool(
    "generate_sequence_logo",
    "Create sequence logo data from multiple alignment to visualize conservation patterns",
    generateSequenceLogoSchema,
    async ({ alignment_sequences, include_gaps = false, information_threshold = 0.1 }) => {
      try {
        const sequenceRecords: SequenceRecord[] = alignment_sequences.map((seq, index) => ({
          id: seq.id || `Seq${index + 1}`,
          description: seq.description,
          sequence: seq.sequence.toUpperCase()
        }));
        
        const alignment = multipleSequenceAlignment(sequenceRecords);
        const logoData = generateSequenceLogo(alignment);
        
        const output = [
          `=== SEQUENCE LOGO ANALYSIS ===`,
          "",
          "🔧 LOGO PARAMETERS",
          `Sequences: ${alignment.sequence_count}`,
          `Alignment Length: ${alignment.alignment_length} positions`,
          `Include Gaps: ${include_gaps ? 'Yes' : 'No'}`,
          `Information Threshold: ${information_threshold} bits`,
          "",
          "📊 INFORMATION CONTENT SUMMARY",
          `Total Positions: ${logoData.length}`,
          `High Information Positions (>2 bits): ${logoData.filter(pos => pos.information_content > 2).length}`,
          `Medium Information Positions (1-2 bits): ${logoData.filter(pos => pos.information_content >= 1 && pos.information_content <= 2).length}`,
          `Low Information Positions (<1 bit): ${logoData.filter(pos => pos.information_content < 1).length}`,
          ""
        ];

        // Top conserved positions
        const topPositions = logoData
          .filter(pos => pos.information_content >= information_threshold)
          .sort((a, b) => b.information_content - a.information_content)
          .slice(0, 20);
        
        if (topPositions.length > 0) {
          output.push("🎯 TOP INFORMATIVE POSITIONS");
          
          topPositions.forEach((pos, index) => {
            const sortedResidues = Object.entries(pos.residue_bits)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3);
            
            output.push(`\n${index + 1}. Position ${pos.position}`);
            output.push(`   Information Content: ${pos.information_content} bits`);
            output.push(`   Top Residues:`);
            
            sortedResidues.forEach(([residue, bits]) => {
              const frequency = pos.residue_frequencies[residue] * 100;
              output.push(`     ${residue}: ${bits.toFixed(2)} bits (${frequency.toFixed(1)}%)`);
            });
          });
          
        } else {
          output.push("🎯 INFORMATIVE POSITIONS");
          output.push("No positions found above information threshold");
        }

        // Logo data representation (simplified text version)
        output.push("");
        output.push("📈 SEQUENCE LOGO REPRESENTATION");
        output.push("(Height proportional to information content)");
        output.push("");
        
        if (logoData.length <= 50) {
          // Show full logo for short alignments
          const maxHeight = Math.max(...logoData.map(pos => pos.information_content));
          const scaleFactor = 10 / maxHeight; // Scale to max height of 10
          
          for (let level = 10; level > 0; level--) {
            let line = `${level.toString().padStart(2)}: `;
            
            logoData.forEach(pos => {
              const scaledHeight = pos.information_content * scaleFactor;
              if (scaledHeight >= level) {
                // Find dominant residue at this position
                const dominantResidue = Object.entries(pos.residue_bits)
                  .sort(([,a], [,b]) => b - a)[0][0];
                line += dominantResidue;
              } else {
                line += ' ';
              }
            });
            
            output.push(line);
          }
          
          // Position numbers
          let posLine = '    ';
          logoData.forEach((pos, index) => {
            posLine += (index + 1) % 10 === 0 ? (Math.floor((index + 1) / 10)).toString() : ' ';
          });
          output.push(posLine);
          
          posLine = '    ';
          logoData.forEach((pos, index) => {
            posLine += ((index + 1) % 10).toString();
          });
          output.push(posLine);
          
        } else {
          // Show summary for long alignments
          output.push("First 25 positions:");
          const first25 = logoData.slice(0, 25);
          first25.forEach((pos, index) => {
            const dominantResidue = Object.entries(pos.residue_bits)
              .sort(([,a], [,b]) => b - a)[0];
            output.push(`Pos ${pos.position}: ${dominantResidue[0]} (${dominantResidue[1].toFixed(2)} bits)`);
          });
          
          if (logoData.length > 25) {
            output.push(`\n... and ${logoData.length - 25} more positions`);
          }
        }

        // Conservation motifs
        output.push("");
        output.push("🧬 CONSERVATION MOTIFS");
        
        const motifs: { start: number; end: number; consensus: string; avgInfo: number }[] = [];
        type MotifData = { start: number; positions: typeof logoData };
        let currentMotif: MotifData | null = null;
        
        logoData.forEach(pos => {
          if (pos.information_content > 1.5) {
            if (!currentMotif) {
              currentMotif = { start: pos.position, positions: [pos] };
            } else {
              currentMotif.positions.push(pos);
            }
          } else {
            if (currentMotif !== null && (currentMotif as MotifData).positions.length >= 3) {
              const activeMotif: MotifData = currentMotif as MotifData; // Explicit type assertion
              const avgInfo = activeMotif.positions.reduce((sum: number, p: typeof logoData[0]) => sum + p.information_content, 0) / activeMotif.positions.length;
              const consensus = activeMotif.positions.map((p: typeof logoData[0]) => 
                Object.entries(p.residue_bits).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
              ).join('');
              
              motifs.push({
                start: activeMotif.start,
                end: activeMotif.positions[activeMotif.positions.length - 1].position,
                consensus,
                avgInfo
              });
            }
            currentMotif = null;
          }
        });
        
        // Don't forget the last motif
        if (currentMotif !== null && (currentMotif as MotifData).positions.length >= 3) {
          const finalMotif: MotifData = currentMotif as MotifData; // Explicit type assertion
          const avgInfo = finalMotif.positions.reduce((sum: number, p: typeof logoData[0]) => sum + p.information_content, 0) / finalMotif.positions.length;
          const consensus = finalMotif.positions.map((p: typeof logoData[0]) => 
            Object.entries(p.residue_bits).sort(([,a], [,b]) => (b as number) - (a as number))[0][0]
          ).join('');
          
          motifs.push({
            start: finalMotif.start,
            end: finalMotif.positions[finalMotif.positions.length - 1].position,
            consensus,
            avgInfo
          });
        }
        
        if (motifs.length > 0) {
          motifs.forEach((motif, index) => {
            output.push(`${index + 1}. Motif ${motif.start}-${motif.end}: ${motif.consensus}`);
            output.push(`   Average Information: ${motif.avgInfo.toFixed(2)} bits`);
          });
        } else {
          output.push("No significant conservation motifs detected");
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
              text: `❌ Error generating sequence logo: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 4: Export Alignment
  server.tool(
    "export_alignment",
    "Export multiple sequence alignment in various formats (FASTA, PHYLIP, Clustal, MSF)",
    exportAlignmentSchema,
    async ({ alignment_sequences, format = 'fasta', include_description = true }) => {
      try {
        const sequenceRecords: SequenceRecord[] = alignment_sequences.map((seq, index) => ({
          id: seq.id || `Seq${index + 1}`,
          description: include_description ? seq.description : undefined,
          sequence: seq.sequence.toUpperCase()
        }));
        
        const alignment = multipleSequenceAlignment(sequenceRecords);
        const exportResult = exportAlignment(alignment, format);
        
        const output = [
          `=== ALIGNMENT EXPORT ===`,
          "",
          "📁 EXPORT DETAILS",
          `Format: ${exportResult.format.toUpperCase()}`,
          `Filename: ${exportResult.filename}`,
          `Sequences: ${alignment.sequence_count}`,
          `Alignment Length: ${alignment.alignment_length} positions`,
          `File Size: ${exportResult.content.length.toLocaleString()} characters`,
          "",
          "📄 EXPORTED CONTENT",
          "```"
        ];

        // Show preview of exported content
        const lines = exportResult.content.split('\n');
        if (lines.length <= 50) {
          output.push(exportResult.content);
        } else {
          // Show first 25 and last 10 lines for long files
          output.push(...lines.slice(0, 25));
          output.push(`\n... [${lines.length - 35} lines omitted] ...\n`);
          output.push(...lines.slice(-10));
        }
        
        output.push("```");
        output.push("");
        
        // Format-specific information
        output.push("ℹ️  FORMAT INFORMATION");
        switch (format.toLowerCase()) {
          case 'fasta':
            output.push("• FASTA format - standard sequence format");
            output.push("• Compatible with most bioinformatics tools");
            output.push("• Header lines start with '>'");
            break;
          case 'phylip':
            output.push("• PHYLIP format - for phylogenetic analysis");
            output.push("• Compatible with PHYLIP, RAxML, PhyML");
            output.push("• Sequential format with fixed-width identifiers");
            break;
          case 'clustal':
            output.push("• Clustal format - with conservation annotation");
            output.push("• Compatible with Clustal tools and Jalview");
            output.push("• Includes conservation symbols (* : .)");
            break;
          case 'msf':
            output.push("• MSF format - for GCG package");
            output.push("• Compatible with Wisconsin Package tools");
            output.push("• Includes checksum and formatting metadata");
            break;
        }
        
        output.push("");
        output.push("💾 USAGE INSTRUCTIONS");
        output.push("1. Copy the content above to a text file");
        output.push(`2. Save with suggested filename: ${exportResult.filename}`);
        output.push("3. Use with compatible bioinformatics software");

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
              text: `❌ Error exporting alignment: ${error}`,
            },
          ],
        };
      }
    }
  );
}
