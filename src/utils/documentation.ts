/**
 * Documentation and resource management utility functions
 * Implements analysis logging and resource mapping for workflow tracking
 */

export interface AnalysisLogEntry {
  timestamp: string;
  session_id: string;
  analysis_type: string;
  tool_name: string;
  parameters: AnalysisParameters;
  input_data: InputDataInfo;
  results_summary: ResultsSummary;
  performance_metrics: PerformanceMetrics;
  metadata: AnalysisMetadata;
}

export interface AnalysisParameters {
  method?: string;
  algorithm?: string;
  database?: string;
  search_parameters?: Record<string, any>;
  alignment_parameters?: Record<string, any>;
  filtering_criteria?: Record<string, any>;
  thresholds?: Record<string, number>;
  options?: Record<string, any>;
}

export interface InputDataInfo {
  data_type: 'sequence' | 'alignment' | 'structure' | 'tree' | 'motif';
  sequence_count?: number;
  sequence_lengths?: number[];
  sequence_types?: string[];
  data_source?: string;
  format?: string;
  size_bytes?: number;
  md5_hash?: string;
}

export interface ResultsSummary {
  result_type: string;
  item_count: number;
  significant_hits?: number;
  max_score?: number;
  min_score?: number;
  success_rate?: number;
  output_format?: string;
  key_findings?: string[];
}

export interface PerformanceMetrics {
  execution_time_ms: number;
  memory_usage_mb?: number;
  api_calls?: number;
  database_queries?: number;
  cache_hits?: number;
  network_requests?: number;
}

export interface AnalysisMetadata {
  user_id?: string;
  project_name?: string;
  workflow_id?: string;
  environment: string;
  software_version: string;
  dependencies?: Record<string, string>;
  notes?: string;
  tags?: string[];
}

export interface ResourceMap {
  created_at: string;
  bioinformatics_resources: BioinformaticsResources;
  analysis_workflow: AnalysisWorkflow;
  tool_usage_stats: ToolUsageStats;
  data_sources: DataSourceInfo[];
  recommended_citations: Citation[];
  workflow_efficiency: WorkflowEfficiency;
}

export interface BioinformaticsResources {
  databases: DatabaseResource[];
  algorithms: AlgorithmResource[];
  web_services: WebServiceResource[];
  software_tools: SoftwareResource[];
  file_formats: FileFormatResource[];
}

export interface DatabaseResource {
  name: string;
  type: 'primary' | 'secondary' | 'specialized';
  url: string;
  description: string;
  data_types: string[];
  access_method: string;
  update_frequency: string;
  size_info?: string;
  citation?: string;
}

export interface AlgorithmResource {
  name: string;
  category: string;
  purpose: string;
  complexity: string;
  best_use_cases: string[];
  limitations: string[];
  references: string[];
}

export interface WebServiceResource {
  name: string;
  provider: string;
  endpoint: string;
  api_type: 'REST' | 'SOAP' | 'GraphQL';
  rate_limits?: string;
  authentication?: string;
  documentation_url?: string;
}

export interface SoftwareResource {
  name: string;
  version: string;
  platform: string[];
  license: string;
  installation_method: string;
  dependencies: string[];
  documentation_url: string;
}

export interface FileFormatResource {
  format: string;
  extension: string;
  description: string;
  use_cases: string[];
  specifications_url?: string;
  tools_supporting: string[];
}

export interface AnalysisWorkflow {
  workflow_steps: WorkflowStep[];
  decision_points: DecisionPoint[];
  quality_controls: QualityControl[];
  data_flow: DataFlowInfo;
}

export interface WorkflowStep {
  step_number: number;
  tool_name: string;
  purpose: string;
  input_requirements: string[];
  output_produced: string[];
  typical_parameters: Record<string, any>;
  time_estimate: string;
}

export interface DecisionPoint {
  step: number;
  condition: string;
  options: string[];
  recommendation: string;
}

export interface QualityControl {
  checkpoint: string;
  criteria: string[];
  warning_signs: string[];
  corrective_actions: string[];
}

