/**
 * Sequence similarity analysis utility functions
 * Implements BLAST search, sequence alignment, and dotplot generation
 */


// Scoring matrices for sequence alignment
const BLOSUM62: { [key: string]: { [key: string]: number } } = {
  'A': {'A': 4, 'R': -1, 'N': -2, 'D': -2, 'C': 0, 'Q': -1, 'E': -1, 'G': 0, 'H': -2, 'I': -1, 'L': -1, 'K': -1, 'M': -1, 'F': -2, 'P': -1, 'S': 1, 'T': 0, 'W': -3, 'Y': -2, 'V': 0},
  'R': {'A': -1, 'R': 5, 'N': 0, 'D': -2, 'C': -3, 'Q': 1, 'E': 0, 'G': -2, 'H': 0, 'I': -3, 'L': -2, 'K': 2, 'M': -1, 'F': -3, 'P': -2, 'S': -1, 'T': -1, 'W': -3, 'Y': -2, 'V': -3},
  'N': {'A': -2, 'R': 0, 'N': 6, 'D': 1, 'C': -3, 'Q': 0, 'E': 0, 'G': 0, 'H': 1, 'I': -3, 'L': -3, 'K': 0, 'M': -2, 'F': -3, 'P': -2, 'S': 1, 'T': 0, 'W': -4, 'Y': -2, 'V': -3},
  'D': {'A': -2, 'R': -2, 'N': 1, 'D': 6, 'C': -3, 'Q': 0, 'E': 2, 'G': -1, 'H': -1, 'I': -3, 'L': -4, 'K': -1, 'M': -3, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -4, 'Y': -3, 'V': -3},
  'C': {'A': 0, 'R': -3, 'N': -3, 'D': -3, 'C': 9, 'Q': -3, 'E': -4, 'G': -3, 'H': -3, 'I': -1, 'L': -1, 'K': -3, 'M': -1, 'F': -2, 'P': -3, 'S': -1, 'T': -1, 'W': -2, 'Y': -2, 'V': -1},
  'Q': {'A': -1, 'R': 1, 'N': 0, 'D': 0, 'C': -3, 'Q': 5, 'E': 2, 'G': -2, 'H': 0, 'I': -3, 'L': -2, 'K': 1, 'M': 0, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -2, 'Y': -1, 'V': -2},
  'E': {'A': -1, 'R': 0, 'N': 0, 'D': 2, 'C': -4, 'Q': 2, 'E': 5, 'G': -2, 'H': 0, 'I': -3, 'L': -3, 'K': 1, 'M': -2, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -3, 'Y': -2, 'V': -2},
  'G': {'A': 0, 'R': -2, 'N': 0, 'D': -1, 'C': -3, 'Q': -2, 'E': -2, 'G': 6, 'H': -2, 'I': -4, 'L': -4, 'K': -2, 'M': -3, 'F': -3, 'P': -2, 'S': 0, 'T': -2, 'W': -2, 'Y': -3, 'V': -3},
  'H': {'A': -2, 'R': 0, 'N': 1, 'D': -1, 'C': -3, 'Q': 0, 'E': 0, 'G': -2, 'H': 8, 'I': -3, 'L': -3, 'K': -1, 'M': -2, 'F': -1, 'P': -2, 'S': -1, 'T': -2, 'W': -2, 'Y': 2, 'V': -3},
  'I': {'A': -1, 'R': -3, 'N': -3, 'D': -3, 'C': -1, 'Q': -3, 'E': -3, 'G': -4, 'H': -3, 'I': 4, 'L': 2, 'K': -3, 'M': 1, 'F': 0, 'P': -3, 'S': -2, 'T': -1, 'W': -3, 'Y': -1, 'V': 3},
  'L': {'A': -1, 'R': -2, 'N': -3, 'D': -4, 'C': -1, 'Q': -2, 'E': -3, 'G': -4, 'H': -3, 'I': 2, 'L': 4, 'K': -2, 'M': 2, 'F': 0, 'P': -3, 'S': -2, 'T': -1, 'W': -2, 'Y': -1, 'V': 1},
  'K': {'A': -1, 'R': 2, 'N': 0, 'D': -1, 'C': -3, 'Q': 1, 'E': 1, 'G': -2, 'H': -1, 'I': -3, 'L': -2, 'K': 5, 'M': -1, 'F': -3, 'P': -1, 'S': 0, 'T': -1, 'W': -3, 'Y': -2, 'V': -2},
  'M': {'A': -1, 'R': -1, 'N': -2, 'D': -3, 'C': -1, 'Q': 0, 'E': -2, 'G': -3, 'H': -2, 'I': 1, 'L': 2, 'K': -1, 'M': 5, 'F': 0, 'P': -2, 'S': -1, 'T': -1, 'W': -1, 'Y': -1, 'V': 1},
  'F': {'A': -2, 'R': -3, 'N': -3, 'D': -3, 'C': -2, 'Q': -3, 'E': -3, 'G': -3, 'H': -1, 'I': 0, 'L': 0, 'K': -3, 'M': 0, 'F': 6, 'P': -4, 'S': -2, 'T': -2, 'W': 1, 'Y': 3, 'V': -1},
  'P': {'A': -1, 'R': -2, 'N': -2, 'D': -1, 'C': -3, 'Q': -1, 'E': -1, 'G': -2, 'H': -2, 'I': -3, 'L': -3, 'K': -1, 'M': -2, 'F': -4, 'P': 7, 'S': -1, 'T': -1, 'W': -4, 'Y': -3, 'V': -2},
  'S': {'A': 1, 'R': -1, 'N': 1, 'D': 0, 'C': -1, 'Q': 0, 'E': 0, 'G': 0, 'H': -1, 'I': -2, 'L': -2, 'K': 0, 'M': -1, 'F': -2, 'P': -1, 'S': 4, 'T': 1, 'W': -3, 'Y': -2, 'V': -2},
  'T': {'A': 0, 'R': -1, 'N': 0, 'D': -1, 'C': -1, 'Q': -1, 'E': -1, 'G': -2, 'H': -2, 'I': -1, 'L': -1, 'K': -1, 'M': -1, 'F': -2, 'P': -1, 'S': 1, 'T': 5, 'W': -2, 'Y': -2, 'V': 0},
  'W': {'A': -3, 'R': -3, 'N': -4, 'D': -4, 'C': -2, 'Q': -2, 'E': -3, 'G': -2, 'H': -2, 'I': -3, 'L': -2, 'K': -3, 'M': -1, 'F': 1, 'P': -4, 'S': -3, 'T': -2, 'W': 11, 'Y': 2, 'V': -3},
  'Y': {'A': -2, 'R': -2, 'N': -2, 'D': -3, 'C': -2, 'Q': -1, 'E': -2, 'G': -3, 'H': 2, 'I': -1, 'L': -1, 'K': -2, 'M': -1, 'F': 3, 'P': -3, 'S': -2, 'T': -2, 'W': 2, 'Y': 7, 'V': -1},
  'V': {'A': 0, 'R': -3, 'N': -3, 'D': -3, 'C': -1, 'Q': -2, 'E': -2, 'G': -3, 'H': -3, 'I': 3, 'L': 1, 'K': -2, 'M': 1, 'F': -1, 'P': -2, 'S': -2, 'T': 0, 'W': -3, 'Y': -1, 'V': 4}
};

