/**
 * NCBI/GenBank nucleotide sequence utility functions
 */

import { 
  NCBISequenceResult, 
  EnsemblSequenceResult, 
  AnnotationComparison,
  AnnotationFeature,
  IntronExonResult,
  PromoterAlignmentResult
} from "../types/interfaces.js";
import { 
  NCBI_NUCLEOTIDE_BASE_URL, 
  ENSEMBL_BASE_URL, 
  BIO_USER_AGENT, 
  DEFAULT_REQUEST_TIMEOUT 
} from "./config.js";

/**
 * Make a request to NCBI E-utilities
 */
export async function makeNCBIRequest<T>(
  url: string, 
  acceptHeader: string = "application/json"
): Promise<T | null> {
  const headers = {
    "User-Agent": BIO_USER_AGENT,
    Accept: acceptHeader,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT);
    
    const response = await fetch(url, { 
      headers, 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    if (acceptHeader === "application/json") {
      return (await response.json()) as T;
    } else {
      return (await response.text()) as T;
    }
  } catch (error) {
    console.error("Error making NCBI request:", error);
    return null;
  }
}

/**
 * Make a request to Ensembl REST API
 */
export async function makeEnsemblRequest<T>(url: string): Promise<T | null> {
  const headers = {
    "User-Agent": BIO_USER_AGENT,
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT);
    
    const response = await fetch(url, { 
      headers, 
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making Ensembl request:", error);
    return null;
  }
}

/**
 * Retrieve nucleotide sequence from GenBank/RefSeq
 */
export async function getNucleotideSequence(
  accession: string, 
  database: 'genbank' | 'refseq' | 'ensembl' = 'genbank',
  format: 'fasta' | 'genbank' | 'json' = 'fasta'
): Promise<NCBISequenceResult | EnsemblSequenceResult | string | null> {
  
  if (database === 'ensembl') {
    // Handle Ensembl requests
    const url = `${ENSEMBL_BASE_URL}/sequence/id/${accession}?content-type=text/plain`;
    const sequence = await makeEnsemblRequest<string>(url);
    
    if (!sequence) return null;
    
    // Get additional info
    const infoUrl = `${ENSEMBL_BASE_URL}/lookup/id/${accession}?expand=1`;
    const info = await makeEnsemblRequest<any>(infoUrl);
    
    return {
      id: accession,
      desc: info?.description || "Ensembl sequence",
      seq: sequence,
      length: sequence.length,
      assembly: info?.assembly_name || "Unknown",
      coord_system: info?.coord_system_name || "Unknown",
      start: info?.start || 0,
      end: info?.end || sequence.length,
      strand: info?.strand || 1
    } as EnsemblSequenceResult;
  }
  
  // Handle NCBI GenBank/RefSeq requests
  const dbName = database === 'refseq' ? 'nucleotide' : 'nucleotide';
  
  if (format === 'fasta') {
    const url = `${NCBI_NUCLEOTIDE_BASE_URL}efetch.fcgi?db=${dbName}&id=${accession}&rettype=fasta&retmode=text`;
    return await makeNCBIRequest<string>(url, "text/plain");
  }
  
  if (format === 'genbank') {
    const url = `${NCBI_NUCLEOTIDE_BASE_URL}efetch.fcgi?db=${dbName}&id=${accession}&rettype=gb&retmode=text`;
    return await makeNCBIRequest<string>(url, "text/plain");
  }
  
  // For JSON format, we need to parse GenBank format with comprehensive data
  const gbUrl = `${NCBI_NUCLEOTIDE_BASE_URL}efetch.fcgi?db=${dbName}&id=${accession}&rettype=gbwithparts&retmode=text&complexity=1`;
  const gbText = await makeNCBIRequest<string>(gbUrl, "text/plain");
  
  if (!gbText) return null;
  
  // Also get comprehensive XML data for additional details
  const xmlUrl = `${NCBI_NUCLEOTIDE_BASE_URL}efetch.fcgi?db=${dbName}&id=${accession}&rettype=gb&retmode=xml`;
  const xmlData = await makeNCBIRequest<string>(xmlUrl, "application/xml");
  
  return parseGenBankToJSON(gbText, accession, xmlData);
}

/**
 * Parse GenBank format to structured JSON with comprehensive data
 */
function parseGenBankToJSON(gbText: string, accession: string, xmlData?: string | null): NCBISequenceResult {
  const lines = gbText.split('\n');
  let sequence = '';
  let inSequence = false;
  let inFeatures = false;
  let currentFeature: any = null;
  let title = '';
  let organism = '';
  let createDate = '';
  let updateDate = '';
  let length = 0;
  let moleculeType = '';
  let topology = 'linear';
  let division = '';
  let taxonomyId = '';
  let fullTaxonomy = '';
  let accessionVersion = '';
  let gi = '';
  let keywords = '';
  let references: any[] = [];
  let currentReference: any = null;
  const features: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // LOCUS line - comprehensive parsing
    if (line.startsWith('LOCUS')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) length = parseInt(parts[2]) || 0;
      if (parts.length >= 4) moleculeType = parts[3] || 'DNA';
      if (parts.length >= 5) topology = parts[4] || 'linear';
      if (parts.length >= 6) division = parts[5] || '';
      if (parts.length >= 7) updateDate = parts[6] || '';
    }
    
    // DEFINITION - multi-line support
    if (line.startsWith('DEFINITION')) {
      title = line.substring(12).trim();
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('            ')) {
        title += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;
    }
    
    // ACCESSION and VERSION
    if (line.startsWith('ACCESSION')) {
      // Primary accession is already the accession parameter
    }
    
    if (line.startsWith('VERSION')) {
      const versionMatch = line.match(/VERSION\s+([^\s]+)(?:\s+GI:(\d+))?/);
      if (versionMatch) {
        accessionVersion = versionMatch[1];
        gi = versionMatch[2] || '';
      }
    }
    
    // KEYWORDS
    if (line.startsWith('KEYWORDS')) {
      keywords = line.substring(12).trim();
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('            ')) {
        keywords += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;
      keywords = keywords.replace(/\.$/, ''); // Remove trailing period
    }
    
    // SOURCE and ORGANISM
    if (line.startsWith('SOURCE')) {
      organism = line.substring(12).trim();
    }
    
    if (line.trim().startsWith('ORGANISM')) {
      fullTaxonomy = line.replace(/^\s*ORGANISM\s+/, '').trim();
      let j = i + 1;
      while (j < lines.length && lines[j].startsWith('            ')) {
        fullTaxonomy += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;
      
      // Extract taxonomy ID if available
      const taxIdMatch = fullTaxonomy.match(/taxid:(\d+)/);
      if (taxIdMatch) {
        taxonomyId = taxIdMatch[1];
      }
    }
    
    // REFERENCE parsing
    if (line.startsWith('REFERENCE')) {
      if (currentReference) {
        references.push(currentReference);
      }
      currentReference = {
        number: line.match(/REFERENCE\s+(\d+)/)?.[1] || '',
        range: line.match(/\(bases\s+([^)]+)\)/)?.[1] || '',
        authors: '',
        title: '',
        journal: '',
        pubmed: '',
        doi: ''
      };
    }
    
    if (currentReference) {
      if (line.trim().startsWith('AUTHORS')) {
        currentReference.authors = line.replace(/^\s*AUTHORS\s+/, '').trim();
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('            ')) {
          currentReference.authors += ' ' + lines[j].trim();
          j++;
        }
        i = j - 1;
      }
      
      if (line.trim().startsWith('TITLE')) {
        currentReference.title = line.replace(/^\s*TITLE\s+/, '').trim();
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('            ')) {
          currentReference.title += ' ' + lines[j].trim();
          j++;
        }
        i = j - 1;
      }
      
      if (line.trim().startsWith('JOURNAL')) {
        currentReference.journal = line.replace(/^\s*JOURNAL\s+/, '').trim();
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('            ')) {
          currentReference.journal += ' ' + lines[j].trim();
          j++;
        }
        i = j - 1;
      }
      
      if (line.trim().startsWith('PUBMED')) {
        currentReference.pubmed = line.replace(/^\s*PUBMED\s+/, '').trim();
      }
    }
    
    // FEATURES section
    if (line.startsWith('FEATURES')) {
      inFeatures = true;
      continue;
    }
    
    if (line.startsWith('ORIGIN')) {
      inFeatures = false;
      inSequence = true;
      // Add the last reference if any
      if (currentReference) {
        references.push(currentReference);
        currentReference = null;
      }
      continue;
    }
    
    if (line.startsWith('//')) {
      inSequence = false;
      inFeatures = false;
      break;
    }
    
    // Parse features with comprehensive qualifiers
    if (inFeatures && line.length > 5) {
      if (!line.startsWith('     ')) {
        // New feature
        if (currentFeature) {
          features.push(currentFeature);
        }
        
        const featureMatch = line.match(/^\s+(\w+)\s+(.+)/);
        if (featureMatch) {
          currentFeature = {
            type: featureMatch[1],
            location: featureMatch[2].trim(),
            qualifiers: {}
          };
        }
      } else if (currentFeature && line.trim().startsWith('/')) {
        // Qualifier line
        const qualifierMatch = line.match(/^\s+\/([^=]+)=?"?([^"]*)"?/);
        if (qualifierMatch) {
          const key = qualifierMatch[1].trim();
          let value = qualifierMatch[2].trim().replace(/^"/, '').replace(/"$/, '');
          
          // Handle multi-line qualifiers
          let j = i + 1;
          while (j < lines.length && lines[j].startsWith('                     ')) {
            value += ' ' + lines[j].trim().replace(/^"/, '').replace(/"$/, '');
            j++;
          }
          i = j - 1;
          
          if (!currentFeature.qualifiers[key]) {
            currentFeature.qualifiers[key] = [];
          }
          currentFeature.qualifiers[key].push(value);
        }
      }
    }
    
    // Sequence parsing
    if (inSequence) {
      const seqLine = line.replace(/^\s*\d+\s*/, '').replace(/\s+/g, '');
      sequence += seqLine;
    }
  }
  
  // Add the last feature if any
  if (currentFeature) {
    features.push(currentFeature);
  }
  
  // Add the last reference if any
  if (currentReference) {
    references.push(currentReference);
  }
  
  // Parse additional data from XML if available
  let xmlParsedData: any = {};
  if (xmlData) {
    xmlParsedData = parseGenBankXMLData(xmlData);
  }
  
  return {
    sequences: [{
      accession: accession,
      version: accessionVersion || accession,
      title: title,
      organism: organism,
      sequence: sequence.toUpperCase(),
      length: sequence.length || length,
      moleculeType: moleculeType,
      topology: topology,
      createDate: createDate,
      updateDate: updateDate,
      division: division,
      keywords: keywords,
      taxonomyId: taxonomyId,
      fullTaxonomy: fullTaxonomy,
      gi: gi,
      references: references,
      features: features,
      // Additional data from XML parsing
      ...xmlParsedData
    }]
  };
}