export interface DataFlowInfo {
  input_formats: string[];
  intermediate_formats: string[];
  output_formats: string[];
  storage_requirements: string;
  backup_strategy?: string;
}

export interface ToolUsageStats {
  most_used_tools: string[];
  analysis_patterns: string[];
  success_rates: Record<string, number>;
  performance_benchmarks: Record<string, number>;
  user_preferences: Record<string, any>;
}

export interface DataSourceInfo {
  name: string;
  type: string;
  last_accessed: string;
  access_count: number;
  data_retrieved: string;
  quality_score?: number;
}

export interface Citation {
  tool_name: string;
  citation_text: string;
  doi?: string;
  pubmed_id?: string;
  url?: string;
  citation_type: 'software' | 'algorithm' | 'database' | 'method';
}

export interface WorkflowEfficiency {
  total_analyses: number;
  average_time_per_analysis: number;
  bottlenecks: string[];
  optimization_suggestions: string[];
  resource_utilization: Record<string, number>;
}

/**
 * Log analysis parameters and results for workflow tracking
 */
export function logAnalysisParameters(
  toolName: string,
  analysisType: string,
  parameters: any,
  inputData: any,
  results: any,
  executionTime: number,
  metadata: Partial<AnalysisMetadata> = {}
): AnalysisLogEntry {
  const sessionId = generateSessionId();
  const timestamp = new Date().toISOString();
  
  // Analyze input data
  const inputDataInfo = analyzeInputData(inputData);
  
  // Summarize results
  const resultsSummary = summarizeResults(results, analysisType);
  
  // Create performance metrics
  const performanceMetrics: PerformanceMetrics = {
    execution_time_ms: executionTime,
    memory_usage_mb: estimateMemoryUsage(inputData),
    api_calls: 1,
    database_queries: estimateDatabaseQueries(toolName),
    cache_hits: 0,
    network_requests: estimateNetworkRequests(toolName)
  };
  
  // Complete metadata
  const completeMetadata: AnalysisMetadata = {
    environment: 'MCP Server',
    software_version: '2.0.0',
    dependencies: {
      'node': process.version,
      'typescript': '5.x',
      'zod': '3.x'
    },
    ...metadata
  };
  
  const logEntry: AnalysisLogEntry = {
    timestamp,
    session_id: sessionId,
    analysis_type: analysisType,
    tool_name: toolName,
    parameters: cleanParameters(parameters),
    input_data: inputDataInfo,
    results_summary: resultsSummary,
    performance_metrics: performanceMetrics,
    metadata: completeMetadata
  };
  
  return logEntry;
}

/**
 * Generate a comprehensive resource map for bioinformatics workflows
 */
