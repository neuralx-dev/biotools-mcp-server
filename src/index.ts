import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFileSync } from "fs";
import { join } from "path";

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
const BIO_USER_AGENT = "BioTools-MCP-Server/1.0";

// Create server instance
const server = new McpServer({
  name: "biotools-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});



  // PubMed interfaces
  interface PubMedSearchResult {
    esearchresult: {
      idlist: string[];
    };
  }

  interface PubMedAuthor {
    name: string;
  }

  interface PubMedSummary {
    uid: string;
    title: string;
    authors?: PubMedAuthor[];
    fulljournalname?: string;
    source?: string;
    pubdate: string;
    elocationid?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    pmc?: string;
    pubtype?: string[];
    keywords?: string[];
    meshheadings?: Array<{ term: string }>;
    pii?: string;
  }

  interface PubMedSummaryResponse {
    result: {
      uids: string[];
      [pmid: string]: PubMedSummary | string[];
    };
  }

  // PubMed utility functions
  async function makePubMedRequest<T>(url: string, acceptHeader: string = "application/json"): Promise<T | null> {
    const headers = {
      "User-Agent": BIO_USER_AGENT,
      Accept: acceptHeader,
    };

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (acceptHeader === "application/json") {
        return (await response.json()) as T;
      } else {
        return (await response.text()) as T;
      }
    } catch (error) {
      console.error("Error making PubMed request:", error);
      return null;
    }
  }

  async function searchPubMedIds(term: string, retmax: number = 5): Promise<string[] | null> {
    const url = `${PUBMED_BASE_URL}esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${retmax}`;
    const data = await makePubMedRequest<PubMedSearchResult>(url);
    
    if (!data || !data.esearchresult) {
      return null;
    }
    
    return data.esearchresult.idlist || [];
  }

  async function fetchPubMedSummaries(pmids: string[]): Promise<PubMedSummary[] | null> {
    if (!pmids.length) {
      return [];
    }
    
    const ids = pmids.join(",");
    const url = `${PUBMED_BASE_URL}esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
    const data = await makePubMedRequest<PubMedSummaryResponse>(url);
    
    if (!data || !data.result) {
      return null;
    }
    
    const result = data.result;
    if (!result.uids) {
      return [];
    }
    
    return result.uids.map(uid => result[uid] as PubMedSummary).filter(Boolean);
  }

  function formatPubMedPaper(summary: PubMedSummary): string {
    const authors: string[] = [];
    if (summary.authors) {
      const authorNames = summary.authors.slice(0, 3).map(author => author.name);
      authors.push(...authorNames);
      if (summary.authors.length > 3) {
        authors.push("et al.");
      }
    }

    return [
      `PMID: ${summary.uid || "Unknown"}`,
      `Title: ${summary.title || "No title available"}`,
      `Authors: ${authors.length ? authors.join(", ") : "No authors listed"}`,
      `Journal: ${summary.fulljournalname || summary.source || "Unknown journal"}`,
      `Publication Date: ${summary.pubdate || "Unknown date"}`,
      `DOI: ${summary.elocationid || "No DOI available"}`,
      "",
    ].join("\n");
  }

  async function fetchPubMedXml(pmids: string[]): Promise<string | null> {
    if (!pmids.length) {
      return null;
    }
    
    const ids = pmids.join(",");
    const url = `${PUBMED_BASE_URL}efetch.fcgi?db=pubmed&id=${ids}&retmode=xml`;
    return await makePubMedRequest<string>(url, "application/xml");
  }

  function parseAbstractFromXml(xmlContent: string): string {
    try {
      // Simple text extraction - look for AbstractText tags
      const abstractPattern = /<AbstractText[^>]*>(.*?)<\/AbstractText>/gs;
      const matches = [...xmlContent.matchAll(abstractPattern)];
      
      if (matches.length > 0) {
        // Clean up HTML tags and join multiple abstract sections
        const abstracts: string[] = [];
        for (const match of matches) {
          // Remove any remaining XML tags
          let cleanText = match[1].replace(/<[^>]+>/g, "");
          // Clean up whitespace
          cleanText = cleanText.replace(/\s+/g, " ").trim();
          if (cleanText) {
            abstracts.push(cleanText);
          }
        }
        return abstracts.length > 0 ? abstracts.join(" ") : "No abstract available";
      }
      return "No abstract available";
    } catch (error) {
      return "Error parsing abstract";
    }
  }


  


  server.tool(
    "save_json_list",
    "Save a JSON list to a local file",
    {
      data: z.array(z.any()).describe("JSON array/list to save to file"),
      filename: z.string().optional().describe("Optional filename (defaults to 'data.json')"),
    },
    async ({ data, filename = "data.json" }) => {
      try {
        // Ensure filename has .json extension
        const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
        const filePath = join(process.cwd(), finalFilename);
        
        // Convert data to formatted JSON string
        const jsonString = JSON.stringify(data, null, 2);
        
        // Write to file
        writeFileSync(filePath, jsonString, 'utf8');
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully saved JSON list to file: ${finalFilename}\nPath: ${filePath}\nItems saved: ${data.length}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to save JSON list to file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "search_pubmed",
    "Search PubMed for scientific papers and return formatted results",
    {
      term: z.string().describe("Search term for PubMed (e.g., 'CRISPR gene editing', 'COVID-19 vaccines')"),
      max_results: z.number().min(1).max(20).optional().describe("Maximum number of results to return (default: 5, max: 20)"),
    },
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
    "Get detailed information for a specific PubMed publication by PMID",
    {
      pmid: z.string().describe("PubMed ID of the publication (e.g., '12345678')"),
    },
    async ({ pmid }) => {
      try {
        // Validate PMID format (should be numeric)
        if (!/^\d+$/.test(pmid)) {
          return {
            content: [
              {
                type: "text",
                text: `Invalid PMID format: '${pmid}'. PMID should be numeric.`,
              },
            ],
          };
        }
        
        // Fetch summary for this specific PMID
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
        
        // Format detailed information
        const authors: string[] = [];
        if (summary.authors) {
          authors.push(...summary.authors.map(author => author.name));
        }
        
        const keywords = summary.keywords || [];
        const meshTerms = summary.meshheadings?.map(mesh => mesh.term) || [];
        
        const details = [
          `Publication Details for PMID: ${pmid}`,
          "",
          `Title: ${summary.title || "No title available"}`,
          "",
          `Authors: ${authors.length ? authors.join(", ") : "No authors listed"}`,
          "",
          `Journal: ${summary.fulljournalname || summary.source || "Unknown journal"}`,
          `Volume/Issue: ${summary.volume || "N/A"}/${summary.issue || "N/A"}`,
          `Pages: ${summary.pages || "N/A"}`,
          `Publication Date: ${summary.pubdate || "Unknown date"}`,
          "",
          `DOI: ${summary.elocationid || "No DOI available"}`,
          `PubMed Central ID: ${summary.pmc || "Not available"}`,
          "",
          `Publication Type: ${summary.pubtype?.join(", ") || "Unknown"}`,
          "",
          `Keywords: ${keywords.length ? keywords.join(", ") : "No keywords available"}`,
          "",
          `MeSH Terms: ${meshTerms.length ? meshTerms.slice(0, 10).join(", ") : "No MeSH terms available"}`,
          meshTerms.length > 10 ? `... and ${meshTerms.length - 10} more` : "",
          "",
          "Article IDs:",
          `- PMID: ${pmid}`,
          `- DOI: ${summary.elocationid || "N/A"}`,
          `- PII: ${summary.pii || "N/A"}`,
        ].filter(line => line !== "").join("\n");
        
        return {
          content: [
            {
              type: "text",
              text: details,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching publication details: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    },
  );

  server.tool(
    "get_publication_abstract",
    "Get the full abstract for a specific PubMed publication by PMID",
    {
      pmid: z.string().describe("PubMed ID of the publication (e.g., '12345678')"),
    },
    async ({ pmid }) => {
      try {
        // Validate PMID format
        if (!/^\d+$/.test(pmid)) {
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

  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Biotools MCP Server running on stdio");
  }
  
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });