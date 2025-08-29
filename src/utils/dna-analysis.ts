/**
 * DNA sequence analysis utility functions
 * Implements basic bioinformatics algorithms for DNA analysis
 */

// Genetic code table for translation
const GENETIC_CODE: { [key: string]: string } = {
  'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
  'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
  'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
  'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
  'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
  'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
  'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
  'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
  'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
  'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
  'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
  'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
  'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
  'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
  'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
  'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
};

// Common restriction enzyme recognition sites
const RESTRICTION_ENZYMES: { [key: string]: { pattern: string; cut_site: string } } = {
  'EcoRI': { pattern: 'GAATTC', cut_site: 'G|AATTC' },
  'BamHI': { pattern: 'GGATCC', cut_site: 'G|GATCC' },
  'HindIII': { pattern: 'AAGCTT', cut_site: 'A|AGCTT' },
  'XhoI': { pattern: 'CTCGAG', cut_site: 'C|TCGAG' },
  'KpnI': { pattern: 'GGTACC', cut_site: 'GGTAC|C' },
  'SacI': { pattern: 'GAGCTC', cut_site: 'GAGCT|C' },
  'XbaI': { pattern: 'TCTAGA', cut_site: 'T|CTAGA' },
  'SpeI': { pattern: 'ACTAGT', cut_site: 'A|CTAGT' },
  'NotI': { pattern: 'GCGGCCGC', cut_site: 'GC|GGCCGC' },
  'ApaI': { pattern: 'GGGCCC', cut_site: 'GGGCC|C' },
  'SalI': { pattern: 'GTCGAC', cut_site: 'G|TCGAC' },
  'PstI': { pattern: 'CTGCAG', cut_site: 'CTGCA|G' },
  'SmaI': { pattern: 'CCCGGG', cut_site: 'CCC|GGG' },
  'NcoI': { pattern: 'CCATGG', cut_site: 'C|CATGG' },
  'NdeI': { pattern: 'CATATG', cut_site: 'CA|TATG' },
  'BglII': { pattern: 'AGATCT', cut_site: 'A|GATCT' },
  'MluI': { pattern: 'ACGCGT', cut_site: 'A|CGCGT' },
  'AscI': { pattern: 'GGCGCGCC', cut_site: 'GG|CGCGCC' },
  'FseI': { pattern: 'GGCCGGCC', cut_site: 'GGCCGG|CC' },
  'PacI': { pattern: 'TTAATTAA', cut_site: 'TTAAT|TAA' }
};

export interface GCContentResult {
  sequence_length: number;
  gc_content: number;
  gc_percentage: string;
  at_content: number;
  at_percentage: string;
  composition: {
    A: number;
    T: number;
    G: number;
    C: number;
    N: number;
    others: number;
  };
  gc_skew: number;
  at_skew: number;
}

export interface RestrictionSite {
  enzyme: string;
  pattern: string;
  cut_site: string;
  position: number;
  sequence_context: string;
}

export interface RestrictionAnalysisResult {
  sequence_length: number;
  total_sites: number;
  sites_by_enzyme: { [enzyme: string]: RestrictionSite[] };
  enzymes_with_no_sites: string[];
  fragment_analysis: {
    enzyme: string;
    fragments: number;
    fragment_sizes: number[];
  }[];
}

export interface ORF {
  frame: number;
  start: number;
  end: number;
  length: number;
  nucleotide_sequence: string;
  amino_acid_sequence: string;
  start_codon: string;
  stop_codon: string;
  gc_content: number;
}

export interface ORFAnalysisResult {
  sequence_length: number;
  orfs_found: number;
  orfs_by_frame: {
    frame: number;
    orfs: ORF[];
  }[];
  longest_orf: ORF | null;
  orfs_above_threshold: ORF[];
}

export interface AssemblyFragment {
  id: string;
  sequence: string;
  length: number;
}

export interface AssemblyOverlap {
  fragment1: string;
  fragment2: string;
  overlap_length: number;
  overlap_sequence: string;
  score: number;
  position1: number;
  position2: number;
}

export interface AssemblyResult {
  input_fragments: number;
  assembled_sequence: string;
  assembled_length: number;
  overlaps_used: AssemblyOverlap[];
  assembly_statistics: {
    coverage: number;
    gaps: number;
    ambiguous_bases: number;
  };
}