/**
 * Parse additional data from GenBank XML
 */
function parseGenBankXMLData(xmlData: string): any {
  try {
    const data: any = {};
    
    // Extract additional taxonomy information
    const taxonomyMatch = xmlData.match(/<GBSeq_taxonomy>([^<]+)<\/GBSeq_taxonomy>/);
    if (taxonomyMatch) {
      data.detailedTaxonomy = taxonomyMatch[1];
    }
    
    // Extract create date
    const createDateMatch = xmlData.match(/<GBSeq_create-date>([^<]+)<\/GBSeq_create-date>/);
    if (createDateMatch) {
      data.createDate = createDateMatch[1];
    }
    
    // Extract update date
    const updateDateMatch = xmlData.match(/<GBSeq_update-date>([^<]+)<\/GBSeq_update-date>/);
    if (updateDateMatch) {
      data.updateDate = updateDateMatch[1];
    }
    
    // Extract additional identifiers
    const otherSeqIds: string[] = [];
    const seqIdPattern = /<GBSeqid>([^<]+)<\/GBSeqid>/g;
    let seqIdMatch;
    while ((seqIdMatch = seqIdPattern.exec(xmlData)) !== null) {
      otherSeqIds.push(seqIdMatch[1]);
    }
    if (otherSeqIds.length > 0) {
      data.otherSeqIds = otherSeqIds;
    }
    
    // Extract strain information if available
    const strainMatch = xmlData.match(/<GBQualifier_name>strain<\/GBQualifier_name>\s*<GBQualifier_value>([^<]+)<\/GBQualifier_value>/);
    if (strainMatch) {
      data.strain = strainMatch[1];
    }
    
    // Extract isolation source
    const isolationMatch = xmlData.match(/<GBQualifier_name>isolation_source<\/GBQualifier_name>\s*<GBQualifier_value>([^<]+)<\/GBQualifier_value>/);
    if (isolationMatch) {
      data.isolationSource = isolationMatch[1];
    }
    
    // Extract collection date
    const collectionDateMatch = xmlData.match(/<GBQualifier_name>collection_date<\/GBQualifier_name>\s*<GBQualifier_value>([^<]+)<\/GBQualifier_value>/);
    if (collectionDateMatch) {
      data.collectionDate = collectionDateMatch[1];
    }
    
    // Extract country/location
    const countryMatch = xmlData.match(/<GBQualifier_name>country<\/GBQualifier_name>\s*<GBQualifier_value>([^<]+)<\/GBQualifier_value>/);
    if (countryMatch) {
      data.country = countryMatch[1];
    }
    
    return data;
  } catch (error) {
    console.error("Error parsing XML data:", error);
    return {};
  }
}