export function generateResourceMap(
  userTools: string[] = [],
  analysisHistory: AnalysisLogEntry[] = [],
  customResources: Partial<BioinformaticsResources> = {}
): ResourceMap {
  const createdAt = new Date().toISOString();
  
  // Build comprehensive resource database
  const bioinformaticsResources = buildBioinformaticsResources(customResources);
  
  // Create analysis workflow guide
  const analysisWorkflow = buildAnalysisWorkflow(userTools);
  
  // Generate tool usage statistics
  const toolUsageStats = buildToolUsageStats(analysisHistory, userTools);
  
  // Build data source information
  const dataSources = buildDataSourceInfo(analysisHistory);
  
  // Generate citations
  const citations = buildRecommendedCitations(userTools);
  
  // Calculate workflow efficiency
  const workflowEfficiency = calculateWorkflowEfficiency(analysisHistory);
  
  return {
    created_at: createdAt,
    bioinformatics_resources: bioinformaticsResources,
    analysis_workflow: analysisWorkflow,
    tool_usage_stats: toolUsageStats,
    data_sources: dataSources,
    recommended_citations: citations,
    workflow_efficiency: workflowEfficiency
  };
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Analyze input data characteristics
 */
function analyzeInputData(inputData: any): InputDataInfo {
  if (!inputData) {
    return {
      data_type: 'sequence',
      sequence_count: 0
    };
  }
  
  // Detect data type
  let dataType: InputDataInfo['data_type'] = 'sequence';
  let sequenceCount = 0;
  let sequenceLengths: number[] = [];
  let sequenceTypes: string[] = [];
  
  if (typeof inputData === 'string') {
    // Single sequence
    sequenceCount = 1;
    sequenceLengths = [inputData.length];
    sequenceTypes = [detectSequenceType(inputData)];
  } else if (Array.isArray(inputData)) {
    // Multiple sequences
    sequenceCount = inputData.length;
    inputData.forEach((item: any) => {
      if (typeof item === 'string') {
        sequenceLengths.push(item.length);
        sequenceTypes.push(detectSequenceType(item));
      } else if (item.sequence) {
        sequenceLengths.push(item.sequence.length);
        sequenceTypes.push(detectSequenceType(item.sequence));
      }
    });
  } else if (inputData.sequence) {
    // Sequence object
    sequenceCount = 1;
    sequenceLengths = [inputData.sequence.length];
    sequenceTypes = [detectSequenceType(inputData.sequence)];
  }
  
  // Detect if it's alignment data
  if (sequenceLengths.length > 1 && sequenceLengths.every(len => len === sequenceLengths[0])) {
    dataType = 'alignment';
  }
  
  const sizeBytes = JSON.stringify(inputData).length * 2; // Rough estimate
  
  return {
    data_type: dataType,
    sequence_count: sequenceCount,
    sequence_lengths: sequenceLengths,
    sequence_types: Array.from(new Set(sequenceTypes)),
    format: 'JSON',
    size_bytes: sizeBytes
  };
}

/**
 * Detect sequence type (DNA, RNA, protein)
 */
function detectSequenceType(sequence: string): string {
  const cleanSeq = sequence.toUpperCase().replace(/[^A-Z]/g, '');
  const nucleotides = cleanSeq.match(/[ATGC]/g)?.length || 0;
  const rnaSpecific = cleanSeq.match(/U/g)?.length || 0;
  const proteinSpecific = cleanSeq.match(/[FYWPDEQHILKMRVS]/g)?.length || 0;
  
  if (rnaSpecific > 0) return 'RNA';
  if (nucleotides / cleanSeq.length > 0.9) return 'DNA';
  if (proteinSpecific > 0) return 'Protein';
  return 'Unknown';
}

/**
 * Summarize analysis results
 */
function summarizeResults(results: any, analysisType: string): ResultsSummary {
  if (!results) {
    return {
      result_type: analysisType,
      item_count: 0
    };
  }
  
  let itemCount = 0;
  let keyFindings: string[] = [];
  
  if (Array.isArray(results)) {
    itemCount = results.length;
  } else if (typeof results === 'object') {
    // Try to extract meaningful counts
    if (results.hits) itemCount = results.hits.length;
    else if (results.matches) itemCount = results.matches.length;
    else if (results.alignments) itemCount = results.alignments.length;
    else if (results.sequences) itemCount = results.sequences.length;
    else itemCount = 1;
    
    // Extract key findings
    if (results.significant_matches) keyFindings.push(`${results.significant_matches} significant matches`);
    if (results.gc_content) keyFindings.push(`GC content: ${results.gc_content}%`);
    if (results.molecular_weight) keyFindings.push(`MW: ${results.molecular_weight} Da`);
  } else {
    itemCount = 1;
  }
  
  return {
    result_type: analysisType,
    item_count: itemCount,
    key_findings: keyFindings
  };
}

/**
 * Clean sensitive parameters for logging
 */
function cleanParameters(parameters: any): AnalysisParameters {
  if (!parameters) return {};
  
  const cleaned = { ...parameters };
  
  // Remove sensitive information
  delete cleaned.api_key;
  delete cleaned.password;
  delete cleaned.token;
  
  return cleaned;
}

/**
 * Estimate memory usage
 */
function estimateMemoryUsage(inputData: any): number {
  return Math.ceil(JSON.stringify(inputData).length / 1024 / 1024);
}

/**
 * Estimate database queries for different tools
 */
function estimateDatabaseQueries(toolName: string): number {
  const queryMap: Record<string, number> = {
    'search_pubmed': 1,
    'search_uniprot': 1,
    'get_protein_entry': 1,
    'blast_search': 1,
    'psi_blast_search': 3,
    'get_protein_structure': 1
  };
  
  return queryMap[toolName] || 0;
}

/**
 * Estimate network requests
 */
function estimateNetworkRequests(toolName: string): number {
  const networkTools = ['search_pubmed', 'search_uniprot', 'blast_search', 'get_protein_structure'];
  return networkTools.includes(toolName) ? 1 : 0;
}

/**
 * Build comprehensive bioinformatics resources
 */
function buildBioinformaticsResources(customResources: Partial<BioinformaticsResources>): BioinformaticsResources {
  const defaultDatabases: DatabaseResource[] = [
    {
      name: 'PubMed',
      type: 'primary',
      url: 'https://pubmed.ncbi.nlm.nih.gov/',
      description: 'Biomedical literature database',
      data_types: ['articles', 'abstracts', 'citations'],
      access_method: 'REST API',
      update_frequency: 'Daily',
      size_info: '34+ million citations',
      citation: 'PubMed. Bethesda (MD): National Library of Medicine'
    },
    {
      name: 'UniProtKB',
      type: 'primary',
      url: 'https://www.uniprot.org/',
      description: 'Protein sequence and annotation database',
      data_types: ['protein sequences', 'annotations', 'functional data'],
      access_method: 'REST API',
      update_frequency: 'Weekly',
      size_info: '200+ million protein sequences'
    },
    {
      name: 'NCBI GenBank',
      type: 'primary',
      url: 'https://www.ncbi.nlm.nih.gov/genbank/',
      description: 'Genetic sequence database',
      data_types: ['nucleotide sequences', 'genome data'],
      access_method: 'REST API',
      update_frequency: 'Daily'
    },
    {
      name: 'Protein Data Bank (PDB)',
      type: 'specialized',
      url: 'https://www.rcsb.org/',
      description: '3D structure database',
      data_types: ['protein structures', 'nucleic acid structures'],
      access_method: 'REST API',
      update_frequency: 'Weekly'
    }
  ];
  
  const defaultAlgorithms: AlgorithmResource[] = [
    {
      name: 'BLAST',
      category: 'Sequence Similarity',
      purpose: 'Find regions of local similarity between sequences',
      complexity: 'O(mn) heuristic',
      best_use_cases: ['Homology detection', 'Functional annotation'],
      limitations: ['May miss remote homologs', 'Short sequences'],
      references: ['Altschul et al. 1990', 'Altschul et al. 1997']
    },
    {
      name: 'Needleman-Wunsch',
      category: 'Sequence Alignment',
      purpose: 'Global sequence alignment',
      complexity: 'O(mn)',
      best_use_cases: ['Similar length sequences', 'Full-length alignment'],
      limitations: ['Memory intensive', 'Not suitable for very different sequences'],
      references: ['Needleman & Wunsch 1970']
    },
    {
      name: 'Neighbor-Joining',
      category: 'Phylogenetics',
      purpose: 'Distance-based tree construction',
      complexity: 'O(n³)',
      best_use_cases: ['Closely related sequences', 'Quick tree estimation'],
      limitations: ['Assumes molecular clock relaxation', 'Distance-based only'],
      references: ['Saitou & Nei 1987']
    }
  ];
  
  return {
    databases: [...defaultDatabases, ...(customResources.databases || [])],
    algorithms: [...defaultAlgorithms, ...(customResources.algorithms || [])],
    web_services: customResources.web_services || [],
    software_tools: customResources.software_tools || [],
    file_formats: customResources.file_formats || []
  };
}

/**
 * Build analysis workflow guide
 */
function buildAnalysisWorkflow(userTools: string[]): AnalysisWorkflow {
  const commonSteps: WorkflowStep[] = [
    {
      step_number: 1,
      tool_name: 'sequence_input',
      purpose: 'Data preparation and quality control',
      input_requirements: ['Raw sequences', 'Metadata'],
      output_produced: ['Clean sequences', 'Format validation'],
      typical_parameters: { format: 'FASTA', quality_threshold: 0.8 },
      time_estimate: '1-5 minutes'
    }
  ];
  
  // Add steps based on user tools
  if (userTools.includes('blast_search')) {
    commonSteps.push({
      step_number: 2,
      tool_name: 'blast_search',
      purpose: 'Similarity search and homolog identification',
      input_requirements: ['Query sequence', 'Database selection'],
      output_produced: ['Similar sequences', 'E-values', 'Alignments'],
      typical_parameters: { database: 'nr', e_value: 10.0 },
      time_estimate: '30 seconds - 5 minutes'
    });
  }
  
  return {
    workflow_steps: commonSteps,
    decision_points: [],
    quality_controls: [],
    data_flow: {
      input_formats: ['FASTA', 'JSON', 'Plain text'],
      intermediate_formats: ['JSON', 'Alignment'],
      output_formats: ['JSON', 'Text report'],
      storage_requirements: 'Minimal - results stored in memory'
    }
  };
}

/**
 * Build tool usage statistics
 */
function buildToolUsageStats(analysisHistory: AnalysisLogEntry[], userTools: string[]): ToolUsageStats {
  const toolCounts: Record<string, number> = {};
  const successRates: Record<string, number> = {};
  
  analysisHistory.forEach(entry => {
    toolCounts[entry.tool_name] = (toolCounts[entry.tool_name] || 0) + 1;
  });
  
  const mostUsedTools = Object.entries(toolCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tool]) => tool);
  
  return {
    most_used_tools: mostUsedTools,
    analysis_patterns: ['Sequential analysis', 'Comparative studies'],
    success_rates: successRates,
    performance_benchmarks: {},
    user_preferences: {}
  };
}

