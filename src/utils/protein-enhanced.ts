/**
 * Enhanced protein analysis utility functions
 * Provides KEGG, PTM, and cross-reference analysis capabilities
 */

import { 
  CrossReferencesResult, 
  PTMAnalysisResult, 
  PathwayData 
} from "../types/interfaces.js";
import { 
  KEGG_BASE_URL, 
  PDB_BASE_URL, 
  INTERPRO_BASE_URL, 
  REACTOME_BASE_URL, 
  BIO_USER_AGENT,
  DEFAULT_REQUEST_TIMEOUT 
} from "./config.js";
import { getUniProtEntry } from "./uniprot.js";

/**
 * Make a request with timeout and error handling
 */
async function makeRequest<T>(
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
    console.error(`Error making request to ${url}:`, error);
    return null;
  }
}

/**
 * Get comprehensive cross-references for a protein
 */
export async function getCrossReferences(
  proteinId: string,
  databases?: string[],
  includeDetails: boolean = true
): Promise<CrossReferencesResult | null> {
  
  // Get UniProt entry first
  const uniprotEntry = await getUniProtEntry(proteinId.toUpperCase());
  
  if (!uniprotEntry) {
    return null;
  }
  
  const result: CrossReferencesResult = {
    proteinId: proteinId.toUpperCase(),
    references: {}
  };
  
  // Extract cross-references from UniProt
  const crossRefs = uniprotEntry.uniProtKBCrossReferences || [];
  
  // Process each database
  const requestedDbs = databases || ['kegg', 'pfam', 'pdb', 'interpro', 'go', 'reactome'];
  
  for (const db of requestedDbs) {
    switch (db.toLowerCase()) {
      case 'kegg':
        result.references.kegg = await getKEGGReferences(proteinId, crossRefs, includeDetails);
        break;
      case 'pfam':
        result.references.pfam = await getPfamReferences(proteinId, crossRefs, includeDetails);
        break;
      case 'pdb':
        result.references.pdb = await getPDBReferences(proteinId, crossRefs, includeDetails);
        break;
      case 'interpro':
        result.references.interpro = await getInterProReferences(proteinId, crossRefs, includeDetails);
        break;
      case 'go':
        result.references.go = await getGOReferences(proteinId, crossRefs, includeDetails);
        break;
    }
  }
  
  return result;
}

/**
 * Get KEGG pathway references
 */
async function getKEGGReferences(
  proteinId: string, 
  crossRefs: any[], 
  includeDetails: boolean
): Promise<any[] | undefined> {
  
  const keggRefs = crossRefs.filter(ref => ref.database === 'KEGG');
  
  if (!keggRefs.length) return undefined;
  
  const keggData: any[] = [];
  
  for (const ref of keggRefs.slice(0, 10)) { // Limit to 10 refs
    const keggEntry: any = {
      database: 'KEGG',
      id: ref.id
    };
    
    if (includeDetails) {
      try {
        // Get KEGG gene info
        const geneUrl = `${KEGG_BASE_URL}/get/${ref.id}`;
        const geneInfo = await makeRequest<string>(geneUrl, "text/plain");
        
        if (geneInfo) {
          // Parse KEGG response for pathway information
          const pathwayMatches = geneInfo.match(/PATHWAY\s+([^\n]+)/g);
          if (pathwayMatches) {
            keggEntry.pathway = pathwayMatches[0].replace('PATHWAY', '').trim();
          }
          
          const moduleMatches = geneInfo.match(/MODULE\s+([^\n]+)/g);
          if (moduleMatches) {
            keggEntry.module = moduleMatches[0].replace('MODULE', '').trim();
          }
        }
      } catch (error) {
        console.error(`Error fetching KEGG details for ${ref.id}:`, error);
      }
    }
    
    keggData.push(keggEntry);
  }
  
  return keggData.length > 0 ? keggData : undefined;
}

/**
 * Get Pfam domain references
 */