/**
 * Compare annotations between prokaryotic and eukaryotic sequences
 */
export async function compareAnnotations(
  seq1_id: string,
  seq2_id: string,
  organismType: 'prokaryotic' | 'eukaryotic' | 'auto' = 'auto',
  featureTypes?: string[]
): Promise<AnnotationComparison | null> {
  
  // Get both sequences with annotations
  const seq1Data = await getNucleotideSequence(seq1_id, 'genbank', 'json') as NCBISequenceResult;
  const seq2Data = await getNucleotideSequence(seq2_id, 'genbank', 'json') as NCBISequenceResult;
  
  if (!seq1Data || !seq2Data || !seq1Data.sequences || !seq2Data.sequences) {
    return null;
  }
  
  const seq1 = seq1Data.sequences[0];
  const seq2 = seq2Data.sequences[0];
  
  // Determine organism types
  const seq1Type = organismType === 'auto' ? determineOrganismType(seq1.organism) : organismType;
  const seq2Type = organismType === 'auto' ? determineOrganismType(seq2.organism) : organismType;
  
  // Extract and filter features
  const seq1Features = extractFeatures(seq1.features || [], featureTypes);
  const seq2Features = extractFeatures(seq2.features || [], featureTypes);
  
  // Compare features
  const commonFeatures: AnnotationFeature[] = [];
  const uniqueToSeq1: AnnotationFeature[] = [];
  const uniqueToSeq2: AnnotationFeature[] = [];
  
  // Find common and unique features
  seq1Features.forEach(f1 => {
    const similar = seq2Features.find(f2 => 
      f1.type === f2.type && 
      Math.abs(f1.start - f2.start) < 100 && 
      Math.abs(f1.end - f2.end) < 100
    );
    if (similar) {
      commonFeatures.push(f1);
    } else {
      uniqueToSeq1.push(f1);
    }
  });
  
  seq2Features.forEach(f2 => {
    const similar = seq1Features.find(f1 => 
      f1.type === f2.type && 
      Math.abs(f1.start - f2.start) < 100 && 
      Math.abs(f1.end - f2.end) < 100
    );
    if (!similar) {
      uniqueToSeq2.push(f2);
    }
  });
  
  // Generate comparison insights
  const similarities: string[] = [];
  const differences: string[] = [];
  
  if (seq1Type === seq2Type) {
    similarities.push(`Both sequences are from ${seq1Type} organisms`);
  } else {
    differences.push(`Sequence 1 is ${seq1Type}, Sequence 2 is ${seq2Type}`);
  }
  
  if (commonFeatures.length > 0) {
    similarities.push(`${commonFeatures.length} common features found`);
  }
  
  if (seq1Type === 'prokaryotic' && seq2Type === 'eukaryotic') {
    differences.push("Prokaryotic sequences typically lack introns and have different promoter structures");
    differences.push("Eukaryotic sequences may have complex gene structures with introns and exons");
  }
  
  return {
    sequence1: {
      id: seq1_id,
      organism: seq1.organism,
      type: seq1Type,
      features: seq1Features
    },
    sequence2: {
      id: seq2_id,
      organism: seq2.organism,
      type: seq2Type,
      features: seq2Features
    },
    comparison: {
      commonFeatures,
      uniqueToSeq1,
      uniqueToSeq2,
      similarities,
      differences
    }
  };
}