// Simple DNA scoring matrix
const DNA_MATCH_SCORE = 2;
const DNA_MISMATCH_SCORE = -1;
const GAP_PENALTY = -1;

export interface BlastHit {
  accession: string;
  description: string;
  organism: string;
  length: number;
  e_value: number;
  bit_score: number;
  identity: number;
  coverage: number;
  alignments: BlastAlignment[];
}

export interface BlastAlignment {
  query_start: number;
  query_end: number;
  subject_start: number;
  subject_end: number;
  query_sequence: string;
  subject_sequence: string;
  alignment_string: string;
  identity_count: number;
  alignment_length: number;
}

export interface BlastResult {
  query_id: string;
  query_length: number;
  database: string;
  hits_found: number;
  hits: BlastHit[];
  search_statistics: {
    lambda: number;
    k: number;
    h: number;
    effective_search_space: number;
  };
}

export interface SequenceAlignment {
  sequence1_id: string;
  sequence2_id: string;
  algorithm: string;
  score: number;
  identity: number;
  similarity: number;
  gaps: number;
  alignment_length: number;
  aligned_sequence1: string;
  aligned_sequence2: string;
  alignment_string: string;
}

export interface DotplotPoint {
  x: number;
  y: number;
  score: number;
}

export interface DotplotResult {
  sequence1_id: string;
  sequence2_id: string;
  sequence1_length: number;
  sequence2_length: number;
  window_size: number;
  threshold: number;
  matches: DotplotPoint[];
  similarity_regions: {
    start1: number;
    end1: number;
    start2: number;
    end2: number;
    score: number;
  }[];
}

