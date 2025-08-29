/**
 * Protein structure and RNA analysis utility functions
 * Implements PDB retrieval, secondary structure analysis, RNA folding prediction
 */

export interface ProteinStructure {
  pdb_id: string;
  title: string;
  organism: string;
  resolution: number;
  method: string;
  release_date: string;
  chains: StructureChain[];
  ligands: Ligand[];
  keywords: string[];
  classification: string;
  authors: string[];
  journal: string;
  doi?: string;
}

export interface StructureChain {
  chain_id: string;
  sequence: string;
  length: number;
  molecule_type: string;
  organism: string;
  secondary_structures: SecondaryStructureElement[];
}

export interface SecondaryStructureElement {
  type: 'helix' | 'sheet' | 'turn' | 'coil';
  start: number;
  end: number;
  length: number;
  identifier?: string;
}

export interface Ligand {
  id: string;
  name: string;
  formula: string;
  molecular_weight: number;
  chains: string[];
}

export interface SecondaryStructureAnalysis {
  sequence_length: number;
  helix_content: number;
  sheet_content: number;
  turn_content: number;
  coil_content: number;
  secondary_structures: SecondaryStructureElement[];
  structural_motifs: {
    alpha_helices: number;
    beta_sheets: number;
    beta_turns: number;
    loops: number;
  };
}

export interface RNASecondaryStructure {
  sequence: string;
  sequence_length: number;
  structure: string;
  free_energy: number;
  base_pairs: BasePair[];
  loops: Loop[];
  stems: Stem[];
  structure_type: string;
}

export interface BasePair {
  position1: number;
  position2: number;
  nucleotide1: string;
  nucleotide2: string;
  pair_type: 'watson-crick' | 'wobble' | 'mismatch';
  energy: number;
}

export interface Loop {
  type: 'hairpin' | 'bulge' | 'internal' | 'multi';
  start: number;
  end: number;
  length: number;
  sequence: string;
  energy: number;
}

export interface Stem {
  start1: number;
  end1: number;
  start2: number;
  end2: number;
  length: number;
  stability: number;
}

export interface RNAMotif {
  name: string;
  type: string;
  pattern: string;
  description: string;
  matches: {
    position: number;
    sequence: string;
    structure: string;
    score: number;
  }[];
}

export interface RNAMotifScanResult {
  sequence_length: number;
  motifs_found: number;
  motifs: RNAMotif[];
  functional_elements: {
    riboswitches: number;
    hairpins: number;
    pseudoknots: number;
    regulatory_elements: number;
  };
}

/**
 * Retrieve protein structure from PDB
 */
export async function getProteinStructure(pdbId: string): Promise<ProteinStructure> {
  try {
    // In production, this would use RCSB PDB REST API
    // For now, we'll create a comprehensive mock structure
    
    const mockStructure: ProteinStructure = {
      pdb_id: pdbId.toUpperCase(),
      title: `Crystal structure of protein ${pdbId.toUpperCase()}`,
      organism: 'Homo sapiens',
      resolution: 1.8 + Math.random() * 1.0, // 1.8-2.8 Å
      method: 'X-RAY DIFFRACTION',
      release_date: '2023-01-15',
      classification: 'TRANSFERASE/DNA',
      authors: ['Smith, J.', 'Johnson, A.', 'Brown, M.'],
      journal: 'Journal of Molecular Biology',
      doi: '10.1016/j.jmb.2023.167891',
      keywords: ['TRANSFERASE', 'DNA BINDING', 'PHOSPHORYLATION'],
      chains: [
        {
          chain_id: 'A',
          sequence: 'MKQLEDKVEELLSKNYHLENEVARLKKLVGER' + 'K'.repeat(200), // Mock 232 residue protein
          length: 232,
          molecule_type: 'protein',
          organism: 'Homo sapiens',
          secondary_structures: [
            { type: 'helix', start: 15, end: 32, length: 18, identifier: 'H1' },
            { type: 'sheet', start: 45, end: 52, length: 8, identifier: 'E1' },
            { type: 'helix', start: 68, end: 85, length: 18, identifier: 'H2' },
            { type: 'sheet', start: 95, end: 102, length: 8, identifier: 'E2' },
            { type: 'helix', start: 120, end: 140, length: 21, identifier: 'H3' },
            { type: 'turn', start: 141, end: 145, length: 5 },
            { type: 'sheet', start: 155, end: 162, length: 8, identifier: 'E3' },
            { type: 'helix', start: 180, end: 200, length: 21, identifier: 'H4' }
          ]
        }
      ],
      ligands: [
        {
          id: 'ATP',
          name: 'ADENOSINE-5\'-TRIPHOSPHATE',
          formula: 'C10 H16 N5 O13 P3',
          molecular_weight: 507.18,
          chains: ['A']
        },
        {
          id: 'MG',
          name: 'MAGNESIUM ION',
          formula: 'Mg',
          molecular_weight: 24.31,
          chains: ['A']
        }
      ]
    };
    
    return mockStructure;
    
  } catch (error) {
    throw new Error(`Failed to retrieve PDB structure ${pdbId}: ${error}`);
  }
}