/**
 * Calculate GC content and composition of DNA sequence
 */
export function analyzeGCContent(sequence: string): GCContentResult {
  // Clean and normalize sequence
  const cleanSeq = sequence.toUpperCase().replace(/\s+/g, '');
  const length = cleanSeq.length;
  
  // Count bases
  const composition = {
    A: (cleanSeq.match(/A/g) || []).length,
    T: (cleanSeq.match(/T/g) || []).length,
    G: (cleanSeq.match(/G/g) || []).length,
    C: (cleanSeq.match(/C/g) || []).length,
    N: (cleanSeq.match(/N/g) || []).length,
    others: length - (cleanSeq.match(/[ATGCN]/g) || []).length
  };
  
  const gcCount = composition.G + composition.C;
  const atCount = composition.A + composition.T;
  
  const gcContent = length > 0 ? gcCount / length : 0;
  const atContent = length > 0 ? atCount / length : 0;
  
  // Calculate skew: (G-C)/(G+C) and (A-T)/(A+T)
  const gcSkew = gcCount > 0 ? (composition.G - composition.C) / gcCount : 0;
  const atSkew = atCount > 0 ? (composition.A - composition.T) / atCount : 0;
  
  return {
    sequence_length: length,
    gc_content: gcContent,
    gc_percentage: (gcContent * 100).toFixed(2) + '%',
    at_content: atContent,
    at_percentage: (atContent * 100).toFixed(2) + '%',
    composition,
    gc_skew: parseFloat(gcSkew.toFixed(4)),
    at_skew: parseFloat(atSkew.toFixed(4))
  };
}

/**
 * Find restriction enzyme cut sites in DNA sequence
 */
export function findRestrictionSites(sequence: string, enzymes?: string[]): RestrictionAnalysisResult {
  const cleanSeq = sequence.toUpperCase().replace(/\s+/g, '');
  const targetEnzymes = enzymes || Object.keys(RESTRICTION_ENZYMES);
  
  const sitesByEnzyme: { [enzyme: string]: RestrictionSite[] } = {};
  const enzymesWithNoSites: string[] = [];
  
  for (const enzyme of targetEnzymes) {
    const enzymeData = RESTRICTION_ENZYMES[enzyme];
    if (!enzymeData) continue;
    
    const sites: RestrictionSite[] = [];
    const pattern = enzymeData.pattern;
    let index = 0;
    
    while ((index = cleanSeq.indexOf(pattern, index)) !== -1) {
      const contextStart = Math.max(0, index - 10);
      const contextEnd = Math.min(cleanSeq.length, index + pattern.length + 10);
      const context = cleanSeq.substring(contextStart, contextEnd);
      
      sites.push({
        enzyme,
        pattern,
        cut_site: enzymeData.cut_site,
        position: index + 1, // 1-based position
        sequence_context: context
      });
      
      index++;
    }
    
    if (sites.length > 0) {
      sitesByEnzyme[enzyme] = sites;
    } else {
      enzymesWithNoSites.push(enzyme);
    }
  }
  
  // Calculate fragment analysis for enzymes with sites
  const fragmentAnalysis = Object.keys(sitesByEnzyme).map(enzyme => {
    const sites = sitesByEnzyme[enzyme];
    const positions = sites.map(site => site.position - 1); // Convert to 0-based
    positions.sort((a, b) => a - b);
    
    const fragmentSizes: number[] = [];
    let lastPos = 0;
    
    for (const pos of positions) {
      fragmentSizes.push(pos - lastPos);
      lastPos = pos;
    }
    fragmentSizes.push(cleanSeq.length - lastPos); // Last fragment
    
    return {
      enzyme,
      fragments: fragmentSizes.length,
      fragment_sizes: fragmentSizes.filter(size => size > 0)
    };
  });
  
  const totalSites = Object.values(sitesByEnzyme).reduce((sum, sites) => sum + sites.length, 0);
  
  return {
    sequence_length: cleanSeq.length,
    total_sites: totalSites,
    sites_by_enzyme: sitesByEnzyme,
    enzymes_with_no_sites: enzymesWithNoSites,
    fragment_analysis: fragmentAnalysis
  };
}