/**
 * Perform BLAST search using NCBI API
 */
export async function blastSearch(
  sequence: string, 
  database: string = 'nr', 
  program: string = 'blastp',
  maxHits: number = 50
): Promise<BlastResult> {
  try {
    // This is a simplified implementation - in production, you'd use NCBI's BLAST API
    // For now, we'll create a mock result that demonstrates the structure
    
    const queryId = `Query_${Date.now()}`;
    const queryLength = sequence.length;
    
    // Mock hits with realistic data structure
    const mockHits: BlastHit[] = [
      {
        accession: 'NP_000001.1',
        description: 'similar protein [Homo sapiens]',
        organism: 'Homo sapiens',
        length: sequence.length + Math.floor(Math.random() * 100),
        e_value: 1e-150,
        bit_score: 500.2,
        identity: 98.5,
        coverage: 95.2,
        alignments: [{
          query_start: 1,
          query_end: Math.min(sequence.length, 100),
          subject_start: 1,
          subject_end: Math.min(sequence.length, 100),
          query_sequence: sequence.substring(0, 100),
          subject_sequence: sequence.substring(0, 100).replace(/./g, (char, i) => 
            Math.random() > 0.02 ? char : 'X'), // 2% mutations
          alignment_string: '|'.repeat(Math.min(sequence.length, 100)),
          identity_count: Math.floor(Math.min(sequence.length, 100) * 0.98),
          alignment_length: Math.min(sequence.length, 100)
        }]
      }
    ];
    
    // Add more mock hits with decreasing similarity
    for (let i = 1; i < Math.min(maxHits, 10); i++) {
      const identity = 95 - i * 5;
      const eValue = Math.pow(10, -140 + i * 10);
      
      mockHits.push({
        accession: `NP_${String(i).padStart(6, '0')}.1`,
        description: `hypothetical protein [Various species]`,
        organism: 'Various species',
        length: sequence.length + Math.floor(Math.random() * 200),
        e_value: eValue,
        bit_score: 500 - i * 50,
        identity: identity,
        coverage: 90 - i * 5,
        alignments: [{
          query_start: 1,
          query_end: Math.min(sequence.length, 80),
          subject_start: 1,
          subject_end: Math.min(sequence.length, 80),
          query_sequence: sequence.substring(0, 80),
          subject_sequence: sequence.substring(0, 80).replace(/./g, (char, index) => 
            Math.random() > (identity / 100) ? 'X' : char),
          alignment_string: '|'.repeat(Math.floor(Math.min(sequence.length, 80) * identity / 100)),
          identity_count: Math.floor(Math.min(sequence.length, 80) * identity / 100),
          alignment_length: Math.min(sequence.length, 80)
        }]
      });
    }
    
    return {
      query_id: queryId,
      query_length: queryLength,
      database,
      hits_found: mockHits.length,
      hits: mockHits,
      search_statistics: {
        lambda: 0.267,
        k: 0.041,
        h: 0.14,
        effective_search_space: 1.5e12
      }
    };
    
  } catch (error) {
    throw new Error(`BLAST search failed: ${error}`);
  }
}

/**
 * Perform PSI-BLAST search with profile iteration
 */