async function getPfamReferences(
  proteinId: string, 
  crossRefs: any[], 
  includeDetails: boolean
): Promise<any[] | undefined> {
  
  const pfamRefs = crossRefs.filter(ref => ref.database === 'Pfam');
  
  if (!pfamRefs.length) return undefined;
  
  const pfamData: any[] = [];
  
  for (const ref of pfamRefs.slice(0, 15)) { // Limit to 15 refs
    const pfamEntry: any = {
      id: ref.id,
      name: ref.id,
      description: '',
      start: 0,
      end: 0,
      evalue: 0
    };
    
    // Extract additional properties if available
    if (ref.properties) {
      ref.properties.forEach((prop: any) => {
        if (prop.key === 'entry name') pfamEntry.name = prop.value;
        if (prop.key === 'match status') pfamEntry.description = prop.value;
      });
    }
    
    if (includeDetails) {
      try {
        // Get Pfam family info (simplified)
        // Note: Pfam API has changed, this is a placeholder for the actual implementation
        pfamEntry.description = `Pfam domain ${ref.id}`;
      } catch (error) {
        console.error(`Error fetching Pfam details for ${ref.id}:`, error);
      }
    }
    
    pfamData.push(pfamEntry);
  }
  
  return pfamData.length > 0 ? pfamData : undefined;
}

/**
 * Get PDB structure references
 */
async function getPDBReferences(
  proteinId: string, 
  crossRefs: any[], 
  includeDetails: boolean
): Promise<any[] | undefined> {
  
  const pdbRefs = crossRefs.filter(ref => ref.database === 'PDB');
  
  if (!pdbRefs.length) return undefined;
  
  const pdbData: any[] = [];
  
  for (const ref of pdbRefs.slice(0, 20)) { // Limit to 20 structures
    const pdbEntry: any = {
      id: ref.id,
      method: '',
      resolution: '',
      chains: [],
      title: ''
    };
    
    if (includeDetails) {
      try {
        // Get PDB structure info
        const pdbUrl = `${PDB_BASE_URL}/entry/${ref.id}`;
        const pdbInfo = await makeRequest<any>(pdbUrl);
        
        if (pdbInfo) {
          pdbEntry.method = pdbInfo.exptl?.[0]?.method || 'Unknown';
          pdbEntry.resolution = pdbInfo.refine?.[0]?.ls_d_res_high || 'N/A';
          pdbEntry.title = pdbInfo.struct?.title || '';
          pdbEntry.chains = pdbInfo.struct_asym?.map((asym: any) => asym.id) || [];
        }
      } catch (error) {
        console.error(`Error fetching PDB details for ${ref.id}:`, error);
      }
    }
    
    // Extract chains from properties if available
    if (ref.properties) {
      ref.properties.forEach((prop: any) => {
        if (prop.key === 'chains') {
          pdbEntry.chains = prop.value.split(/[,;]/).map((s: string) => s.trim());
        }
        if (prop.key === 'method') pdbEntry.method = prop.value;
        if (prop.key === 'resolution') pdbEntry.resolution = prop.value;
      });
    }
    
    pdbData.push(pdbEntry);
  }
  
  return pdbData.length > 0 ? pdbData : undefined;
}

/**
 * Get InterPro domain references
 */
async function getInterProReferences(
  proteinId: string, 
  crossRefs: any[], 
  includeDetails: boolean
): Promise<any[] | undefined> {
  
  const interproRefs = crossRefs.filter(ref => ref.database === 'InterPro');
  
  if (!interproRefs.length) return undefined;
  
  const interproData: any[] = [];
  
  for (const ref of interproRefs.slice(0, 15)) { // Limit to 15 refs
    const interproEntry: any = {
      id: ref.id,
      name: ref.id,
      type: 'Domain'
    };
    
    if (includeDetails) {
      try {
        // Get InterPro entry info
        const interproUrl = `${INTERPRO_BASE_URL}/entry/interpro/${ref.id}`;
        const interproInfo = await makeRequest<any>(interproUrl);
        
        if (interproInfo) {
          interproEntry.name = interproInfo.metadata?.name || ref.id;
          interproEntry.type = interproInfo.metadata?.type || 'Domain';
        }
      } catch (error) {
        console.error(`Error fetching InterPro details for ${ref.id}:`, error);
      }
    }
    
    interproData.push(interproEntry);
  }
  
  return interproData.length > 0 ? interproData : undefined;
}

/**
 * Get Gene Ontology references
 */
async function getGOReferences(
  proteinId: string, 
  crossRefs: any[], 
  includeDetails: boolean
): Promise<any[] | undefined> {
  
  const goRefs = crossRefs.filter(ref => ref.database === 'GO');
  
  if (!goRefs.length) return undefined;
  
  const goData: any[] = [];
  
  for (const ref of goRefs.slice(0, 25)) { // Limit to 25 refs
    const goEntry: any = {
      id: ref.id,
      term: '',
      category: 'unknown' as 'biological_process' | 'molecular_function' | 'cellular_component',
      evidence: ''
    };
    
    // Extract GO term and evidence from properties
    if (ref.properties) {
      ref.properties.forEach((prop: any) => {
        if (prop.key === 'term') goEntry.term = prop.value;
        if (prop.key === 'evidence') goEntry.evidence = prop.value;
        if (prop.key === 'source') goEntry.evidence = prop.value;
      });
    }
    
    // Determine category from GO ID
    if (ref.id.startsWith('GO:')) {
      const goNumber = parseInt(ref.id.replace('GO:', ''));
      if (goNumber >= 0 && goNumber < 3000) {
        goEntry.category = 'cellular_component';
      } else if (goNumber >= 3000 && goNumber < 8000) {
        goEntry.category = 'molecular_function';
      } else {
        goEntry.category = 'biological_process';
      }
    }
    
    if (!goEntry.term) goEntry.term = ref.id;
    
    goData.push(goEntry);
  }
  
  return goData.length > 0 ? goData : undefined;
}

/**
 * Analyze post-translational modifications
 */
export async function analyzePTMs(
  proteinId: string,
  ptmTypes?: string[],
  functionalAnalysis: boolean = true,
  confidenceThreshold: 'high' | 'medium' | 'low' = 'medium'
): Promise<PTMAnalysisResult | null> {
  
  // Get UniProt entry
  const uniprotEntry = await getUniProtEntry(proteinId.toUpperCase());
  
  if (!uniprotEntry) {
    return null;
  }
  
  const proteinName = uniprotEntry.proteinDescription?.recommendedName?.fullName?.value || 
                     uniprotEntry.proteinDescription?.submissionNames?.[0]?.fullName?.value || 
                     "Unknown protein";
  
  const sequence = uniprotEntry.sequence?.value || '';
  
  // Extract PTM features
  const ptmFeatures = uniprotEntry.features?.filter(feature => 
    feature.type === 'MOD_RES' || 
    feature.type === 'LIPID' || 
    feature.type === 'CARBOHYD' ||
    feature.type === 'CROSSLNK'
  ) || [];
  
  // Also check PTM comments
  const ptmComments = uniprotEntry.comments?.filter(comment => 
    comment.commentType === 'PTM'
  ) || [];
  
  const modifications: any[] = [];
  const modificationTypes: Record<string, number> = {};
  const functionalCategories: Record<string, number> = {};
  
  // Process PTM features
  ptmFeatures.forEach(feature => {
    const position = feature.location.start.value;
    const residue = sequence[position - 1] || 'X';
    const description = feature.description || 'Unknown modification';
    
    // Determine modification type
    let modType = 'Other';
    if (description.toLowerCase().includes('phospho')) modType = 'Phosphorylation';
    else if (description.toLowerCase().includes('acetyl')) modType = 'Acetylation';
    else if (description.toLowerCase().includes('methyl')) modType = 'Methylation';
    else if (description.toLowerCase().includes('ubiquitin')) modType = 'Ubiquitination';
    else if (description.toLowerCase().includes('sumo')) modType = 'SUMOylation';
    else if (description.toLowerCase().includes('glycos')) modType = 'Glycosylation';
    else if (feature.type === 'LIPID') modType = 'Lipidation';
    else if (feature.type === 'CARBOHYD') modType = 'Glycosylation';
    
    // Filter by requested PTM types
    if (!ptmTypes || ptmTypes.some(type => 
      modType.toLowerCase().includes(type.toLowerCase())
    )) {
      
      const modification: any = {
        type: modType,
        position,
        residue,
        modifiedResidue: residue, // Simplified
        description,
        evidence: 'UniProt annotation'
      };
      
      // Add functional impact analysis if requested
      if (functionalAnalysis) {
        modification.functionalImpact = analyzeFunctionalImpact(
          modType, 
          position, 
          residue, 
          sequence,
          description
        );
      }
      
      modifications.push(modification);
      
      // Count modification types
      modificationTypes[modType] = (modificationTypes[modType] || 0) + 1;
      
      // Count functional categories
      if (modification.functionalImpact) {
        const category = modification.functionalImpact.category;
        functionalCategories[category] = (functionalCategories[category] || 0) + 1;
      }
    }
  });
  
  // Apply confidence threshold filtering
  const filteredModifications = modifications.filter(mod => {
    if (!mod.functionalImpact) return true;
    
    const confidence = mod.functionalImpact.confidence;
    if (confidenceThreshold === 'high') return confidence === 'high';
    if (confidenceThreshold === 'medium') return confidence !== 'low';
    return true; // low threshold includes all
  });
  
  return {
    proteinId: proteinId.toUpperCase(),
    proteinName,
    sequence,
    modifications: filteredModifications,
    summary: {
      totalModifications: filteredModifications.length,
      modificationTypes,
      functionalCategories
    }
  };
}

