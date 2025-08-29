/**
 * Protein sequence analysis utility functions
 * Implements ProtParam algorithms and transmembrane prediction
 */

// Amino acid properties for calculations
const AMINO_ACID_WEIGHTS: { [key: string]: number } = {
  'A': 89.09, 'R': 174.20, 'N': 132.12, 'D': 133.10, 'C': 121.16,
  'Q': 146.15, 'E': 147.13, 'G': 75.07, 'H': 155.16, 'I': 131.17,
  'L': 131.17, 'K': 146.19, 'M': 149.21, 'F': 165.19, 'P': 115.13,
  'S': 105.09, 'T': 119.12, 'W': 204.23, 'Y': 181.19, 'V': 117.15
};

const PKA_VALUES: { [key: string]: { N_term?: number; C_term?: number; side_chain?: number } } = {
  'A': { N_term: 9.69, C_term: 2.34 },
  'R': { N_term: 9.04, C_term: 2.17, side_chain: 12.48 },
  'N': { N_term: 8.80, C_term: 2.02 },
  'D': { N_term: 9.60, C_term: 2.77, side_chain: 3.65 },
  'C': { N_term: 10.28, C_term: 1.96, side_chain: 8.18 },
  'Q': { N_term: 9.13, C_term: 2.17 },
  'E': { N_term: 9.62, C_term: 2.19, side_chain: 4.25 },
  'G': { N_term: 9.60, C_term: 2.34 },
  'H': { N_term: 9.17, C_term: 1.82, side_chain: 6.00 },
  'I': { N_term: 9.60, C_term: 2.36 },
  'L': { N_term: 9.60, C_term: 2.36 },
  'K': { N_term: 8.95, C_term: 2.18, side_chain: 10.53 },
  'M': { N_term: 9.21, C_term: 2.28 },
  'F': { N_term: 9.13, C_term: 1.83 },
  'P': { N_term: 10.96, C_term: 1.99 },
  'S': { N_term: 9.15, C_term: 2.21 },
  'T': { N_term: 9.10, C_term: 2.09 },
  'W': { N_term: 9.39, C_term: 2.38 },
  'Y': { N_term: 9.11, C_term: 2.20, side_chain: 10.07 },
  'V': { N_term: 9.62, C_term: 2.32 }
};

// Hydropathy index (Kyte-Doolittle)
const HYDROPATHY_INDEX: { [key: string]: number } = {
  'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
  'Q': -3.5, 'E': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
  'L': 3.8, 'K': -3.9, 'M': 1.9, 'F': 2.8, 'P': -1.6,
  'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
};

// PROSITE motif patterns (simplified)
const PROSITE_PATTERNS: { [key: string]: { pattern: RegExp; description: string; accession: string } } = {
  'N_GLYCOSYLATION': {
    pattern: /N[^P][ST][^P]/g,
    description: 'N-glycosylation site',
    accession: 'PS00001'
  },
  'PROTEIN_KINASE_C': {
    pattern: /[ST].[RK]/g,
    description: 'Protein kinase C phosphorylation site',
    accession: 'PS00005'
  },
  'CASEIN_KINASE_II': {
    pattern: /[ST]..[DE]/g,
    description: 'Casein kinase II phosphorylation site',
    accession: 'PS00006'
  },
  'TYROSINE_KINASE': {
    pattern: /[RK]..[DEYQ]Y.[PLVI]/g,
    description: 'Tyrosine kinase phosphorylation site',
    accession: 'PS00007'
  },
  'CAMP_PKA': {
    pattern: /[RK][RK].S/g,
    description: 'cAMP- and cGMP-dependent protein kinase phosphorylation site',
    accession: 'PS00004'
  },
  'MYRISTYLATION': {
    pattern: /^MG[^DEKRHPYW][^DEKRHPFW][^DEKRW]/g,
    description: 'N-myristoylation site',
    accession: 'PS00008'
  },
  'PRENYLATION': {
    pattern: /C[ALVI][ALI]X$/g,
    description: 'Prenylation motif',
    accession: 'PS00009'
  },
  'LEUCINE_ZIPPER': {
    pattern: /L.{6}L.{6}L.{6}L/g,
    description: 'Leucine zipper pattern',
    accession: 'PS00028'
  }
};

export interface ProteinProperties {
  sequence_length: number;
  molecular_weight: number;
  isoelectric_point: number;
  amino_acid_composition: { [aa: string]: { count: number; percentage: number } };
  extinction_coefficient: {
    at_280nm: number;
    at_280nm_reduced: number;
  };
  instability_index: number;
  aliphatic_index: number;
  hydropathy: number;
  charge_at_ph7: number;
}