/**
 * Determine organism type from organism name
 */
function determineOrganismType(organism: string): 'prokaryotic' | 'eukaryotic' {
  const prokaryoticKeywords = ['escherichia', 'bacillus', 'streptococcus', 'staphylococcus', 'pseudomonas'];
  const eukaryoticKeywords = ['homo', 'mus', 'rattus', 'drosophila', 'saccharomyces', 'arabidopsis'];
  
  const orgLower = organism.toLowerCase();
  
  if (prokaryoticKeywords.some(keyword => orgLower.includes(keyword))) {
    return 'prokaryotic';
  }
  
  if (eukaryoticKeywords.some(keyword => orgLower.includes(keyword))) {
    return 'eukaryotic';
  }
  
  // Default assumption for unknown organisms
  return 'eukaryotic';
}

/**
 * Extract and format features from sequence data
 */
function extractFeatures(features: any[], featureTypes?: string[]): AnnotationFeature[] {
  return features
    .filter(f => !featureTypes || featureTypes.includes(f.type))
    .map(f => {
      // Parse location (simplified)
      const locationMatch = f.location.match(/(\d+)\.\.(\d+)/);
      const start = locationMatch ? parseInt(locationMatch[1]) : 0;
      const end = locationMatch ? parseInt(locationMatch[2]) : 0;
      const strand = f.location.includes('complement') ? -1 : 1;
      
      return {
        type: f.type,
        start,
        end,
        strand,
        product: f.qualifiers?.product?.[0],
        gene: f.qualifiers?.gene?.[0],
        note: f.qualifiers?.note?.[0],
        qualifiers: f.qualifiers || {}
      };
    });
}