/**
 * Predict open reading frames (ORFs) in all 6 frames
 */
export function predictORFs(sequence: string, minLength: number = 100): ORFAnalysisResult {
  const cleanSeq = sequence.toUpperCase().replace(/\s+/g, '');
  const reverseComplement = getReverseComplement(cleanSeq);
  
  const allORFs: ORF[] = [];
  const orfsByFrame: { frame: number; orfs: ORF[] }[] = [];
  
  // Analyze forward frames (1, 2, 3)
  for (let frame = 0; frame < 3; frame++) {
    const orfs = findORFsInFrame(cleanSeq, frame + 1, minLength);
    allORFs.push(...orfs);
    orfsByFrame.push({ frame: frame + 1, orfs });
  }
  
  // Analyze reverse frames (-1, -2, -3)
  for (let frame = 0; frame < 3; frame++) {
    const orfs = findORFsInFrame(reverseComplement, -(frame + 1), minLength, cleanSeq.length);
    allORFs.push(...orfs);
    orfsByFrame.push({ frame: -(frame + 1), orfs });
  }
  
  // Find longest ORF
  const longestORF = allORFs.length > 0 ? 
    allORFs.reduce((max, orf) => orf.length > max.length ? orf : max) : null;
  
  // Filter ORFs above threshold (default 300 bp)
  const orfsAboveThreshold = allORFs.filter(orf => orf.length >= Math.max(minLength, 300));
  
  return {
    sequence_length: cleanSeq.length,
    orfs_found: allORFs.length,
    orfs_by_frame: orfsByFrame,
    longest_orf: longestORF,
    orfs_above_threshold: orfsAboveThreshold
  };
}

/**
 * Find ORFs in a specific reading frame
 */
function findORFsInFrame(sequence: string, frame: number, minLength: number, originalLength?: number): ORF[] {
  const orfs: ORF[] = [];
  const frameSeq = sequence.substring(Math.abs(frame) - 1);
  
  for (let i = 0; i < frameSeq.length - 2; i += 3) {
    const codon = frameSeq.substring(i, i + 3);
    if (codon.length < 3) break;
    
    // Look for start codon (ATG)
    if (codon === 'ATG') {
      // Find the next stop codon
      for (let j = i + 3; j < frameSeq.length - 2; j += 3) {
        const stopCodon = frameSeq.substring(j, j + 3);
        if (stopCodon.length < 3) break;
        
        if (stopCodon === 'TAA' || stopCodon === 'TAG' || stopCodon === 'TGA') {
          const orfLength = j - i + 3;
          if (orfLength >= minLength) {
            const orfSeq = frameSeq.substring(i, j + 3);
            const aaSeq = translateDNA(orfSeq);
            const gcContent = analyzeGCContent(orfSeq).gc_content;
            
            let start, end;
            if (frame > 0) {
              start = Math.abs(frame) + i;
              end = start + orfLength - 1;
            } else {
              // For reverse frame, calculate position in original sequence
              const revPos = Math.abs(frame) - 1 + i;
              end = originalLength! - revPos;
              start = end - orfLength + 1;
            }
            
            orfs.push({
              frame,
              start: start + 1, // 1-based position
              end: end + 1,     // 1-based position
              length: orfLength,
              nucleotide_sequence: orfSeq,
              amino_acid_sequence: aaSeq,
              start_codon: codon,
              stop_codon: stopCodon,
              gc_content: parseFloat((gcContent * 100).toFixed(2))
            });
          }
          break; // Found stop codon, move to next potential start
        }
      }
    }
  }
  
  return orfs;
}

/**
 * Translate DNA sequence to amino acids
 */
function translateDNA(sequence: string): string {
  let protein = '';
  for (let i = 0; i < sequence.length - 2; i += 3) {
    const codon = sequence.substring(i, i + 3);
    if (codon.length === 3) {
      protein += GENETIC_CODE[codon] || 'X';
    }
  }
  return protein;
}

/**
 * Get reverse complement of DNA sequence
 */
function getReverseComplement(sequence: string): string {
  const complement: { [key: string]: string } = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G', 'N': 'N'
  };
  
  return sequence
    .split('')
    .reverse()
    .map(base => complement[base] || base)
    .join('');
}