/**
 * Analyze secondary structure from PDB data or predict from sequence
 */
export function analyzeSecondaryStructure(sequence: string, pdbData?: ProteinStructure): SecondaryStructureAnalysis {
  let secondaryStructures: SecondaryStructureElement[] = [];
  
  if (pdbData && pdbData.chains.length > 0) {
    // Use experimental structure data
    secondaryStructures = pdbData.chains[0].secondary_structures;
  } else {
    // Predict secondary structure using simplified algorithm
    secondaryStructures = predictSecondaryStructure(sequence);
  }
  
  const sequenceLength = sequence.length;
  let helixResidues = 0;
  let sheetResidues = 0;
  let turnResidues = 0;
  let coilResidues = 0;
  
  // Calculate coverage for each secondary structure type
  const coverage = new Array(sequenceLength).fill('coil');
  
  secondaryStructures.forEach(ss => {
    for (let i = ss.start - 1; i < ss.end; i++) {
      if (i >= 0 && i < sequenceLength) {
        coverage[i] = ss.type;
      }
    }
  });
  
  coverage.forEach(type => {
    switch (type) {
      case 'helix': helixResidues++; break;
      case 'sheet': sheetResidues++; break;
      case 'turn': turnResidues++; break;
      default: coilResidues++; break;
    }
  });
  
  const structuralMotifs = {
    alpha_helices: secondaryStructures.filter(ss => ss.type === 'helix').length,
    beta_sheets: secondaryStructures.filter(ss => ss.type === 'sheet').length,
    beta_turns: secondaryStructures.filter(ss => ss.type === 'turn').length,
    loops: secondaryStructures.filter(ss => ss.type === 'coil').length
  };
  
  return {
    sequence_length: sequenceLength,
    helix_content: parseFloat((helixResidues / sequenceLength * 100).toFixed(1)),
    sheet_content: parseFloat((sheetResidues / sequenceLength * 100).toFixed(1)),
    turn_content: parseFloat((turnResidues / sequenceLength * 100).toFixed(1)),
    coil_content: parseFloat((coilResidues / sequenceLength * 100).toFixed(1)),
    secondary_structures: secondaryStructures,
    structural_motifs: structuralMotifs
  };
}

/**
 * Simple secondary structure prediction (Chou-Fasman like)
 */
function predictSecondaryStructure(sequence: string): SecondaryStructureElement[] {
  const structures: SecondaryStructureElement[] = [];
  const seq = sequence.toUpperCase();
  
  // Simplified propensities for secondary structure
  const helixPropensity: { [aa: string]: number } = {
    'A': 1.42, 'E': 1.51, 'L': 1.21, 'M': 1.45, 'Q': 1.11, 'K': 1.16, 'R': 0.98
  };
  
  const sheetPropensity: { [aa: string]: number } = {
    'V': 1.70, 'I': 1.60, 'Y': 1.47, 'F': 1.38, 'W': 1.37, 'L': 1.30, 'T': 1.19
  };
  
  // Sliding window approach
  const windowSize = 6;
  let currentStructure: { type: 'helix' | 'sheet' | 'coil'; start: number } | null = null;
  
  for (let i = 0; i < seq.length - windowSize; i++) {
    const window = seq.substring(i, i + windowSize);
    let helixScore = 0;
    let sheetScore = 0;
    
    for (const aa of window) {
      helixScore += helixPropensity[aa] || 1.0;
      sheetScore += sheetPropensity[aa] || 1.0;
    }
    
    let predictedType: 'helix' | 'sheet' | 'coil' = 'coil';
    if (helixScore > sheetScore + 0.5) {
      predictedType = 'helix';
    } else if (sheetScore > helixScore + 0.5) {
      predictedType = 'sheet';
    }
    
    if (!currentStructure || currentStructure.type !== predictedType) {
      if (currentStructure && i - currentStructure.start >= 4) {
        structures.push({
          type: currentStructure.type,
          start: currentStructure.start + 1, // 1-based
          end: i,
          length: i - currentStructure.start
        });
      }
      currentStructure = { type: predictedType, start: i };
    }
  }
  
  // Add final structure
  if (currentStructure && seq.length - currentStructure.start >= 4) {
    structures.push({
      type: currentStructure.type,
      start: currentStructure.start + 1,
      end: seq.length,
      length: seq.length - currentStructure.start
    });
  }
  
  return structures;
}

/**
 * Predict RNA secondary structure using dynamic programming approach
 */
export function predictRNASecondaryStructure(sequence: string): RNASecondaryStructure {
  const rnaSeq = sequence.toUpperCase().replace(/T/g, 'U');
  const length = rnaSeq.length;
  
  // Energy parameters (simplified)
  const pairEnergy: { [pair: string]: number } = {
    'AU': -2.0, 'UA': -2.0,
    'GC': -3.4, 'CG': -3.4,
    'GU': -1.3, 'UG': -1.3
  };
  
  // Dynamic programming matrix for minimum free energy
  const dp: number[][] = Array(length).fill(null).map(() => Array(length).fill(0));
  const traceback: string[][] = Array(length).fill(null).map(() => Array(length).fill(''));
  
  // Fill DP matrix (simplified Nussinov algorithm)
  for (let len = 4; len <= length; len++) {
    for (let i = 0; i <= length - len; i++) {
      const j = i + len - 1;
      
      // Option 1: don't pair position j
      dp[i][j] = dp[i][j - 1];
      traceback[i][j] = 'skip';
      
      // Option 2: pair position j with some position k
      for (let k = i; k < j - 3; k++) {
        const pair = rnaSeq[k] + rnaSeq[j];
        if (pairEnergy[pair]) {
          const energy = dp[i][k - 1] + dp[k + 1][j - 1] + pairEnergy[pair];
          if (energy < dp[i][j]) {
            dp[i][j] = energy;
            traceback[i][j] = `pair_${k}`;
          }
        }
      }
    }
  }
  
  // Traceback to get structure
  const structure = new Array(length).fill('.');
  const basePairs: BasePair[] = [];
  
  function tracebackStructure(i: number, j: number) {
    if (i >= j) return;
    
    const action = traceback[i][j];
    if (action === 'skip') {
      tracebackStructure(i, j - 1);
    } else if (action.startsWith('pair_')) {
      const k = parseInt(action.split('_')[1]);
      structure[k] = '(';
      structure[j] = ')';
      
      const pair = rnaSeq[k] + rnaSeq[j];
      const pairType = pair === 'AU' || pair === 'UA' || pair === 'GC' || pair === 'CG' ? 'watson-crick' :
                      pair === 'GU' || pair === 'UG' ? 'wobble' : 'mismatch';
      
      basePairs.push({
        position1: k + 1, // 1-based
        position2: j + 1,
        nucleotide1: rnaSeq[k],
        nucleotide2: rnaSeq[j],
        pair_type: pairType,
        energy: pairEnergy[pair] || 0
      });
      
      tracebackStructure(i, k - 1);
      tracebackStructure(k + 1, j - 1);
    }
  }
  
  tracebackStructure(0, length - 1);
  
  // Analyze loops and stems
  const loops = analyzeLoops(rnaSeq, structure.join(''));
  const stems = analyzeStems(basePairs);
  
  const freeEnergy = dp[0][length - 1];
  
  return {
    sequence: rnaSeq,
    sequence_length: length,
    structure: structure.join(''),
    free_energy: parseFloat(freeEnergy.toFixed(2)),
    base_pairs: basePairs,
    loops,
    stems,
    structure_type: classifyRNAStructure(loops, stems)
  };
}

/**
 * Analyze loops in RNA secondary structure
 */
function analyzeLoops(sequence: string, structure: string): Loop[] {
  const loops: Loop[] = [];
  const stack: number[] = [];
  
  for (let i = 0; i < structure.length; i++) {
    if (structure[i] === '(') {
      stack.push(i);
    } else if (structure[i] === ')') {
      if (stack.length > 0) {
        const start = stack.pop()!;
        const loopSeq = sequence.substring(start + 1, i);
        
        if (loopSeq.length > 0) {
          const loopType = stack.length === 0 ? 'hairpin' : 
                          loopSeq.length < 3 ? 'bulge' : 'internal';
          
          loops.push({
            type: loopType,
            start: start + 2, // 1-based, after opening base
            end: i,           // 1-based, before closing base
            length: loopSeq.length,
            sequence: loopSeq,
            energy: -0.5 * loopSeq.length // Simplified energy
          });
        }
      }
    }
  }
  
  return loops;
}

/**
 * Analyze stems in RNA secondary structure
 */
function analyzeStems(basePairs: BasePair[]): Stem[] {
  const stems: Stem[] = [];
  const sortedPairs = basePairs.sort((a, b) => a.position1 - b.position1);
  
  let currentStem: { start1: number; end1: number; start2: number; end2: number; pairs: BasePair[] } | null = null;
  
  for (const pair of sortedPairs) {
    if (!currentStem) {
      currentStem = {
        start1: pair.position1,
        end1: pair.position1,
        start2: pair.position2,
        end2: pair.position2,
        pairs: [pair]
      };
    } else {
      // Check if this pair continues the current stem
      const lastPair: BasePair = currentStem.pairs[currentStem.pairs.length - 1];
      if (pair.position1 === lastPair.position1 + 1 && pair.position2 === lastPair.position2 - 1) {
        currentStem.end1 = pair.position1;
        currentStem.end2 = pair.position2;
        currentStem.pairs.push(pair);
      } else {
        // Finish current stem and start new one
        if (currentStem.pairs.length >= 2) {
          const stability = currentStem.pairs.reduce((sum, p) => sum + Math.abs(p.energy), 0);
          stems.push({
            start1: currentStem.start1,
            end1: currentStem.end1,
            start2: currentStem.end2,
            end2: currentStem.start2,
            length: currentStem.pairs.length,
            stability: parseFloat(stability.toFixed(2))
          });
        }
        
        currentStem = {
          start1: pair.position1,
          end1: pair.position1,
          start2: pair.position2,
          end2: pair.position2,
          pairs: [pair]
        };
      }
    }
  }
  
  // Don't forget the last stem
  if (currentStem && currentStem.pairs.length >= 2) {
    const stability = currentStem.pairs.reduce((sum, p) => sum + Math.abs(p.energy), 0);
    stems.push({
      start1: currentStem.start1,
      end1: currentStem.end1,
      start2: currentStem.end2,
      end2: currentStem.start2,
      length: currentStem.pairs.length,
      stability: parseFloat(stability.toFixed(2))
    });
  }
  
  return stems;
}

/**
 * Classify RNA structure type
 */
function classifyRNAStructure(loops: Loop[], stems: Stem[]): string {
  const hairpins = loops.filter(l => l.type === 'hairpin').length;
  const stemCount = stems.length;
  
  if (stemCount === 0) return 'Linear';
  if (stemCount === 1 && hairpins === 1) return 'Simple hairpin';
  if (stemCount >= 2 && hairpins >= 2) return 'Multi-hairpin structure';
  if (loops.some(l => l.type === 'internal')) return 'Structure with internal loops';
  return 'Complex secondary structure';
}

/**
 * Scan RNA sequence for known motifs
 */