/**
 * Find intron-exon boundaries in a gene sequence
 */
export async function findIntronExons(
  sequenceId: string,
  organism?: string,
  geneName?: string,
  spliceSiteAnalysis: boolean = true
): Promise<IntronExonResult | null> {
  
  // Get sequence data
  const seqData = await getNucleotideSequence(sequenceId, 'genbank', 'json') as NCBISequenceResult;
  
  if (!seqData || !seqData.sequences || seqData.sequences.length === 0) {
    return null;
  }
  
  const sequence = seqData.sequences[0];
  
  // For this example, we'll implement a simplified intron-exon detection
  // In a real implementation, this would use sophisticated gene prediction algorithms
  
  const exons: any[] = [];
  const introns: any[] = [];
  let codingSequence = '';
  
  // Look for CDS features which indicate exons
  const cdsFeatures = sequence.features?.filter(f => f.type === 'CDS') || [];
  
  if (cdsFeatures.length > 0) {
    // Sort features by position
    cdsFeatures.sort((a, b) => {
      const aStart = parseInt(a.location.match(/(\d+)/)?.[1] || '0');
      const bStart = parseInt(b.location.match(/(\d+)/)?.[1] || '0');
      return aStart - bStart;
    });
    
    cdsFeatures.forEach((cds, index) => {
      const locationMatch = cds.location.match(/(\d+)\.\.(\d+)/);
      if (locationMatch) {
        const start = parseInt(locationMatch[1]);
        const end = parseInt(locationMatch[2]);
        const exonSeq = sequence.sequence.substring(start - 1, end);
        
        exons.push({
          number: index + 1,
          start,
          end,
          length: end - start + 1,
          sequence: exonSeq
        });
        
        codingSequence += exonSeq;
        
        // Add intron if there's a gap to the next exon
        if (index < cdsFeatures.length - 1) {
          const nextLocationMatch = cdsFeatures[index + 1].location.match(/(\d+)\.\.(\d+)/);
          if (nextLocationMatch) {
            const nextStart = parseInt(nextLocationMatch[1]);
            if (nextStart > end + 1) {
              const intronStart = end + 1;
              const intronEnd = nextStart - 1;
              const intronSeq = sequence.sequence.substring(intronStart - 1, intronEnd);
              
              const spliceSites = spliceSiteAnalysis ? {
                donor: intronSeq.substring(0, 2), // First 2 bases (GT)
                acceptor: intronSeq.substring(intronSeq.length - 2) // Last 2 bases (AG)
              } : { donor: '', acceptor: '' };
              
              introns.push({
                number: index + 1,
                start: intronStart,
                end: intronEnd,
                length: intronEnd - intronStart + 1,
                sequence: intronSeq,
                spliceSites
              });
            }
          }
        }
      }
    });
  }
  
  return {
    sequenceId,
    organism: organism || sequence.organism,
    geneStructure: {
      exons,
      introns,
      totalExons: exons.length,
      totalIntrons: introns.length,
      codingSequence
    }
  };
}