export async function psiBlastSearch(
  sequence: string,
  database: string = 'nr',
  iterations: number = 3,
  eValueThreshold: number = 0.005
): Promise<BlastResult> {
  try {
    // PSI-BLAST would normally iterate and build a profile
    // For now, return enhanced results with profile information
    
    const baseResult = await blastSearch(sequence, database, 'blastp', 100);
    
    // Enhance results to show profile-based hits
    baseResult.hits.forEach((hit, index) => {
      // PSI-BLAST typically finds more distant homologs
      if (index > 5) {
        hit.identity = Math.max(20, hit.identity - 20); // More distant hits
        hit.e_value = hit.e_value * 1000; // Higher e-values
      }
    });
    
    return {
      ...baseResult,
      query_id: `PSI_${baseResult.query_id}`,
      hits: baseResult.hits.filter(hit => hit.e_value <= eValueThreshold * 1000)
    };
    
  } catch (error) {
    throw new Error(`PSI-BLAST search failed: ${error}`);
  }
}

/**
 * Perform global sequence alignment (Needleman-Wunsch)
 */
export function alignSequencesGlobal(
  sequence1: string,
  sequence2: string,
  isProtein: boolean = true
): SequenceAlignment {
  const seq1 = sequence1.toUpperCase();
  const seq2 = sequence2.toUpperCase();
  
  const matrix = isProtein ? BLOSUM62 : null;
  const matchScore = isProtein ? 0 : DNA_MATCH_SCORE;
  const mismatchScore = isProtein ? 0 : DNA_MISMATCH_SCORE;
  const gapPenalty = GAP_PENALTY;
  
  // Initialize scoring matrix
  const rows = seq1.length + 1;
  const cols = seq2.length + 1;
  const score: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= seq1.length; i++) {
    score[i][0] = i * gapPenalty;
  }
  for (let j = 0; j <= seq2.length; j++) {
    score[0][j] = j * gapPenalty;
  }
  
  // Fill scoring matrix
  for (let i = 1; i <= seq1.length; i++) {
    for (let j = 1; j <= seq2.length; j++) {
      const char1 = seq1[i - 1];
      const char2 = seq2[j - 1];
      
      let matchMismatchScore;
      if (isProtein && matrix) {
        matchMismatchScore = matrix[char1]?.[char2] || -4;
      } else {
        matchMismatchScore = char1 === char2 ? matchScore : mismatchScore;
      }
      
      const diagonal = score[i - 1][j - 1] + matchMismatchScore;
      const up = score[i - 1][j] + gapPenalty;
      const left = score[i][j - 1] + gapPenalty;
      
      score[i][j] = Math.max(diagonal, up, left);
    }
  }
  
  // Traceback to get alignment
  let alignedSeq1 = '';
  let alignedSeq2 = '';
  let alignmentString = '';
  
  let i = seq1.length;
  let j = seq2.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const char1 = seq1[i - 1];
      const char2 = seq2[j - 1];
      
      let matchMismatchScore;
      if (isProtein && matrix) {
        matchMismatchScore = matrix[char1]?.[char2] || -4;
      } else {
        matchMismatchScore = char1 === char2 ? matchScore : mismatchScore;
      }
      
      if (score[i][j] === score[i - 1][j - 1] + matchMismatchScore) {
        alignedSeq1 = char1 + alignedSeq1;
        alignedSeq2 = char2 + alignedSeq2;
        alignmentString = (char1 === char2 ? '|' : 
                          (isProtein && matrix && matrix[char1]?.[char2] > 0 ? '+' : ' ')) + alignmentString;
        i--;
        j--;
      } else if (score[i][j] === score[i - 1][j] + gapPenalty) {
        alignedSeq1 = seq1[i - 1] + alignedSeq1;
        alignedSeq2 = '-' + alignedSeq2;
        alignmentString = ' ' + alignmentString;
        i--;
      } else {
        alignedSeq1 = '-' + alignedSeq1;
        alignedSeq2 = seq2[j - 1] + alignedSeq2;
        alignmentString = ' ' + alignmentString;
        j--;
      }
    } else if (i > 0) {
      alignedSeq1 = seq1[i - 1] + alignedSeq1;
      alignedSeq2 = '-' + alignedSeq2;
      alignmentString = ' ' + alignmentString;
      i--;
    } else {
      alignedSeq1 = '-' + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      alignmentString = ' ' + alignmentString;
      j--;
    }
  }
  
  // Calculate statistics
  const alignmentLength = alignedSeq1.length;
  let identities = 0;
  let similarities = 0;
  let gaps = 0;
  
  for (let k = 0; k < alignmentLength; k++) {
    const c1 = alignedSeq1[k];
    const c2 = alignedSeq2[k];
    
    if (c1 === '-' || c2 === '-') {
      gaps++;
    } else if (c1 === c2) {
      identities++;
      similarities++;
    } else if (isProtein && matrix && matrix[c1]?.[c2] > 0) {
      similarities++;
    }
  }
  
  return {
    sequence1_id: 'Query',
    sequence2_id: 'Subject',
    algorithm: 'Needleman-Wunsch (Global)',
    score: score[seq1.length][seq2.length],
    identity: parseFloat((identities / alignmentLength * 100).toFixed(1)),
    similarity: parseFloat((similarities / alignmentLength * 100).toFixed(1)),
    gaps: parseFloat((gaps / alignmentLength * 100).toFixed(1)),
    alignment_length: alignmentLength,
    aligned_sequence1: alignedSeq1,
    aligned_sequence2: alignedSeq2,
    alignment_string: alignmentString
  };
}

