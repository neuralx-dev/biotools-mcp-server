/**
 * Multiple sequence alignment utility functions
 * Implements multiple alignment algorithms and analysis
 */

export interface SequenceRecord {
  id: string;
  description?: string;
  sequence: string;
}

export interface AlignmentPosition {
  position: number;
  residues: string[];
  conservation_score: number;
  is_conserved: boolean;
  consensus: string;
}

export interface MultipleAlignment {
  sequences: SequenceRecord[];
  alignment_length: number;
  sequence_count: number;
  positions: AlignmentPosition[];
  overall_identity: number;
  conserved_positions: number;
  gaps_percentage: number;
}

export interface ConservedRegion {
  start: number;
  end: number;
  length: number;
  conservation_score: number;
  consensus_sequence: string;
  description: string;
}

export interface SequenceLogo {
  position: number;
  information_content: number;
  residue_frequencies: { [residue: string]: number };
  residue_bits: { [residue: string]: number };
}

export interface AlignmentExport {
  format: string;
  content: string;
  filename: string;
}

/**
 * Perform multiple sequence alignment using progressive alignment
 */
export function multipleSequenceAlignment(sequences: SequenceRecord[]): MultipleAlignment {
  if (sequences.length < 2) {
    throw new Error("At least 2 sequences required for alignment");
  }
  
  // Simplified progressive alignment
  // In production, this would use Clustal Omega, MUSCLE, or T-Coffee
  
  // For demonstration, we'll create a mock alignment
  const maxLength = Math.max(...sequences.map(seq => seq.sequence.length));
  const alignmentLength = Math.floor(maxLength * 1.2); // Account for gaps
  
  // Create aligned sequences with gaps
  const alignedSequences: SequenceRecord[] = sequences.map((seq, index) => {
    let alignedSeq = seq.sequence;
    
    // Add gaps randomly for demonstration
    const gapsToAdd = alignmentLength - seq.sequence.length;
    for (let i = 0; i < gapsToAdd; i++) {
      const pos = Math.floor(Math.random() * alignedSeq.length);
      alignedSeq = alignedSeq.slice(0, pos) + '-' + alignedSeq.slice(pos);
    }
    
    // Ensure exact length
    if (alignedSeq.length > alignmentLength) {
      alignedSeq = alignedSeq.slice(0, alignmentLength);
    } else if (alignedSeq.length < alignmentLength) {
      alignedSeq += '-'.repeat(alignmentLength - alignedSeq.length);
    }
    
    return {
      ...seq,
      sequence: alignedSeq
    };
  });
  
  // Analyze alignment positions
  const positions: AlignmentPosition[] = [];
  let conservedCount = 0;
  let totalResidues = 0;
  let gapCount = 0;
  
  for (let pos = 0; pos < alignmentLength; pos++) {
    const residues = alignedSequences.map(seq => seq.sequence[pos]);
    const uniqueResidues = Array.from(new Set(residues.filter(r => r !== '-')));
    
    // Calculate conservation
    const isConserved = uniqueResidues.length === 1 && uniqueResidues[0] !== '-';
    const conservationScore = isConserved ? 1.0 : 
      uniqueResidues.length === 0 ? 0.0 : 
      1.0 - (uniqueResidues.length - 1) / (sequences.length - 1);
    
    // Determine consensus
    const residueCounts: { [key: string]: number } = {};
    residues.forEach(r => {
      residueCounts[r] = (residueCounts[r] || 0) + 1;
    });
    
    const consensus = Object.entries(residueCounts)
      .filter(([res]) => res !== '-')
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '-';
    
    positions.push({
      position: pos + 1,
      residues,
      conservation_score: parseFloat(conservationScore.toFixed(3)),
      is_conserved: isConserved,
      consensus
    });
    
    if (isConserved) conservedCount++;
    totalResidues += residues.filter(r => r !== '-').length;
    gapCount += residues.filter(r => r === '-').length;
  }
  
  const overallIdentity = conservedCount / alignmentLength;
  const gapsPercentage = gapCount / (alignmentLength * sequences.length);
  
  return {
    sequences: alignedSequences,
    alignment_length: alignmentLength,
    sequence_count: sequences.length,
    positions,
    overall_identity: parseFloat((overallIdentity * 100).toFixed(2)),
    conserved_positions: conservedCount,
    gaps_percentage: parseFloat((gapsPercentage * 100).toFixed(2))
  };
}

/**
 * Highlight conserved regions in multiple alignment
 */
export function highlightConservedRegions(alignment: MultipleAlignment, minLength: number = 5): ConservedRegion[] {
  const conservedRegions: ConservedRegion[] = [];
  let currentRegion: { start: number; positions: AlignmentPosition[] } | null = null;
  
  for (const position of alignment.positions) {
    if (position.conservation_score >= 0.8) {
      if (!currentRegion) {
        currentRegion = {
          start: position.position,
          positions: [position]
        };
      } else {
        currentRegion.positions.push(position);
      }
    } else {
      if (currentRegion && currentRegion.positions.length >= minLength) {
        const avgScore = currentRegion.positions.reduce((sum, pos) => sum + pos.conservation_score, 0) / currentRegion.positions.length;
        const consensus = currentRegion.positions.map(pos => pos.consensus).join('');
        
        conservedRegions.push({
          start: currentRegion.start,
          end: currentRegion.positions[currentRegion.positions.length - 1].position,
          length: currentRegion.positions.length,
          conservation_score: parseFloat(avgScore.toFixed(3)),
          consensus_sequence: consensus,
          description: getConservationDescription(avgScore, currentRegion.positions.length)
        });
      }
      currentRegion = null;
    }
  }
  
  // Don't forget the last region
  if (currentRegion && currentRegion.positions.length >= minLength) {
    const avgScore = currentRegion.positions.reduce((sum, pos) => sum + pos.conservation_score, 0) / currentRegion.positions.length;
    const consensus = currentRegion.positions.map(pos => pos.consensus).join('');
    
    conservedRegions.push({
      start: currentRegion.start,
      end: currentRegion.positions[currentRegion.positions.length - 1].position,
      length: currentRegion.positions.length,
      conservation_score: parseFloat(avgScore.toFixed(3)),
      consensus_sequence: consensus,
      description: getConservationDescription(avgScore, currentRegion.positions.length)
    });
  }
  
  return conservedRegions;
}