/**
 * Align promoter regions and find conserved elements
 */
export async function alignPromoters(
  sequenceList: string[],
  organism?: string,
  upstreamLength: number = 2000,
  motifSearch: boolean = true
): Promise<PromoterAlignmentResult | null> {
  
  const sequences: any[] = [];
  
  // Get promoter regions for each sequence
  for (const seqId of sequenceList) {
    try {
      const seqData = await getNucleotideSequence(seqId, 'genbank', 'json') as NCBISequenceResult;
      
      if (seqData && seqData.sequences && seqData.sequences.length > 0) {
        const seq = seqData.sequences[0];
        
        // Find TSS (transcription start site) - simplified approach
        const geneFeatures = seq.features?.filter(f => f.type === 'gene') || [];
        
        if (geneFeatures.length > 0) {
          const geneStart = parseInt(geneFeatures[0].location.match(/(\d+)/)?.[1] || '0');
          const promoterStart = Math.max(1, geneStart - upstreamLength);
          const promoterEnd = geneStart - 1;
          
          const promoterRegion = seq.sequence.substring(promoterStart - 1, promoterEnd);
          
          sequences.push({
            id: seqId,
            organism: seq.organism,
            promoterRegion,
            tssPosition: geneStart
          });
        }
      }
    } catch (error) {
      console.error(`Error processing sequence ${seqId}:`, error);
    }
  }
  
  if (sequences.length < 2) {
    return null;
  }
  
  // Simple alignment and consensus finding
  const alignmentMatrix: string[] = [];
  const conservedElements: any[] = [];
  
  // Find the shortest sequence for alignment
  const minLength = Math.min(...sequences.map(s => s.promoterRegion.length));
  
  // Create alignment matrix
  sequences.forEach(seq => {
    alignmentMatrix.push(seq.promoterRegion.substring(0, minLength));
  });
  
  // Find consensus sequence
  let consensusSequence = '';
  for (let i = 0; i < minLength; i++) {
    const bases = alignmentMatrix.map(seq => seq[i]);
    const baseCounts = bases.reduce((acc, base) => {
      acc[base] = (acc[base] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Find most common base
    const mostCommon = Object.entries(baseCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    consensusSequence += mostCommon[0];
  }
  
  // Find conserved elements if motif search is enabled
  if (motifSearch) {
    // Look for common promoter motifs
    const motifs = [
      { name: 'TATA', pattern: 'TATAAA', type: 'TATA' },
      { name: 'CAAT', pattern: 'CCAAT', type: 'CAAT' },
      { name: 'GC', pattern: 'GGGCGG', type: 'GC' },
      { name: 'Initiator', pattern: 'YYANWYY', type: 'Initiator' }
    ];
    
    motifs.forEach(motif => {
      const pattern = motif.pattern.replace(/Y/g, '[CT]').replace(/N/g, '[ATGC]').replace(/W/g, '[AT]');
      const regex = new RegExp(pattern, 'gi');
      
      let match;
      while ((match = regex.exec(consensusSequence)) !== null) {
        // Calculate conservation score
        const position = match.index;
        const sequence = match[0];
        
        let conservation = 0;
        for (let i = 0; i < sequence.length; i++) {
          const bases = alignmentMatrix.map(seq => seq[position + i] || 'N');
          const identical = bases.filter(base => base === sequence[i]).length;
          conservation += identical / bases.length;
        }
        conservation = conservation / sequence.length;
        
        if (conservation > 0.7) { // Only include highly conserved elements
          conservedElements.push({
            position,
            sequence,
            conservation,
            type: motif.type
          });
        }
      }
    });
  }
  
  return {
    sequences,
    alignment: {
      consensusSequence,
      conservedElements,
      alignmentMatrix
    }
  };
}