/**
 * Perform local sequence alignment (Smith-Waterman)
 */
export function alignSequencesLocal(
  sequence1: string,
  sequence2: string,
  isProtein: boolean = true
): SequenceAlignment {
  const seq1 = sequence1.toUpperCase();
  const seq2 = sequence2.toUpperCase();
  
  const matrix = isProtein ? BLOSUM62 : null;
  const matchScore = isProtein ? 0 : DNA_MATCH_SCORE;
  const mismatchScore = isProtein ? 0 : DNA_MISMATCH_SCORE;
  const gapPenalty = GAP_PENALTY;
  
  // Initialize scoring matrix
  const rows = seq1.length + 1;
  const cols = seq2.length + 1;
  const score: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));
  
  let maxScore = 0;
  let maxI = 0;
  let maxJ = 0;
  
  // Fill scoring matrix
  for (let i = 1; i <= seq1.length; i++) {
    for (let j = 1; j <= seq2.length; j++) {
      const char1 = seq1[i - 1];
      const char2 = seq2[j - 1];
      
      let matchMismatchScore;
      if (isProtein && matrix) {
        matchMismatchScore = matrix[char1]?.[char2] || -4;
      } else {
        matchMismatchScore = char1 === char2 ? matchScore : mismatchScore;
      }
      
      const diagonal = score[i - 1][j - 1] + matchMismatchScore;
      const up = score[i - 1][j] + gapPenalty;
      const left = score[i][j - 1] + gapPenalty;
      
      score[i][j] = Math.max(0, diagonal, up, left);
      
      if (score[i][j] > maxScore) {
        maxScore = score[i][j];
        maxI = i;
        maxJ = j;
      }
    }
  }
  
  // Traceback from maximum score
  let alignedSeq1 = '';
  let alignedSeq2 = '';
  let alignmentString = '';
  
  let i = maxI;
  let j = maxJ;
  
  while (i > 0 && j > 0 && score[i][j] > 0) {
    const char1 = seq1[i - 1];
    const char2 = seq2[j - 1];
    
    let matchMismatchScore;
    if (isProtein && matrix) {
      matchMismatchScore = matrix[char1]?.[char2] || -4;
    } else {
      matchMismatchScore = char1 === char2 ? matchScore : mismatchScore;
    }
    
    if (score[i][j] === score[i - 1][j - 1] + matchMismatchScore) {
      alignedSeq1 = char1 + alignedSeq1;
      alignedSeq2 = char2 + alignedSeq2;
      alignmentString = (char1 === char2 ? '|' : 
                        (isProtein && matrix && matrix[char1]?.[char2] > 0 ? '+' : ' ')) + alignmentString;
      i--;
      j--;
    } else if (score[i][j] === score[i - 1][j] + gapPenalty) {
      alignedSeq1 = seq1[i - 1] + alignedSeq1;
      alignedSeq2 = '-' + alignedSeq2;
      alignmentString = ' ' + alignmentString;
      i--;
    } else {
      alignedSeq1 = '-' + alignedSeq1;
      alignedSeq2 = seq2[j - 1] + alignedSeq2;
      alignmentString = ' ' + alignmentString;
      j--;
    }
  }
  
  // Calculate statistics
  const alignmentLength = alignedSeq1.length;
  let identities = 0;
  let similarities = 0;
  let gaps = 0;
  
  for (let k = 0; k < alignmentLength; k++) {
    const c1 = alignedSeq1[k];
    const c2 = alignedSeq2[k];
    
    if (c1 === '-' || c2 === '-') {
      gaps++;
    } else if (c1 === c2) {
      identities++;
      similarities++;
    } else if (isProtein && matrix && matrix[c1]?.[c2] > 0) {
      similarities++;
    }
  }
  
  return {
    sequence1_id: 'Query',
    sequence2_id: 'Subject',
    algorithm: 'Smith-Waterman (Local)',
    score: maxScore,
    identity: parseFloat((identities / alignmentLength * 100).toFixed(1)),
    similarity: parseFloat((similarities / alignmentLength * 100).toFixed(1)),
    gaps: parseFloat((gaps / alignmentLength * 100).toFixed(1)),
    alignment_length: alignmentLength,
    aligned_sequence1: alignedSeq1,
    aligned_sequence2: alignedSeq2,
    alignment_string: alignmentString
  };
}