/**
 * Generate sequence logo data from multiple alignment
 */
export function generateSequenceLogo(alignment: MultipleAlignment): SequenceLogo[] {
  const logo: SequenceLogo[] = [];
  
  for (const position of alignment.positions) {
    const residues = position.residues.filter(r => r !== '-');
    const totalResidues = residues.length;
    
    if (totalResidues === 0) {
      continue; // Skip gap-only positions
    }
    
    // Calculate residue frequencies
    const frequencies: { [residue: string]: number } = {};
    residues.forEach(residue => {
      frequencies[residue] = (frequencies[residue] || 0) + 1;
    });
    
    // Convert to probabilities
    Object.keys(frequencies).forEach(residue => {
      frequencies[residue] = frequencies[residue] / totalResidues;
    });
    
    // Calculate information content (bits)
    const maxEntropy = Math.log2(20); // 20 amino acids
    let entropy = 0;
    Object.values(frequencies).forEach(freq => {
      if (freq > 0) {
        entropy -= freq * Math.log2(freq);
      }
    });
    
    const informationContent = maxEntropy - entropy;
    
    // Calculate bit heights for each residue
    const residueBits: { [residue: string]: number } = {};
    Object.entries(frequencies).forEach(([residue, freq]) => {
      residueBits[residue] = freq * informationContent;
    });
    
    logo.push({
      position: position.position,
      information_content: parseFloat(informationContent.toFixed(3)),
      residue_frequencies: frequencies,
      residue_bits: residueBits
    });
  }
  
  return logo;
}

/**
 * Export alignment in various formats
 */
export function exportAlignment(alignment: MultipleAlignment, format: string): AlignmentExport {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  let content = '';
  let filename = '';
  
  switch (format.toLowerCase()) {
    case 'fasta':
      content = alignment.sequences.map(seq => 
        `>${seq.id}${seq.description ? ' ' + seq.description : ''}\n${seq.sequence}`
      ).join('\n\n');
      filename = `alignment_${timestamp}.fasta`;
      break;
      
    case 'phylip':
      content = `${alignment.sequence_count} ${alignment.alignment_length}\n`;
      content += alignment.sequences.map(seq => 
        `${seq.id.padEnd(10)} ${seq.sequence}`
      ).join('\n');
      filename = `alignment_${timestamp}.phy`;
      break;
      
    case 'clustal':
      content = 'CLUSTAL multiple sequence alignment\n\n';
      const chunkSize = 60;
      for (let start = 0; start < alignment.alignment_length; start += chunkSize) {
        const end = Math.min(start + chunkSize, alignment.alignment_length);
        
        // Sequence chunks
        alignment.sequences.forEach(seq => {
          const chunk = seq.sequence.slice(start, end);
          content += `${seq.id.padEnd(15)} ${chunk}\n`;
        });
        
        // Conservation line
        let conservation = ' '.repeat(15);
        for (let i = start; i < end; i++) {
          const pos = alignment.positions[i];
          if (pos.is_conserved) {
            conservation += '*';
          } else if (pos.conservation_score > 0.5) {
            conservation += ':';
          } else if (pos.conservation_score > 0.2) {
            conservation += '.';
          } else {
            conservation += ' ';
          }
        }
        content += conservation + '\n\n';
      }
      filename = `alignment_${timestamp}.aln`;
      break;
      
    case 'msf':
      content = `PileUp\n\n   MSF: ${alignment.alignment_length}  Type: P  Check: 0000\n\n`;
      alignment.sequences.forEach(seq => {
        content += `Name: ${seq.id}   Len: ${alignment.alignment_length}  Check: 0000  Weight: 1.00\n`;
      });
      content += '\n//\n\n';
      
      for (let start = 0; start < alignment.alignment_length; start += 50) {
        const end = Math.min(start + 50, alignment.alignment_length);
        alignment.sequences.forEach(seq => {
          const chunk = seq.sequence.slice(start, end).match(/.{1,10}/g)?.join(' ') || '';
          content += `${seq.id.padEnd(15)} ${chunk}\n`;
        });
        content += '\n';
      }
      filename = `alignment_${timestamp}.msf`;
      break;
      
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  return {
    format,
    content,
    filename
  };
}

/**
 * Get description for conservation level
 */
function getConservationDescription(score: number, length: number): string {
  let conservation = '';
  if (score >= 0.95) {
    conservation = 'Highly conserved';
  } else if (score >= 0.8) {
    conservation = 'Well conserved';
  } else if (score >= 0.6) {
    conservation = 'Moderately conserved';
  } else {
    conservation = 'Weakly conserved';
  }
  
  let lengthDesc = '';
  if (length >= 20) {
    lengthDesc = 'long domain';
  } else if (length >= 10) {
    lengthDesc = 'medium motif';
  } else {
    lengthDesc = 'short motif';
  }
  
  return `${conservation} ${lengthDesc}`;
}