export interface TransmembraneRegion {
  start: number;
  end: number;
  length: number;
  sequence: string;
  hydropathy_score: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface TransmembraneAnalysis {
  sequence_length: number;
  transmembrane_regions: TransmembraneRegion[];
  topology: string;
  membrane_probability: number;
  signal_peptide: {
    present: boolean;
    position?: number;
    sequence?: string;
  };
}

export interface ProteinMotif {
  name: string;
  pattern: string;
  description: string;
  accession: string;
  matches: {
    position: number;
    sequence: string;
    score?: number;
  }[];
}

export interface MotifScanResult {
  sequence_length: number;
  total_motifs: number;
  motifs_found: ProteinMotif[];
  functional_domains: {
    phosphorylation: number;
    glycosylation: number;
    membrane_targeting: number;
    structural: number;
  };
}

/**
 * Predict protein properties using ProtParam algorithms
 */
export function predictProteinProperties(sequence: string): ProteinProperties {
  const cleanSeq = sequence.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, '');
  const length = cleanSeq.length;
  
  // Calculate amino acid composition
  const composition: { [aa: string]: { count: number; percentage: number } } = {};
  for (const aa of 'ACDEFGHIKLMNPQRSTVWY') {
    const count = (cleanSeq.match(new RegExp(aa, 'g')) || []).length;
    composition[aa] = {
      count,
      percentage: length > 0 ? parseFloat((count / length * 100).toFixed(2)) : 0
    };
  }
  
  // Calculate molecular weight
  let molecularWeight = 0;
  for (const aa of cleanSeq) {
    molecularWeight += AMINO_ACID_WEIGHTS[aa] || 0;
  }
  // Subtract water molecules formed in peptide bonds
  molecularWeight -= (length - 1) * 18.015;
  
  // Calculate isoelectric point (simplified)
  const isoelectricPoint = calculateIsoelectricPoint(cleanSeq);
  
  // Calculate extinction coefficient
  const extCoeff = calculateExtinctionCoefficient(cleanSeq);
  
  // Calculate instability index
  const instabilityIndex = calculateInstabilityIndex(cleanSeq);
  
  // Calculate aliphatic index
  const aliphaticIndex = calculateAliphaticIndex(composition);
  
  // Calculate hydropathy (GRAVY)
  const hydropathy = calculateHydropathy(cleanSeq);
  
  // Calculate charge at pH 7
  const chargeAtPH7 = calculateChargeAtPH(cleanSeq, 7.0);
  
  return {
    sequence_length: length,
    molecular_weight: parseFloat(molecularWeight.toFixed(2)),
    isoelectric_point: parseFloat(isoelectricPoint.toFixed(2)),
    amino_acid_composition: composition,
    extinction_coefficient: extCoeff,
    instability_index: parseFloat(instabilityIndex.toFixed(2)),
    aliphatic_index: parseFloat(aliphaticIndex.toFixed(2)),
    hydropathy: parseFloat(hydropathy.toFixed(3)),
    charge_at_ph7: parseFloat(chargeAtPH7.toFixed(2))
  };
}

/**
 * Predict transmembrane regions using hydropathy analysis
 */
export function predictTransmembraneRegions(sequence: string): TransmembraneAnalysis {
  const cleanSeq = sequence.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, '');
  const windowSize = 19; // Standard for TM prediction
  const threshold = 1.6; // Hydropathy threshold for TM regions
  
  const transmembraneRegions: TransmembraneRegion[] = [];
  
  // Calculate hydropathy profile
  const hydropathyProfile: number[] = [];
  for (let i = 0; i <= cleanSeq.length - windowSize; i++) {
    const window = cleanSeq.substring(i, i + windowSize);
    let hydropathy = 0;
    for (const aa of window) {
      hydropathy += HYDROPATHY_INDEX[aa] || 0;
    }
    hydropathyProfile.push(hydropathy / windowSize);
  }
  
  // Find transmembrane regions
  let inTMRegion = false;
  let tmStart = 0;
  
  for (let i = 0; i < hydropathyProfile.length; i++) {
    if (!inTMRegion && hydropathyProfile[i] > threshold) {
      inTMRegion = true;
      tmStart = i;
    } else if (inTMRegion && hydropathyProfile[i] <= threshold) {
      inTMRegion = false;
      const tmEnd = i + windowSize - 1;
      const tmLength = tmEnd - tmStart + 1;
      
      if (tmLength >= 15) { // Minimum TM helix length
        const tmSequence = cleanSeq.substring(tmStart, tmEnd + 1);
        const avgHydropathy = hydropathyProfile.slice(tmStart, i).reduce((a, b) => a + b, 0) / (i - tmStart);
        
        transmembraneRegions.push({
          start: tmStart + 1, // 1-based
          end: tmEnd + 1,     // 1-based
          length: tmLength,
          sequence: tmSequence,
          hydropathy_score: parseFloat(avgHydropathy.toFixed(3)),
          confidence: avgHydropathy > 2.0 ? 'high' : avgHydropathy > 1.8 ? 'medium' : 'low'
        });
      }
    }
  }
  
  // Predict topology
  let topology = 'Cytoplasmic';
  if (transmembraneRegions.length > 0) {
    topology = transmembraneRegions.length === 1 ? 'Single-pass membrane protein' :
               `Multi-pass membrane protein (${transmembraneRegions.length} TM helices)`;
  }
  
  // Calculate membrane probability
  const membraneProbability = Math.min(1.0, transmembraneRegions.length * 0.3 + 
    (transmembraneRegions.reduce((sum, tm) => sum + tm.hydropathy_score, 0) / Math.max(1, transmembraneRegions.length)) * 0.2);
  
  // Check for signal peptide (simplified)
  const signalPeptide = checkSignalPeptide(cleanSeq);
  
  return {
    sequence_length: cleanSeq.length,
    transmembrane_regions: transmembraneRegions,
    topology,
    membrane_probability: parseFloat(membraneProbability.toFixed(3)),
    signal_peptide: signalPeptide
  };
}

/**
 * Scan protein sequence for known motifs
 */
export function scanProteinMotifs(sequence: string): MotifScanResult {
  const cleanSeq = sequence.toUpperCase().replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, '');
  const motifsFound: ProteinMotif[] = [];
  
  for (const [name, motifData] of Object.entries(PROSITE_PATTERNS)) {
    const matches: { position: number; sequence: string; score?: number }[] = [];
    let match;
    
    while ((match = motifData.pattern.exec(cleanSeq)) !== null) {
      matches.push({
        position: match.index + 1, // 1-based position
        sequence: match[0]
      });
      
      // Reset lastIndex to find overlapping matches
      motifData.pattern.lastIndex = match.index + 1;
    }
    
    if (matches.length > 0) {
      motifsFound.push({
        name,
        pattern: motifData.pattern.source,
        description: motifData.description,
        accession: motifData.accession,
        matches
      });
    }
    
    // Reset pattern for next use
    motifData.pattern.lastIndex = 0;
  }
  
  // Categorize functional domains
  const functionalDomains = {
    phosphorylation: 0,
    glycosylation: 0,
    membrane_targeting: 0,
    structural: 0
  };
  
  for (const motif of motifsFound) {
    if (motif.name.includes('KINASE') || motif.name.includes('PKA')) {
      functionalDomains.phosphorylation += motif.matches.length;
    } else if (motif.name.includes('GLYCOSYLATION')) {
      functionalDomains.glycosylation += motif.matches.length;
    } else if (motif.name.includes('MYRISTYLATION') || motif.name.includes('PRENYLATION')) {
      functionalDomains.membrane_targeting += motif.matches.length;
    } else if (motif.name.includes('ZIPPER')) {
      functionalDomains.structural += motif.matches.length;
    }
  }
  
  return {
    sequence_length: cleanSeq.length,
    total_motifs: motifsFound.reduce((sum, motif) => sum + motif.matches.length, 0),
    motifs_found: motifsFound,
    functional_domains: functionalDomains
  };
}

// Helper functions

function calculateIsoelectricPoint(sequence: string): number {
  // Simplified calculation - iterative approximation
  let pH = 7.0;
  let pHStep = 3.5;
  
  for (let i = 0; i < 100; i++) {
    const charge = calculateChargeAtPH(sequence, pH);
    
    if (Math.abs(charge) < 0.01) {
      break;
    }
    
    if (charge > 0) {
      pH += pHStep;
    } else {
      pH -= pHStep;
    }
    
    pHStep *= 0.5;
  }
  
  return pH;
}

function calculateChargeAtPH(sequence: string, pH: number): number {
  let charge = 0;
  
  // N-terminus
  const nTerm = sequence[0];
  if (nTerm && PKA_VALUES[nTerm]?.N_term) {
    charge += 1 / (1 + Math.pow(10, pH - PKA_VALUES[nTerm].N_term));
  }
  
  // C-terminus
  const cTerm = sequence[sequence.length - 1];
  if (cTerm && PKA_VALUES[cTerm]?.C_term) {
    charge -= 1 / (1 + Math.pow(10, PKA_VALUES[cTerm].C_term - pH));
  }
  
  // Side chains
  for (const aa of sequence) {
    const pKa = PKA_VALUES[aa]?.side_chain;
    if (pKa) {
      if (['R', 'K', 'H'].includes(aa)) {
        charge += 1 / (1 + Math.pow(10, pH - pKa));
      } else if (['D', 'E', 'C', 'Y'].includes(aa)) {
        charge -= 1 / (1 + Math.pow(10, pKa - pH));
      }
    }
  }
  
  return charge;
}

function calculateExtinctionCoefficient(sequence: string): { at_280nm: number; at_280nm_reduced: number } {
  const trpCount = (sequence.match(/W/g) || []).length;
  const tyrCount = (sequence.match(/Y/g) || []).length;
  const cysCount = (sequence.match(/C/g) || []).length;
  
  const at280nm = trpCount * 5500 + tyrCount * 1490 + (cysCount / 2) * 125;
  const at280nm_reduced = trpCount * 5500 + tyrCount * 1490;
  
  return { at_280nm: at280nm, at_280nm_reduced: at280nm_reduced };
}

function calculateInstabilityIndex(sequence: string): number {
  // Simplified instability index calculation
  // Based on statistical analysis of unstable proteins
  const instabilityFactors: { [dipeptide: string]: number } = {
    'AA': 1.0, 'AC': 44.94, 'AD': 54.92, 'AE': 3.72,
    // ... simplified set for demo
  };
  
  let instabilitySum = 0;
  let dipeptideCount = 0;
  
  for (let i = 0; i < sequence.length - 1; i++) {
    const dipeptide = sequence.substring(i, i + 2);
    const factor = instabilityFactors[dipeptide] || 1.0;
    instabilitySum += factor;
    dipeptideCount++;
  }
  
  return dipeptideCount > 0 ? (10 * instabilitySum) / dipeptideCount : 0;
}

function calculateAliphaticIndex(composition: { [aa: string]: { count: number; percentage: number } }): number {
  const A = composition['A']?.percentage || 0;
  const V = composition['V']?.percentage || 0;
  const I = composition['I']?.percentage || 0;
  const L = composition['L']?.percentage || 0;
  
  return A + 2.9 * V + 3.9 * (I + L);
}

function calculateHydropathy(sequence: string): number {
  let totalHydropathy = 0;
  let validAA = 0;
  
  for (const aa of sequence) {
    if (HYDROPATHY_INDEX[aa] !== undefined) {
      totalHydropathy += HYDROPATHY_INDEX[aa];
      validAA++;
    }
  }
  
  return validAA > 0 ? totalHydropathy / validAA : 0;
}

function checkSignalPeptide(sequence: string): { present: boolean; position?: number; sequence?: string } {
  // Simplified signal peptide prediction
  // Look for characteristics: hydrophobic core, basic N-terminus, cleavage site
  
  if (sequence.length < 15) {
    return { present: false };
  }
  
  const nTerm = sequence.substring(0, 30); // First 30 residues
  
  // Check for basic residues at N-terminus
  const basicCount = (nTerm.substring(0, 5).match(/[RK]/g) || []).length;
  
  // Check for hydrophobic core
  let maxHydrophobic = 0;
  let currentHydrophobic = 0;
  
  for (let i = 0; i < nTerm.length; i++) {
    const hydropathy = HYDROPATHY_INDEX[nTerm[i]] || 0;
    if (hydropathy > 1.0) {
      currentHydrophobic++;
      maxHydrophobic = Math.max(maxHydrophobic, currentHydrophobic);
    } else {
      currentHydrophobic = 0;
    }
  }
  
  // Simple scoring
  const score = basicCount * 0.3 + maxHydrophobic * 0.2;
  
  if (score > 2.0 && maxHydrophobic >= 6) {
    return {
      present: true,
      position: maxHydrophobic + 5, // Estimated cleavage site
      sequence: nTerm.substring(0, maxHydrophobic + 5)
    };
  }
  
  return { present: false };
}
