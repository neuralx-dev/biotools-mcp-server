/**
 * PubMed MCP tools
 */

import { 
  searchPubMedIds, 
  fetchPubMedSummaries, 
  fetchPubMedXml,
  fetchComprehensivePubMedData,
  fetchPubMedCitations,
  fetchRelatedArticles,
  formatPubMedPaper,
  parseAbstractFromXml,
  parseComprehensiveXML
} from "../utils/pubmed.js";
import { 
  searchPubMedSchema, 
  getPublicationDetailsSchema, 
  getPublicationAbstractSchema,
  validatePmid 
} from "../schemas/validation.js";
// MCP tool response types are handled by the SDK
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPubMedTools(server: McpServer) {
  server.tool(
    "search_pubmed",
    "Search PubMed for scientific papers and return formatted results",
    searchPubMedSchema,
    async ({ term, max_results = 5 }) => {
      try {
        // Limit max_results to reasonable bounds
        const limitedResults = Math.min(Math.max(1, max_results), 20);
        
        // Search for PMIDs
        const pmids = await searchPubMedIds(term, limitedResults);
        
        if (!pmids || pmids.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No results found for search term: '${term}'`,
              },
            ],
          };
        }
        
        // Fetch detailed summaries
        const summaries = await fetchPubMedSummaries(pmids);
        
        if (!summaries || summaries.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Unable to fetch paper details.",
              },
            ],
          };
        }
        
        // Format results
        const formattedPapers = summaries.map(formatPubMedPaper);
        const resultHeader = `Found ${formattedPapers.length} paper(s) for search term: '${term}'\n\n`;
        const resultText = resultHeader + formattedPapers.join("---\n");
        
        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching PubMed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "get_publication_details",
    "Get comprehensive detailed information for a specific PubMed publication by PMID",
    getPublicationDetailsSchema,
    async ({ pmid }) => {
      try {
        // Validate PMID format
        if (!validatePmid(pmid)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid PMID format: '${pmid}'. PMID should be numeric.`,
              },
            ],
          };
        }
        
        // Fetch comprehensive data
        const comprehensiveData = await fetchComprehensivePubMedData([pmid]);
        
        if (!comprehensiveData || !comprehensiveData.articles || comprehensiveData.articles.length === 0) {
          // Fallback to basic summary
          const summaries = await fetchPubMedSummaries([pmid]);
          if (!summaries || summaries.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No publication found for PMID: ${pmid}`,
                },
              ],
            };
          }
          
          const summary = summaries[0];
          const authors: string[] = summary.authors?.map(author => author.name) || [];
          const keywords = summary.keywords || [];
          const meshTerms = summary.meshheadings?.map(mesh => mesh.term) || [];
          
          const details = [
            `=== PUBLICATION DETAILS: PMID ${pmid} ===`,
            "",
            `📋 BASIC INFORMATION`,
            `Title: ${summary.title || "No title available"}`,
            `Authors: ${authors.length ? authors.join(", ") : "No authors listed"}`,
            `Journal: ${summary.fulljournalname || summary.source || "Unknown journal"}`,
            `Publication Date: ${summary.pubdate || "Unknown date"}`,
            `DOI: ${summary.elocationid || "No DOI available"}`,
            "",
            `📊 CLASSIFICATION`,
            `Publication Type: ${summary.pubtype?.join(", ") || "Unknown"}`,
            `Keywords: ${keywords.length ? keywords.slice(0, 15).join(", ") : "No keywords available"}`,
            `MeSH Terms: ${meshTerms.length ? meshTerms.slice(0, 15).join(", ") : "No MeSH terms available"}`,
          ].filter(line => line !== "").join("\n");
          
          return {
            content: [
              {
                type: "text",
                text: details,
              },
            ],
          };
        }
        
        const article = comprehensiveData.articles[0];
        
        // Get citations and related articles
        const citations = await fetchPubMedCitations(pmid);
        const relatedArticles = await fetchRelatedArticles(pmid, 5);
        
        // Format comprehensive details
        const details = [
          `=== COMPREHENSIVE PUBLICATION DETAILS: PMID ${pmid} ===`,
          "",
          "📋 BASIC INFORMATION",
          `Title: ${article.title || "No title available"}`,
          "",
        ];
        
        // Authors with affiliations
        if (article.authors && article.authors.length > 0) {
          details.push("👥 AUTHORS & AFFILIATIONS");
          article.authors.slice(0, 15).forEach((author: any, index: number) => {
            let authorLine = `${index + 1}. ${author.name}`;
            if (author.orcid) authorLine += ` (ORCID: ${author.orcid})`;
            details.push(authorLine);
            if (author.affiliations && author.affiliations.length > 0) {
              author.affiliations.forEach((aff: string) => {
                details.push(`   📍 ${aff}`);
              });
            }
          });
          if (article.authors.length > 15) {
            details.push(`   ... and ${article.authors.length - 15} more authors`);
          }
          details.push("");
        }
        
        // Journal Information
        if (article.journal) {
          details.push("📚 JOURNAL INFORMATION");
          if (article.journal.title) details.push(`Journal: ${article.journal.title}`);
          if (article.journal.issn) details.push(`ISSN: ${article.journal.issn}`);
          if (article.journal.volume) details.push(`Volume: ${article.journal.volume}`);
          if (article.journal.issue) details.push(`Issue: ${article.journal.issue}`);
          details.push("");
        }
        
        // MeSH Terms with qualifiers
        if (article.meshHeadings && article.meshHeadings.length > 0) {
          details.push("🏷️ MESH TERMS & SUBJECT HEADINGS");
          article.meshHeadings.slice(0, 20).forEach((mesh: any, index: number) => {
            let meshLine = `${index + 1}. ${mesh.term}`;
            if (mesh.majorTopic) meshLine += " [MAJOR TOPIC]";
            details.push(meshLine);
            if (mesh.qualifiers && mesh.qualifiers.length > 0) {
              details.push(`   Qualifiers: ${mesh.qualifiers.join(", ")}`);
            }
          });
          if (article.meshHeadings.length > 20) {
            details.push(`   ... and ${article.meshHeadings.length - 20} more MeSH terms`);
          }
          details.push("");
        }
        
        // Keywords
        if (article.keywords && article.keywords.length > 0) {
          details.push("🔑 KEYWORDS");
          details.push(article.keywords.slice(0, 25).join(", "));
          if (article.keywords.length > 25) {
            details.push(`... and ${article.keywords.length - 25} more keywords`);
          }
          details.push("");
        }
        
        // Chemicals/Substances
        if (article.chemicals && article.chemicals.length > 0) {
          details.push("🧪 CHEMICALS & SUBSTANCES");
          article.chemicals.slice(0, 15).forEach((chemical: any, index: number) => {
            details.push(`${index + 1}. ${chemical.name} (Registry: ${chemical.registryNumber || "N/A"})`);
          });
          if (article.chemicals.length > 15) {
            details.push(`   ... and ${article.chemicals.length - 15} more chemicals`);
          }
          details.push("");
        }
        
        // Grant Information
        if (article.grants && article.grants.length > 0) {
          details.push("💰 FUNDING & GRANTS");
          article.grants.slice(0, 10).forEach((grant: any, index: number) => {
            let grantLine = `${index + 1}. ${grant.agency || "Unknown Agency"}`;
            if (grant.grantId) grantLine += ` (Grant ID: ${grant.grantId})`;
            if (grant.country) grantLine += ` [${grant.country}]`;
            details.push(grantLine);
          });
          if (article.grants.length > 10) {
            details.push(`   ... and ${article.grants.length - 10} more grants`);
          }
          details.push("");
        }
        
        // Publication Types
        if (article.publicationTypes && article.publicationTypes.length > 0) {
          details.push("📄 PUBLICATION TYPES");
          details.push(article.publicationTypes.join(", "));
          details.push("");
        }
        
        // Article IDs
        if (article.articleIds && article.articleIds.length > 0) {
          details.push("🆔 ARTICLE IDENTIFIERS");
          article.articleIds.forEach((id: any) => {
            details.push(`- ${id.idType}: ${id.value}`);
          });
          details.push("");
        }
        
        // Publication History
        if (article.history && article.history.length > 0) {
          details.push("📅 PUBLICATION HISTORY");
          article.history.forEach((hist: any) => {
            details.push(`- ${hist.status}: ${hist.date}`);
          });
          details.push("");
        }
        
        // Abstract (structured)
        if (article.abstract && article.abstract.sections && article.abstract.sections.length > 0) {
          details.push("📝 STRUCTURED ABSTRACT");
          article.abstract.sections.forEach((section: any) => {
            details.push(`${section.label.toUpperCase()}:`);
            details.push(section.text);
            details.push("");
          });
        }
        
        // Citations and Related Articles
        if (citations && citations.length > 0) {
          details.push(`📈 CITATION IMPACT`);
          details.push(`Cited by ${citations.length} other publications`);
          details.push("");
        }
        
        if (relatedArticles && relatedArticles.length > 0) {
          details.push(`🔗 RELATED ARTICLES`);
          details.push(`${relatedArticles.length} related publications found`);
          details.push(`Related PMIDs: ${relatedArticles.slice(0, 10).join(", ")}`);
          details.push("");
        }
        
        // References (if available)
        if (article.references && article.references.length > 0) {
          details.push("📚 REFERENCES");
          details.push(`This article references ${article.references.length} other publications`);
          details.push("");
        }
        
        return {
          content: [
            {
              type: "text",
              text: details.join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching comprehensive publication details: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "get_publication_abstract",
    "Get the full abstract for a specific PubMed publication by PMID",
    getPublicationAbstractSchema,
    async ({ pmid }) => {
      try {
        // Validate PMID format
        if (!validatePmid(pmid)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid PMID format: '${pmid}'. PMID should be numeric.`,
              },
            ],
          };
        }
        
        // First get basic info
        const summaries = await fetchPubMedSummaries([pmid]);
        
        if (!summaries || summaries.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No publication found for PMID: ${pmid}`,
              },
            ],
          };
        }
        
        const summary = summaries[0];
        const title = summary.title || "Unknown title";
        const authors: string[] = [];
        if (summary.authors) {
          const authorNames = summary.authors.slice(0, 3).map(author => author.name);
          authors.push(...authorNames);
          if (summary.authors.length > 3) {
            authors.push("et al.");
          }
        }
        
        // Fetch XML to get full abstract
        const xmlContent = await fetchPubMedXml([pmid]);
        
        if (!xmlContent) {
          return {
            content: [
              {
                type: "text",
                text: `Unable to fetch abstract for PMID: ${pmid}`,
              },
            ],
          };
        }
        
        const abstract = parseAbstractFromXml(xmlContent);
        
        const result = [
          `Abstract for PMID: ${pmid}`,
          "",
          `Title: ${title}`,
          `Authors: ${authors.length ? authors.join(", ") : "No authors listed"}`,
          `Journal: ${summary.fulljournalname || summary.source || "Unknown journal"}`,
          `Publication Date: ${summary.pubdate || "Unknown date"}`,
          "",
          "Abstract:",
          abstract,
          "",
          `DOI: ${summary.elocationid || "No DOI available"}`,
        ].join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching abstract: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );
}