/**
 * Simple fragment assembly using overlap-based approach
 */
export function assembleFragments(fragments: AssemblyFragment[], minOverlap: number = 10): AssemblyResult {
  if (fragments.length === 0) {
    return {
      input_fragments: 0,
      assembled_sequence: '',
      assembled_length: 0,
      overlaps_used: [],
      assembly_statistics: {
        coverage: 0,
        gaps: 0,
        ambiguous_bases: 0
      }
    };
  }
  
  if (fragments.length === 1) {
    return {
      input_fragments: 1,
      assembled_sequence: fragments[0].sequence,
      assembled_length: fragments[0].length,
      overlaps_used: [],
      assembly_statistics: {
        coverage: 1,
        gaps: 0,
        ambiguous_bases: 0
      }
    };
  }
  
  // Find all possible overlaps
  const overlaps: AssemblyOverlap[] = [];
  
  for (let i = 0; i < fragments.length; i++) {
    for (let j = 0; j < fragments.length; j++) {
      if (i === j) continue;
      
      const frag1 = fragments[i];
      const frag2 = fragments[j];
      
      // Check for overlap: end of frag1 with start of frag2
      const overlap = findOverlap(frag1.sequence, frag2.sequence, minOverlap);
      if (overlap) {
        overlaps.push({
          fragment1: frag1.id,
          fragment2: frag2.id,
          overlap_length: overlap.length,
          overlap_sequence: overlap.sequence,
          score: overlap.score,
          position1: overlap.pos1,
          position2: overlap.pos2
        });
      }
    }
  }
  
  // Sort overlaps by score (descending)
  overlaps.sort((a, b) => b.score - a.score);
  
  // Simple greedy assembly
  let assembledSeq = fragments[0].sequence;
  const usedFragments = new Set([fragments[0].id]);
  const usedOverlaps: AssemblyOverlap[] = [];
  
  while (usedFragments.size < fragments.length && overlaps.length > 0) {
    let bestOverlap: AssemblyOverlap | null = null;
    
    for (const overlap of overlaps) {
      if (usedFragments.has(overlap.fragment1) && !usedFragments.has(overlap.fragment2)) {
        bestOverlap = overlap;
        break;
      }
    }
    
    if (!bestOverlap) break;
    
    // Add the overlapping fragment
    const nextFragment = fragments.find(f => f.id === bestOverlap!.fragment2);
    if (nextFragment) {
      const overlapLen = bestOverlap.overlap_length;
      const remainingSeq = nextFragment.sequence.substring(overlapLen);
      assembledSeq += remainingSeq;
      
      usedFragments.add(nextFragment.id);
      usedOverlaps.push(bestOverlap);
    }
    
    // Remove used overlaps
    const index = overlaps.indexOf(bestOverlap);
    overlaps.splice(index, 1);
  }
  
  // Calculate statistics
  const totalInputLength = fragments.reduce((sum, f) => sum + f.length, 0);
  const coverage = assembledSeq.length / totalInputLength;
  const ambiguousBases = (assembledSeq.match(/N/g) || []).length;
  
  return {
    input_fragments: fragments.length,
    assembled_sequence: assembledSeq,
    assembled_length: assembledSeq.length,
    overlaps_used: usedOverlaps,
    assembly_statistics: {
      coverage: parseFloat(coverage.toFixed(3)),
      gaps: fragments.length - usedFragments.size,
      ambiguous_bases: ambiguousBases
    }
  };
}

/**
 * Find overlap between two sequences
 */
function findOverlap(seq1: string, seq2: string, minLength: number): { length: number; sequence: string; score: number; pos1: number; pos2: number } | null {
  let bestOverlap: { length: number; sequence: string; score: number; pos1: number; pos2: number } | null = null;
  
  // Check suffix of seq1 with prefix of seq2
  for (let len = minLength; len <= Math.min(seq1.length, seq2.length); len++) {
    const suffix = seq1.substring(seq1.length - len);
    const prefix = seq2.substring(0, len);
    
    if (suffix === prefix) {
      const score = len; // Simple scoring based on overlap length
      bestOverlap = {
        length: len,
        sequence: suffix,
        score,
        pos1: seq1.length - len,
        pos2: 0
      };
    }
  }
  
  return bestOverlap;
}