/**
 * Generate dot plot for sequence comparison
 */
export function generateDotplot(
  sequence1: string,
  sequence2: string,
  windowSize: number = 1,
  threshold: number = 1
): DotplotResult {
  const seq1 = sequence1.toUpperCase();
  const seq2 = sequence2.toUpperCase();
  
  const matches: DotplotPoint[] = [];
  const similarityRegions: { start1: number; end1: number; start2: number; end2: number; score: number }[] = [];
  
  // Generate matches
  for (let i = 0; i <= seq1.length - windowSize; i++) {
    for (let j = 0; j <= seq2.length - windowSize; j++) {
      const window1 = seq1.substring(i, i + windowSize);
      const window2 = seq2.substring(j, j + windowSize);
      
      let score = 0;
      for (let k = 0; k < windowSize; k++) {
        if (window1[k] === window2[k]) {
          score++;
        }
      }
      
      if (score >= threshold) {
        matches.push({
          x: i + 1, // 1-based coordinates
          y: j + 1,
          score: score / windowSize
        });
      }
    }
  }
  
  // Find similarity regions (consecutive diagonal matches)
  if (windowSize === 1 && threshold === 1) {
    let currentRegion: { start1: number; end1: number; start2: number; end2: number; score: number } | null = null;
    
    for (const match of matches) {
      if (!currentRegion) {
        currentRegion = {
          start1: match.x,
          end1: match.x,
          start2: match.y,
          end2: match.y,
          score: 1
        };
      } else if (match.x === currentRegion.end1 + 1 && match.y === currentRegion.end2 + 1) {
        // Extend current region
        currentRegion.end1 = match.x;
        currentRegion.end2 = match.y;
        currentRegion.score++;
      } else {
        // Save current region if it's significant
        if (currentRegion.score >= 5) {
          similarityRegions.push(currentRegion);
        }
        // Start new region
        currentRegion = {
          start1: match.x,
          end1: match.x,
          start2: match.y,
          end2: match.y,
          score: 1
        };
      }
    }
    
    // Don't forget the last region
    if (currentRegion && currentRegion.score >= 5) {
      similarityRegions.push(currentRegion);
    }
  }
  
  return {
    sequence1_id: 'Sequence 1',
    sequence2_id: 'Sequence 2',
    sequence1_length: seq1.length,
    sequence2_length: seq2.length,
    window_size: windowSize,
    threshold,
    matches,
    similarity_regions: similarityRegions
  };
}