/**
 * Build data source information
 */
function buildDataSourceInfo(analysisHistory: AnalysisLogEntry[]): DataSourceInfo[] {
  const sources: Record<string, DataSourceInfo> = {};
  
  analysisHistory.forEach(entry => {
    const dbName = entry.parameters.database || 'Local';
    if (!sources[dbName]) {
      sources[dbName] = {
        name: dbName,
        type: 'database',
        last_accessed: entry.timestamp,
        access_count: 0,
        data_retrieved: '0 records'
      };
    }
    sources[dbName].access_count++;
    sources[dbName].last_accessed = entry.timestamp;
  });
  
  return Object.values(sources);
}

/**
 * Build recommended citations
 */
function buildRecommendedCitations(userTools: string[]): Citation[] {
  const citations: Citation[] = [
    {
      tool_name: 'BioTools MCP Server',
      citation_text: 'BioTools MCP Server v2.0.0. A comprehensive bioinformatics analysis platform.',
      citation_type: 'software'
    }
  ];
  
  if (userTools.includes('blast_search')) {
    citations.push({
      tool_name: 'BLAST',
      citation_text: 'Altschul, S.F., Gish, W., Miller, W., Myers, E.W. & Lipman, D.J. (1990) "Basic local alignment search tool." J. Mol. Biol. 215:403-410.',
      citation_type: 'algorithm'
    });
  }
  
  return citations;
}

/**
 * Calculate workflow efficiency metrics
 */
function calculateWorkflowEfficiency(analysisHistory: AnalysisLogEntry[]): WorkflowEfficiency {
  if (analysisHistory.length === 0) {
    return {
      total_analyses: 0,
      average_time_per_analysis: 0,
      bottlenecks: [],
      optimization_suggestions: [],
      resource_utilization: {}
    };
  }
  
  const totalTime = analysisHistory.reduce((sum, entry) => sum + entry.performance_metrics.execution_time_ms, 0);
  const averageTime = totalTime / analysisHistory.length;
  
  return {
    total_analyses: analysisHistory.length,
    average_time_per_analysis: Math.round(averageTime),
    bottlenecks: ['Network latency for database queries'],
    optimization_suggestions: [
      'Use local caching for repeated queries',
      'Batch similar analyses',
      'Optimize sequence preprocessing'
    ],
    resource_utilization: {
      cpu: 0.3,
      memory: 0.2,
      network: 0.5
    }
  };
}
