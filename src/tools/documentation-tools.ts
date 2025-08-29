/**
 * Documentation and resource management MCP tools
 * Chapter 14-15: Documentation & Resources
 */

import { 
  logAnalysisParameters,
  generateResourceMap,
  AnalysisLogEntry
} from "../utils/documentation.js";
import { 
  logAnalysisParametersSchema,
  generateResourceMapSchema
} from "../schemas/validation.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Global storage for analysis logs (in production, this would be persistent storage)
let analysisLogs: AnalysisLogEntry[] = [];

export function registerDocumentationTools(server: McpServer) {
  
  // Tool 1: Log Analysis Parameters
  server.tool(
    "log_analysis_parameters",
    "Record workflow parameters, data, and results for reproducibility and tracking",
    logAnalysisParametersSchema,
    async ({ 
      tool_name,
      analysis_type,
      parameters = {},
      input_data = {},
      results = {},
      execution_time_ms = 0,
      metadata = {}
    }) => {
      try {
        const startTime = Date.now();
        
        const logEntry = logAnalysisParameters(
          tool_name,
          analysis_type,
          parameters,
          input_data,
          results,
          execution_time_ms || (Date.now() - startTime),
          metadata
        );
        
        // Store the log entry
        analysisLogs.push(logEntry);
        
        const output = [
          `=== ANALYSIS LOG ENTRY RECORDED ===`,
          "",
          "📝 LOG INFORMATION",
          `Session ID: ${logEntry.session_id}`,
          `Timestamp: ${logEntry.timestamp}`,
          `Tool Name: ${logEntry.tool_name}`,
          `Analysis Type: ${logEntry.analysis_type}`,
          "",
          "🔧 PARAMETERS LOGGED",
          `Method: ${logEntry.parameters.method || 'Not specified'}`,
          `Algorithm: ${logEntry.parameters.algorithm || 'Not specified'}`,
          `Database: ${logEntry.parameters.database || 'Not specified'}`,
          ""
        ];

        // Display search parameters if present
        if (logEntry.parameters.search_parameters && Object.keys(logEntry.parameters.search_parameters).length > 0) {
          output.push("Search Parameters:");
          Object.entries(logEntry.parameters.search_parameters).forEach(([key, value]) => {
            output.push(`  ${key}: ${value}`);
          });
          output.push("");
        }

        // Display thresholds if present
        if (logEntry.parameters.thresholds && Object.keys(logEntry.parameters.thresholds).length > 0) {
          output.push("Thresholds:");
          Object.entries(logEntry.parameters.thresholds).forEach(([key, value]) => {
            output.push(`  ${key}: ${value}`);
          });
          output.push("");
        }

        // Input data information
        output.push("📊 INPUT DATA ANALYSIS");
        output.push(`Data Type: ${logEntry.input_data.data_type}`);
        if (logEntry.input_data.sequence_count !== undefined) {
          output.push(`Sequence Count: ${logEntry.input_data.sequence_count}`);
        }
        if (logEntry.input_data.sequence_lengths && logEntry.input_data.sequence_lengths.length > 0) {
          const avgLength = logEntry.input_data.sequence_lengths.reduce((sum, len) => sum + len, 0) / logEntry.input_data.sequence_lengths.length;
          const minLength = Math.min(...logEntry.input_data.sequence_lengths);
          const maxLength = Math.max(...logEntry.input_data.sequence_lengths);
          output.push(`Sequence Lengths: ${minLength}-${maxLength} (avg: ${Math.round(avgLength)})`);
        }
        if (logEntry.input_data.sequence_types && logEntry.input_data.sequence_types.length > 0) {
          output.push(`Sequence Types: ${logEntry.input_data.sequence_types.join(', ')}`);
        }
        if (logEntry.input_data.size_bytes) {
          output.push(`Data Size: ${(logEntry.input_data.size_bytes / 1024).toFixed(1)} KB`);
        }
        output.push("");

        // Results summary
        output.push("📈 RESULTS SUMMARY");
        output.push(`Result Type: ${logEntry.results_summary.result_type}`);
        output.push(`Items Found: ${logEntry.results_summary.item_count}`);
        if (logEntry.results_summary.significant_hits !== undefined) {
          output.push(`Significant Hits: ${logEntry.results_summary.significant_hits}`);
        }
        if (logEntry.results_summary.max_score !== undefined) {
          output.push(`Max Score: ${logEntry.results_summary.max_score}`);
        }
        if (logEntry.results_summary.key_findings && logEntry.results_summary.key_findings.length > 0) {
          output.push("Key Findings:");
          logEntry.results_summary.key_findings.forEach(finding => {
            output.push(`  • ${finding}`);
          });
        }
        output.push("");

        // Performance metrics
        output.push("⚡ PERFORMANCE METRICS");
        output.push(`Execution Time: ${logEntry.performance_metrics.execution_time_ms} ms`);
        if (logEntry.performance_metrics.memory_usage_mb) {
          output.push(`Memory Usage: ${logEntry.performance_metrics.memory_usage_mb} MB`);
        }
        if (logEntry.performance_metrics.api_calls) {
          output.push(`API Calls: ${logEntry.performance_metrics.api_calls}`);
        }
        if (logEntry.performance_metrics.database_queries) {
          output.push(`Database Queries: ${logEntry.performance_metrics.database_queries}`);
        }
        if (logEntry.performance_metrics.network_requests) {
          output.push(`Network Requests: ${logEntry.performance_metrics.network_requests}`);
        }
        output.push("");

        // Metadata
        output.push("🏷️ METADATA");
        output.push(`Environment: ${logEntry.metadata.environment}`);
        output.push(`Software Version: ${logEntry.metadata.software_version}`);
        if (logEntry.metadata.project_name) {
          output.push(`Project: ${logEntry.metadata.project_name}`);
        }
        if (logEntry.metadata.workflow_id) {
          output.push(`Workflow ID: ${logEntry.metadata.workflow_id}`);
        }
        if (logEntry.metadata.user_id) {
          output.push(`User ID: ${logEntry.metadata.user_id}`);
        }
        if (logEntry.metadata.notes) {
          output.push(`Notes: ${logEntry.metadata.notes}`);
        }
        if (logEntry.metadata.tags && logEntry.metadata.tags.length > 0) {
          output.push(`Tags: ${logEntry.metadata.tags.join(', ')}`);
        }
        output.push("");

        // Dependencies
        if (logEntry.metadata.dependencies && Object.keys(logEntry.metadata.dependencies).length > 0) {
          output.push("🔗 DEPENDENCIES");
          Object.entries(logEntry.metadata.dependencies).forEach(([name, version]) => {
            output.push(`  ${name}: ${version}`);
          });
          output.push("");
        }

        // Reproducibility information
        output.push("🔬 REPRODUCIBILITY INFORMATION");
        output.push("This log entry contains all necessary information to reproduce the analysis:");
        output.push("• Tool name and version");
        output.push("• Complete parameter set");
        output.push("• Input data characteristics");
        output.push("• Execution environment details");
        output.push("• Performance benchmarks");
        output.push("");

        // Storage information
        output.push("💾 STORAGE INFORMATION");
        output.push(`Total Logged Analyses: ${analysisLogs.length}`);
        output.push(`Session Logs: ${analysisLogs.filter(log => log.session_id === logEntry.session_id).length}`);
        output.push("Log entries are stored in memory and can be exported for permanent storage.");
        output.push("");

        // Usage recommendations
        output.push("💡 USAGE RECOMMENDATIONS");
        output.push("• Use consistent project names for related analyses");
        output.push("• Add descriptive notes for complex workflows");
        output.push("• Tag analyses for easy filtering and retrieval");
        output.push("• Regular export of logs for backup and sharing");
        output.push("• Include workflow IDs for multi-step analyses");

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
              text: `❌ Error logging analysis parameters: ${error}`,
            },
          ],
        };
      }
    }
  );

  // Tool 2: Generate Resource Map
  server.tool(
    "generate_resource_map",
    "Create comprehensive guide of bioinformatics databases, tools, and workflow recommendations",
    generateResourceMapSchema,
    async ({ 
      focus_areas = [],
      include_citations = true,
      include_workflow_guide = true,
      custom_resources = {}
    }) => {
      try {
        // Determine user tools from logs and focus areas
        const userTools = Array.from(new Set([
          ...analysisLogs.map(log => log.tool_name),
          ...focus_areas
        ]));
        
        const resourceMap = generateResourceMap(
          userTools,
          analysisLogs,
          custom_resources
        );
        
        const output = [
          `=== BIOINFORMATICS RESOURCE MAP ===`,
          "",
          "📅 GENERATED",
          `Created: ${resourceMap.created_at}`,
          `Focus Areas: ${focus_areas.length > 0 ? focus_areas.join(', ') : 'General bioinformatics'}`,
          `User Tools Detected: ${userTools.length}`,
          `Analysis History: ${analysisLogs.length} logged analyses`,
          ""
        ];

        // Database Resources
        output.push("🗄️ DATABASE RESOURCES");
        output.push("");
        
        ['primary', 'secondary', 'specialized'].forEach(type => {
          const databases = resourceMap.bioinformatics_resources.databases.filter(db => db.type === type);
          if (databases.length > 0) {
            output.push(`${type.charAt(0).toUpperCase() + type.slice(1)} Databases:`);
            databases.forEach((db, index) => {
              output.push(`  ${index + 1}. ${db.name}`);
              output.push(`     URL: ${db.url}`);
              output.push(`     Purpose: ${db.description}`);
              output.push(`     Data Types: ${db.data_types.join(', ')}`);
              output.push(`     Access: ${db.access_method}`);
              output.push(`     Updates: ${db.update_frequency}`);
              if (db.size_info) {
                output.push(`     Size: ${db.size_info}`);
              }
              output.push("");
            });
          }
        });

        // Algorithm Resources
        if (resourceMap.bioinformatics_resources.algorithms.length > 0) {
          output.push("🧮 ALGORITHM RESOURCES");
          output.push("");
          
          const algorithmCategories = Array.from(new Set(
            resourceMap.bioinformatics_resources.algorithms.map(alg => alg.category)
          ));
          
          algorithmCategories.forEach(category => {
            const algorithms = resourceMap.bioinformatics_resources.algorithms.filter(alg => alg.category === category);
            output.push(`${category}:`);
            algorithms.forEach((alg, index) => {
              output.push(`  ${index + 1}. ${alg.name}`);
              output.push(`     Purpose: ${alg.purpose}`);
              output.push(`     Complexity: ${alg.complexity}`);
              output.push(`     Best for: ${alg.best_use_cases.join(', ')}`);
              output.push(`     Limitations: ${alg.limitations.join(', ')}`);
              output.push(`     References: ${alg.references.join('; ')}`);
              output.push("");
            });
          });
        }

        // Workflow Guide
        if (include_workflow_guide && resourceMap.analysis_workflow.workflow_steps.length > 0) {
          output.push("🔄 ANALYSIS WORKFLOW GUIDE");
          output.push("");
          
          resourceMap.analysis_workflow.workflow_steps.forEach((step, index) => {
            output.push(`Step ${step.step_number}: ${step.tool_name}`);
            output.push(`  Purpose: ${step.purpose}`);
            output.push(`  Input: ${step.input_requirements.join(', ')}`);
            output.push(`  Output: ${step.output_produced.join(', ')}`);
            output.push(`  Time: ${step.time_estimate}`);
            
            if (Object.keys(step.typical_parameters).length > 0) {
              output.push(`  Typical Parameters:`);
              Object.entries(step.typical_parameters).forEach(([param, value]) => {
                output.push(`    ${param}: ${value}`);
              });
            }
            output.push("");
          });
          
          // Data Flow Information
          output.push("📊 DATA FLOW");
          output.push(`Input Formats: ${resourceMap.analysis_workflow.data_flow.input_formats.join(', ')}`);
          output.push(`Intermediate Formats: ${resourceMap.analysis_workflow.data_flow.intermediate_formats.join(', ')}`);
          output.push(`Output Formats: ${resourceMap.analysis_workflow.data_flow.output_formats.join(', ')}`);
          output.push(`Storage: ${resourceMap.analysis_workflow.data_flow.storage_requirements}`);
          output.push("");
        }

        // Tool Usage Statistics
        if (resourceMap.tool_usage_stats.most_used_tools.length > 0) {
          output.push("📈 TOOL USAGE STATISTICS");
          output.push(`Most Used Tools: ${resourceMap.tool_usage_stats.most_used_tools.slice(0, 5).join(', ')}`);
          output.push(`Analysis Patterns: ${resourceMap.tool_usage_stats.analysis_patterns.join(', ')}`);
          output.push("");
        }

        // Data Sources
        if (resourceMap.data_sources.length > 0) {
          output.push("🔗 DATA SOURCES ACCESSED");
          resourceMap.data_sources.forEach((source, index) => {
            output.push(`${index + 1}. ${source.name}`);
            output.push(`   Type: ${source.type}`);
            output.push(`   Last Accessed: ${new Date(source.last_accessed).toLocaleDateString()}`);
            output.push(`   Access Count: ${source.access_count}`);
            output.push(`   Data Retrieved: ${source.data_retrieved}`);
            if (source.quality_score) {
              output.push(`   Quality Score: ${source.quality_score}/10`);
            }
            output.push("");
          });
        }

        // Workflow Efficiency
        if (resourceMap.workflow_efficiency.total_analyses > 0) {
          output.push("⚡ WORKFLOW EFFICIENCY");
          output.push(`Total Analyses: ${resourceMap.workflow_efficiency.total_analyses}`);
          output.push(`Average Time per Analysis: ${resourceMap.workflow_efficiency.average_time_per_analysis} ms`);
          
          if (resourceMap.workflow_efficiency.bottlenecks.length > 0) {
            output.push("Bottlenecks:");
            resourceMap.workflow_efficiency.bottlenecks.forEach(bottleneck => {
              output.push(`  • ${bottleneck}`);
            });
          }
          
          if (resourceMap.workflow_efficiency.optimization_suggestions.length > 0) {
            output.push("Optimization Suggestions:");
            resourceMap.workflow_efficiency.optimization_suggestions.forEach(suggestion => {
              output.push(`  • ${suggestion}`);
            });
          }
          
          output.push("");
        }

        // Citations
        if (include_citations && resourceMap.recommended_citations.length > 0) {
          output.push("📚 RECOMMENDED CITATIONS");
          output.push("");
          
          const citationTypes = Array.from(new Set(
            resourceMap.recommended_citations.map(cit => cit.citation_type)
          ));
          
          citationTypes.forEach(type => {
            const citations = resourceMap.recommended_citations.filter(cit => cit.citation_type === type);
            output.push(`${type.charAt(0).toUpperCase() + type.slice(1)}:`);
            citations.forEach((citation, index) => {
              output.push(`  ${index + 1}. ${citation.tool_name}`);
              output.push(`     ${citation.citation_text}`);
              if (citation.doi) {
                output.push(`     DOI: ${citation.doi}`);
              }
              if (citation.pubmed_id) {
                output.push(`     PMID: ${citation.pubmed_id}`);
              }
              if (citation.url) {
                output.push(`     URL: ${citation.url}`);
              }
              output.push("");
            });
          });
        }

        // Best Practices
        output.push("💡 BEST PRACTICES");
        output.push("• Always validate input data quality before analysis");
        output.push("• Use appropriate databases for your research question");
        output.push("• Document all parameters for reproducibility");
        output.push("• Compare results from multiple methods when possible");
        output.push("• Keep software and databases up to date");
        output.push("• Backup important results and workflows");
        output.push("• Cite all tools, databases, and algorithms used");
        output.push("");

        // Learning Resources
        output.push("📖 LEARNING RESOURCES");
        output.push("• NCBI Education: https://www.ncbi.nlm.nih.gov/education/");
        output.push("• EBI Training: https://www.ebi.ac.uk/training/");
        output.push("• Bioinformatics.org: http://www.bioinformatics.org/");
        output.push("• Coursera Bioinformatics: Multiple university courses available");
        output.push("• Galaxy Project: https://galaxyproject.org/learn/");
        output.push("");

        // Community Resources
        output.push("👥 COMMUNITY RESOURCES");
        output.push("• Biostars: https://www.biostars.org/ (Q&A forum)");
        output.push("• Reddit r/bioinformatics: Active community discussions");
        output.push("• BioLinux: Pre-configured Linux distribution for bioinformatics");
        output.push("• BioConductor: R packages for bioinformatics");
        output.push("• Biopython: Python libraries for computational biology");
        output.push("");

        // Future Directions
        output.push("🔮 EMERGING TRENDS");
        output.push("• Machine learning in sequence analysis");
        output.push("• Cloud-based bioinformatics platforms");
        output.push("• Real-time sequencing data analysis");
        output.push("• Multi-omics integration approaches");
        output.push("• Reproducible workflow systems (Nextflow, Snakemake)");

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
              text: `❌ Error generating resource map: ${error}`,
            },
          ],
        };
      }
    }
  );
}