/**
 * Analyze functional impact of PTMs
 */
function analyzeFunctionalImpact(
  modType: string, 
  position: number, 
  residue: string, 
  sequence: string,
  description: string
): any {
  
  // Simplified functional impact analysis
  let category = 'Unknown';
  let impactDescription = '';
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  
  // Determine functional category based on modification type and context
  if (modType === 'Phosphorylation') {
    if (residue === 'S' || residue === 'T' || residue === 'Y') {
      category = 'Signal Transduction';
      impactDescription = 'May regulate protein activity, localization, or protein-protein interactions';
      confidence = 'high';
    }
  } else if (modType === 'Acetylation') {
    if (residue === 'K') {
      category = 'Gene Regulation';
      impactDescription = 'May regulate gene expression or protein-DNA interactions';
      confidence = 'high';
    }
  } else if (modType === 'Methylation') {
    if (residue === 'K' || residue === 'R') {
      category = 'Epigenetic Regulation';
      impactDescription = 'May regulate chromatin structure and gene expression';
      confidence = 'high';
    }
  } else if (modType === 'Ubiquitination') {
    if (residue === 'K') {
      category = 'Protein Degradation';
      impactDescription = 'May target protein for degradation or alter cellular localization';
      confidence = 'high';
    }
  } else if (modType === 'Glycosylation') {
    category = 'Protein Folding';
    impactDescription = 'May affect protein folding, stability, or cell surface presentation';
    confidence = 'medium';
  } else if (modType === 'SUMOylation') {
    category = 'Nuclear Function';
    impactDescription = 'May regulate nuclear transport, transcription, or DNA repair';
    confidence = 'medium';
  }
  
  // Adjust confidence based on position (e.g., known functional domains)
  if (position < 50 || position > sequence.length - 50) {
    // Terminal regions might be less functionally important
    if (confidence === 'high') confidence = 'medium';
    else if (confidence === 'medium') confidence = 'low';
  }
  
  return {
    category,
    description: impactDescription,
    confidence
  };
}

/**
 * Get detailed pathway data for a protein
 */
export async function getPathwayData(
  proteinId: string,
  pathwayDb: 'kegg' | 'reactome' | 'wikipathways' | 'biocyc' = 'kegg',
  includeReactions: boolean = true,
  relatedProteins: boolean = false
): Promise<PathwayData | null> {
  
  // Get UniProt entry and cross-references
  const crossRefs = await getCrossReferences(proteinId, [pathwayDb], true);
  
  if (!crossRefs) {
    return null;
  }
  
  const pathways: any[] = [];
  
  if (pathwayDb === 'kegg' && crossRefs.references.kegg) {
    for (const keggRef of crossRefs.references.kegg) {
      if (keggRef.pathway) {
        try {
          // Get detailed pathway info from KEGG
          const pathwayId = keggRef.pathway.split(':')[1] || keggRef.pathway;
          const pathwayUrl = `${KEGG_BASE_URL}/get/pathway:${pathwayId}`;
          const pathwayInfo = await makeRequest<string>(pathwayUrl, "text/plain");
          
          if (pathwayInfo) {
            const nameMatch = pathwayInfo.match(/NAME\s+([^\n]+)/);
            const descMatch = pathwayInfo.match(/DESCRIPTION\s+([^\n]+)/);
            const classMatch = pathwayInfo.match(/CLASS\s+([^\n]+)/);
            
            const pathway: any = {
              id: pathwayId,
              name: nameMatch ? nameMatch[1].trim() : keggRef.pathway,
              database: 'KEGG',
              description: descMatch ? descMatch[1].trim() : '',
              category: classMatch ? classMatch[1].trim() : 'Unknown',
              organisms: []
            };
            
            if (includeReactions) {
              // Extract reactions
              const reactionMatches = pathwayInfo.match(/REACTION\s+([^\n]+)/g);
              if (reactionMatches) {
                pathway.reactions = reactionMatches.map((match: string) => {
                  const reactionId = match.replace('REACTION', '').trim();
                  return {
                    id: reactionId,
                    equation: '',
                    reversible: false
                  };
                });
              }
            }
            
            pathways.push(pathway);
          }
        } catch (error) {
          console.error(`Error fetching KEGG pathway details:`, error);
        }
      }
    }
  }
  
  // Add other pathway databases here (Reactome, WikiPathways, BioCyc)
  // Implementation would be similar but using their respective APIs
  
  return {
    proteinId: proteinId.toUpperCase(),
    pathways
  };
}