export function scanRNAMotifs(sequence: string, structure?: string): RNAMotifScanResult {
  const rnaSeq = sequence.toUpperCase().replace(/T/g, 'U');
  
  // Common RNA motifs
  const rnaMotifs: { [name: string]: { type: string; patterns: RegExp[]; description: string } } = {
    'HAIRPIN_LOOP': {
      type: 'structural',
      patterns: [/([AUGC]{4,8})[AUGC]{3,6}\1/g], // Simplified hairpin pattern
      description: 'Hairpin loop structure'
    },
    'RIBOSOME_BINDING_SITE': {
      type: 'regulatory',
      patterns: [/AGGAGG/g, /GGAGGU/g],
      description: 'Ribosome binding site (Shine-Dalgarno)'
    },
    'KOZAK_SEQUENCE': {
      type: 'regulatory', 
      patterns: [/[AG]CCAUGG/g, /[AG]CC[AG]CCAUGG/g],
      description: 'Kozak consensus sequence'
    },
    'POLYA_SIGNAL': {
      type: 'regulatory',
      patterns: [/AAUAAA/g, /AUUAAA/g],
      description: 'Polyadenylation signal'
    },
    'IRES': {
      type: 'regulatory',
      patterns: [/GGGUCC/g, /GGGUCCUU/g],
      description: 'Internal ribosome entry site'
    },
    'TETRALOOP': {
      type: 'structural',
      patterns: [/G[AUGC]{2}C/g, /C[AUGC]{2}G/g],
      description: 'Stable tetraloop motif'
    },
    'PSEUDOKNOT': {
      type: 'structural',
      patterns: [/GGG[AUGC]{8,12}CCC/g],
      description: 'Pseudoknot structure motif'
    },
    'RIBOZYME': {
      type: 'catalytic',
      patterns: [/GUC[AUGC]{3,5}GAC/g],
      description: 'Ribozyme catalytic motif'
    }
  };
  
  const foundMotifs: RNAMotif[] = [];
  let functionalElements = {
    riboswitches: 0,
    hairpins: 0,
    pseudoknots: 0,
    regulatory_elements: 0
  };
  
  for (const [name, motifData] of Object.entries(rnaMotifs)) {
    const matches: { position: number; sequence: string; structure: string; score: number }[] = [];
    
    for (const pattern of motifData.patterns) {
      let match;
      while ((match = pattern.exec(rnaSeq)) !== null) {
        const matchStructure = structure ? structure.substring(match.index, match.index + match[0].length) : '.'.repeat(match[0].length);
        
        matches.push({
          position: match.index + 1, // 1-based
          sequence: match[0],
          structure: matchStructure,
          score: calculateMotifScore(match[0], matchStructure)
        });
        
        // Reset pattern for next search
        pattern.lastIndex = match.index + 1;
      }
      
      // Reset pattern after all searches
      pattern.lastIndex = 0;
    }
    
    if (matches.length > 0) {
      foundMotifs.push({
        name,
        type: motifData.type,
        pattern: motifData.patterns[0].source,
        description: motifData.description,
        matches
      });
      
      // Count functional elements
      if (motifData.type === 'regulatory') {
        functionalElements.regulatory_elements += matches.length;
      } else if (name.includes('HAIRPIN') || name.includes('TETRALOOP')) {
        functionalElements.hairpins += matches.length;
      } else if (name.includes('PSEUDOKNOT')) {
        functionalElements.pseudoknots += matches.length;
      }
    }
  }
  
  return {
    sequence_length: rnaSeq.length,
    motifs_found: foundMotifs.reduce((sum, motif) => sum + motif.matches.length, 0),
    motifs: foundMotifs,
    functional_elements: functionalElements
  };
}

/**
 * Calculate motif score based on sequence and structure
 */
function calculateMotifScore(sequence: string, structure: string): number {
  let score = 1.0;
  
  // Bonus for structured regions
  const structuredBases = structure.split('').filter(c => c !== '.').length;
  score += (structuredBases / sequence.length) * 0.5;
  
  // Bonus for conserved bases
  const gcContent = (sequence.match(/[GC]/g) || []).length / sequence.length;
  score += gcContent * 0.3;
  
  return parseFloat(score.toFixed(2));
}
