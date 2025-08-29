/**
 * Type definitions for biological data APIs
 */

// PubMed API Types
export interface PubMedSearchResult {
  esearchresult: {
    idlist: string[];
  };
}

export interface PubMedAuthor {
  name: string;
  authtype?: string;
  clusterid?: string;
  affiliation?: string;
  orcid?: string;
}

export interface PubMedMeshHeading {
  term: string;
  qualifiername?: string[];
  majortopicyn?: string;
}

export interface PubMedGrant {
  agency: string;
  country: string;
  grantid: string;
}

export interface PubMedChemical {
  name: string;
  registrynum: string;
}

export interface PubMedSummary {
  uid: string;
  title: string;
  authors?: PubMedAuthor[];
  fulljournalname?: string;
  source?: string;
  pubdate: string;
  epubdate?: string;
  printpubdate?: string;
  elocationid?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  pmc?: string;
  pmcid?: string;
  pubtype?: string[];
  keywords?: string[];
  meshheadings?: PubMedMeshHeading[];
  chemicals?: PubMedChemical[];
  grants?: PubMedGrant[];
  pii?: string;
  issn?: string;
  essn?: string;
  nlmuniqueid?: string;
  issnlinking?: string;
  country?: string;
  medlineta?: string;
  publisherlocation?: string;
  publishername?: string;
  articleids?: Array<{
    idtype: string;
    value: string;
  }>;
  history?: Array<{
    pubstatus: string;
    date: string;
  }>;
  references?: string[];
  hasabstract?: number;
  vernaculartitle?: string;
  doi?: string;
  booktitle?: string;
  medium?: string;
  edition?: string;
  collectiontitle?: string;
  translators?: string[];
  editors?: string[];
  collaborators?: string[];
  investigatorlist?: string[];
  lang?: string[];
}

export interface PubMedSummaryResponse {
  result: {
    uids: string[];
    [pmid: string]: PubMedSummary | string[];
  };
}

// UniProtKB API Types
export interface UniProtSearchResult {
  results: UniProtEntry[];
  facets?: any[];
}

export interface UniProtEntry {
  primaryAccession: string;
  secondaryAccessions?: string[];
  uniProtkbId: string;
  entryAudit?: {
    firstPublicDate: string;
    lastAnnotationUpdateDate: string;
    lastSequenceUpdateDate: string;
    entryVersion: number;
    sequenceVersion: number;
  };
  annotationScore?: number;
  organism?: {
    taxonId: number;
    scientificName: string;
    commonName?: string;
    lineage?: string[];
  };
  proteinExistence?: {
    evidenceCode: string;
    evidenceLabel: string;
  };
  proteinDescription?: {
    recommendedName?: {
      fullName: {
        evidences?: any[];
        value: string;
      };
      shortNames?: Array<{
        evidences?: any[];
        value: string;
      }>;
      ecNumbers?: Array<{
        evidences?: any[];
        value: string;
      }>;
    };
    alternativeNames?: Array<{
      fullName?: {
        evidences?: any[];
        value: string;
      };
      shortNames?: Array<{
        evidences?: any[];
        value: string;
      }>;
      ecNumbers?: Array<{
        evidences?: any[];
        value: string;
      }>;
    }>;
    submissionNames?: Array<{
      fullName: {
        evidences?: any[];
        value: string;
      };
      ecNumbers?: Array<{
        evidences?: any[];
        value: string;
      }>;
    }>;
  };
  genes?: Array<{
    geneName?: {
      evidences?: any[];
      value: string;
    };
    synonyms?: Array<{
      evidences?: any[];
      value: string;
    }>;
    orderedLocusNames?: Array<{
      evidences?: any[];
      value: string;
    }>;
    orfNames?: Array<{
      evidences?: any[];
      value: string;
    }>;
  }>;
  comments?: Array<{
    commentType: string;
    texts?: Array<{
      evidences?: any[];
      value: string;
    }>;
  }>;
  features?: Array<{
    type: string;
    location: {
      start: {
        value: number;
        modifier?: string;
      };
      end: {
        value: number;
        modifier?: string;
      };
    };
    description?: string;
    evidences?: any[];
  }>;
  keywords?: Array<{
    id: string;
    category: string;
    name: string;
  }>;
  references?: Array<{
    citation: {
      id: string;
      citationType: string;
      authors?: string[];
      citationCrossReferences?: Array<{
        database: string;
        id: string;
      }>;
      title?: string;
      publicationDate?: string;
      journal?: string;
      firstPage?: string;
      lastPage?: string;
      volume?: string;
    };
    referencePositions?: string[];
    evidences?: any[];
  }>;
  uniProtKBCrossReferences?: Array<{
    database: string;
    id: string;
    properties?: Array<{
      key: string;
      value: string;
    }>;
    evidences?: any[];
  }>;
  sequence?: {
    value: string;
    length: number;
    molWeight: number;
    crc64: string;
    md5: string;
  };
  extraAttributes?: {
    countByCommentType?: Record<string, number>;
    countByFeatureType?: Record<string, number>;
    uniParcId?: string;
  };
}

// NCBI/GenBank API Types - Enhanced
export interface NCBISequenceResult {
  sequences: Array<{
    accession: string;
    version: string;
    title: string;
    organism: string;
    sequence: string;
    length: number;
    moleculeType: string;
    topology: string;
    createDate: string;
    updateDate: string;
    division?: string;
    keywords?: string;
    taxonomyId?: string;
    fullTaxonomy?: string;
    gi?: string;
    detailedTaxonomy?: string;
    strain?: string;
    isolationSource?: string;
    collectionDate?: string;
    country?: string;
    otherSeqIds?: string[];
    references?: Array<{
      number: string;
      range: string;
      authors: string;
      title: string;
      journal: string;
      pubmed: string;
      doi: string;
    }>;
    features?: Array<{
      type: string;
      location: string;
      qualifiers: Record<string, string[]>;
    }>;
  }>;
}

export interface EnsemblSequenceResult {
  id: string;
  desc: string;
  seq: string;
  length: number;
  assembly: string;
  coord_system: string;
  start: number;
  end: number;
  strand: number;
}

export interface AnnotationComparison {
  sequence1: {
    id: string;
    organism: string;
    type: 'prokaryotic' | 'eukaryotic';
    features: AnnotationFeature[];
  };
  sequence2: {
    id: string;
    organism: string;
    type: 'prokaryotic' | 'eukaryotic';
    features: AnnotationFeature[];
  };
  comparison: {
    commonFeatures: AnnotationFeature[];
    uniqueToSeq1: AnnotationFeature[];
    uniqueToSeq2: AnnotationFeature[];
    similarities: string[];
    differences: string[];
  };
}

export interface AnnotationFeature {
  type: string;
  start: number;
  end: number;
  strand: number;
  product?: string;
  gene?: string;
  note?: string;
  qualifiers: Record<string, string[]>;
}

export interface IntronExonResult {
  sequenceId: string;
  organism: string;
  geneStructure: {
    exons: Array<{
      number: number;
      start: number;
      end: number;
      length: number;
      sequence: string;
    }>;
    introns: Array<{
      number: number;
      start: number;
      end: number;
      length: number;
      sequence: string;
      spliceSites: {
        donor: string;
        acceptor: string;
      };
    }>;
    totalExons: number;
    totalIntrons: number;
    codingSequence: string;
  };
}

export interface PromoterAlignmentResult {
  sequences: Array<{
    id: string;
    organism: string;
    promoterRegion: string;
    tssPosition: number;
  }>;
  alignment: {
    consensusSequence: string;
    conservedElements: Array<{
      position: number;
      sequence: string;
      conservation: number;
      type: string; // TATA, CAAT, GC, etc.
    }>;
    alignmentMatrix: string[];
  };
}

// Enhanced cross-reference types
export interface CrossReferencesResult {
  proteinId: string;
  references: {
    kegg?: Array<{
      database: string;
      id: string;
      pathway?: string;
      module?: string;
      reaction?: string;
    }>;
    pfam?: Array<{
      id: string;
      name: string;
      description: string;
      start: number;
      end: number;
      evalue: number;
    }>;
    pdb?: Array<{
      id: string;
      method: string;
      resolution: string;
      chains: string[];
      title: string;
    }>;
    interpro?: Array<{
      id: string;
      name: string;
      type: string;
      start?: number;
      end?: number;
    }>;
    go?: Array<{
      id: string;
      term: string;
      category: 'biological_process' | 'molecular_function' | 'cellular_component';
      evidence: string;
    }>;
  };
}

export interface PTMAnalysisResult {
  proteinId: string;
  proteinName: string;
  sequence: string;
  modifications: Array<{
    type: string;
    position: number;
    residue: string;
    modifiedResidue: string;
    description: string;
    evidence: string;
    functionalImpact?: {
      category: string;
      description: string;
      confidence: 'high' | 'medium' | 'low';
    };
  }>;
  summary: {
    totalModifications: number;
    modificationTypes: Record<string, number>;
    functionalCategories: Record<string, number>;
  };
}

export interface PathwayData {
  proteinId: string;
  pathways: Array<{
    id: string;
    name: string;
    database: string;
    description: string;
    category: string;
    organisms: string[];
    reactions?: Array<{
      id: string;
      equation: string;
      reversible: boolean;
    }>;
    modules?: Array<{
      id: string;
      name: string;
      definition: string;
    }>;
    relatedProteins?: string[];
  }>;
}

// Common Types
export interface ApiRequestOptions {
  headers: Record<string, string>;
}

// MCP tool response type is handled by the SDK automatically
