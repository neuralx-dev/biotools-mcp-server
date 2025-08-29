/**
 * PubMed API utility functions
 */

import { 
  PubMedSearchResult, 
  PubMedSummary, 
  PubMedSummaryResponse 
} from "../types/interfaces.js";
import { PUBMED_BASE_URL, BIO_USER_AGENT } from "./config.js";

/**
 * Make a request to PubMed API
 */
export async function makePubMedRequest<T>(
  url: string, 
  acceptHeader: string = "application/json"
): Promise<T | null> {
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

/**
 * Search PubMed for article IDs
 */
export async function searchPubMedIds(term: string, retmax: number = 5): Promise<string[] | null> {
  const url = `${PUBMED_BASE_URL}esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${retmax}`;
  const data = await makePubMedRequest<PubMedSearchResult>(url);
  
  if (!data || !data.esearchresult) {
    return null;
  }
  
  return data.esearchresult.idlist || [];
}

/**
 * Fetch PubMed summaries for given PMIDs
 */
export async function fetchPubMedSummaries(pmids: string[]): Promise<PubMedSummary[] | null> {
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

/**
 * Fetch PubMed XML for given PMIDs with comprehensive data
 */
export async function fetchPubMedXml(pmids: string[]): Promise<string | null> {
  if (!pmids.length) {
    return null;
  }
  
  const ids = pmids.join(",");
  const url = `${PUBMED_BASE_URL}efetch.fcgi?db=pubmed&id=${ids}&retmode=xml&rettype=medline`;
  return await makePubMedRequest<string>(url, "application/xml");
}

/**
 * Fetch comprehensive PubMed data including MeSH, chemicals, grants, etc.
 */
export async function fetchComprehensivePubMedData(pmids: string[]): Promise<any | null> {
  if (!pmids.length) {
    return null;
  }
  
  const ids = pmids.join(",");
  // Use efetch to get complete MEDLINE records
  const url = `${PUBMED_BASE_URL}efetch.fcgi?db=pubmed&id=${ids}&retmode=xml&rettype=full`;
  const xmlData = await makePubMedRequest<string>(url, "application/xml");
  
  if (!xmlData) {
    return null;
  }
  
  return parseComprehensiveXML(xmlData);
}

/**
 * Get PubMed citation data
 */
export async function fetchPubMedCitations(pmid: string): Promise<string[] | null> {
  try {
    // Get papers that cite this PMID
    const url = `${PUBMED_BASE_URL}elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed_citedin&retmode=json`;
    const data = await makePubMedRequest<any>(url);
    
    if (data && data.linksets && data.linksets[0] && data.linksets[0].linksetdbs) {
      const citationLinks = data.linksets[0].linksetdbs.find((link: any) => link.linkname === 'pubmed_pubmed_citedin');
      return citationLinks ? citationLinks.links : [];
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching citations:", error);
    return null;
  }
}

/**
 * Get related articles
 */
export async function fetchRelatedArticles(pmid: string, max_results: number = 10): Promise<string[] | null> {
  try {
    const url = `${PUBMED_BASE_URL}elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=pubmed_pubmed&retmode=json`;
    const data = await makePubMedRequest<any>(url);
    
    if (data && data.linksets && data.linksets[0] && data.linksets[0].linksetdbs) {
      const relatedLinks = data.linksets[0].linksetdbs.find((link: any) => link.linkname === 'pubmed_pubmed');
      if (relatedLinks && relatedLinks.links) {
        return relatedLinks.links.slice(0, max_results);
      }
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching related articles:", error);
    return null;
  }
}

/**
 * Parse comprehensive XML data from PubMed
 */
export function parseComprehensiveXML(xmlContent: string): any {
  try {
    const data: any = {
      articles: []
    };
    
    // Parse PubmedArticle elements
    const articlePattern = /<PubmedArticle>(.*?)<\/PubmedArticle>/gs;
    const articleMatches = [...xmlContent.matchAll(articlePattern)];
    
    for (const articleMatch of articleMatches) {
      const articleXml = articleMatch[1];
      const article: any = {};
      
      // Extract PMID
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      if (pmidMatch) article.pmid = pmidMatch[1];
      
      // Extract comprehensive author information
      article.authors = parseAuthorsFromXml(articleXml);
      
      // Extract MeSH headings with qualifiers
      article.meshHeadings = parseMeshHeadingsFromXml(articleXml);
      
      // Extract chemicals/substances
      article.chemicals = parseChemicalsFromXml(articleXml);
      
      // Extract grant information
      article.grants = parseGrantsFromXml(articleXml);
      
      // Extract publication types
      article.publicationTypes = parsePublicationTypesFromXml(articleXml);
      
      // Extract keywords
      article.keywords = parseKeywordsFromXml(articleXml);
      
      // Extract journal information
      article.journal = parseJournalFromXml(articleXml);
      
      // Extract references (if available)
      article.references = parseReferencesFromXml(articleXml);
      
      // Extract full abstract with sections
      article.abstract = parseStructuredAbstractFromXml(articleXml);
      
      // Extract article IDs
      article.articleIds = parseArticleIdsFromXml(articleXml);
      
      // Extract publication history
      article.history = parsePublicationHistoryFromXml(articleXml);
      
      data.articles.push(article);
    }
    
    return data;
  } catch (error) {
    console.error("Error parsing comprehensive XML:", error);
    return null;
  }
}

/**
 * Parse authors with affiliations from XML
 */
function parseAuthorsFromXml(xmlContent: string): any[] {
  const authors: any[] = [];
  const authorPattern = /<Author[^>]*>(.*?)<\/Author>/gs;
  const authorMatches = [...xmlContent.matchAll(authorPattern)];
  
  for (const authorMatch of authorMatches) {
    const authorXml = authorMatch[1];
    const author: any = {};
    
    // Last name
    const lastNameMatch = authorXml.match(/<LastName>([^<]+)<\/LastName>/);
    if (lastNameMatch) author.lastName = lastNameMatch[1];
    
    // First name
    const firstNameMatch = authorXml.match(/<FirstName>([^<]+)<\/FirstName>/);
    if (firstNameMatch) author.firstName = firstNameMatch[1];
    
    // Initials
    const initialsMatch = authorXml.match(/<Initials>([^<]+)<\/Initials>/);
    if (initialsMatch) author.initials = initialsMatch[1];
    
    // Full name
    author.name = `${author.lastName || ''}${author.firstName ? ', ' + author.firstName : ''}${author.initials && !author.firstName ? ', ' + author.initials : ''}`.trim();
    
    // ORCID
    const orcidMatch = authorXml.match(/<Identifier[^>]*Source="ORCID"[^>]*>([^<]+)<\/Identifier>/);
    if (orcidMatch) author.orcid = orcidMatch[1];
    
    // Affiliation
    const affiliationPattern = /<Affiliation>([^<]+)<\/Affiliation>/g;
    const affiliationMatches = [...authorXml.matchAll(affiliationPattern)];
    if (affiliationMatches.length > 0) {
      author.affiliations = affiliationMatches.map(m => m[1]);
    }
    
    authors.push(author);
  }
  
  return authors;
}

/**
 * Parse MeSH headings with qualifiers
 */
function parseMeshHeadingsFromXml(xmlContent: string): any[] {
  const meshHeadings: any[] = [];
  const meshPattern = /<MeshHeading>(.*?)<\/MeshHeading>/gs;
  const meshMatches = [...xmlContent.matchAll(meshPattern)];
  
  for (const meshMatch of meshMatches) {
    const meshXml = meshMatch[1];
    const mesh: any = {};
    
    // Descriptor name
    const descriptorMatch = meshXml.match(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/);
    if (descriptorMatch) mesh.term = descriptorMatch[1];
    
    // Qualifiers
    const qualifierPattern = /<QualifierName[^>]*>([^<]+)<\/QualifierName>/g;
    const qualifierMatches = [...meshXml.matchAll(qualifierPattern)];
    if (qualifierMatches.length > 0) {
      mesh.qualifiers = qualifierMatches.map(m => m[1]);
    }
    
    // Major topic
    const majorTopicMatch = meshXml.match(/MajorTopicYN="([^"]+)"/);
    if (majorTopicMatch) mesh.majorTopic = majorTopicMatch[1] === 'Y';
    
    meshHeadings.push(mesh);
  }
  
  return meshHeadings;
}

/**
 * Parse chemicals/substances
 */
function parseChemicalsFromXml(xmlContent: string): any[] {
  const chemicals: any[] = [];
  const chemicalPattern = /<Chemical>(.*?)<\/Chemical>/gs;
  const chemicalMatches = [...xmlContent.matchAll(chemicalPattern)];
  
  for (const chemicalMatch of chemicalMatches) {
    const chemicalXml = chemicalMatch[1];
    const chemical: any = {};
    
    const nameMatch = chemicalXml.match(/<NameOfSubstance[^>]*>([^<]+)<\/NameOfSubstance>/);
    if (nameMatch) chemical.name = nameMatch[1];
    
    const registryMatch = chemicalXml.match(/<RegistryNumber>([^<]+)<\/RegistryNumber>/);
    if (registryMatch) chemical.registryNumber = registryMatch[1];
    
    chemicals.push(chemical);
  }
  
  return chemicals;
}

/**
 * Parse grant information
 */
function parseGrantsFromXml(xmlContent: string): any[] {
  const grants: any[] = [];
  const grantPattern = /<Grant>(.*?)<\/Grant>/gs;
  const grantMatches = [...xmlContent.matchAll(grantPattern)];
  
  for (const grantMatch of grantMatches) {
    const grantXml = grantMatch[1];
    const grant: any = {};
    
    const grantIdMatch = grantXml.match(/<GrantID>([^<]+)<\/GrantID>/);
    if (grantIdMatch) grant.grantId = grantIdMatch[1];
    
    const acronymMatch = grantXml.match(/<Acronym>([^<]+)<\/Acronym>/);
    if (acronymMatch) grant.acronym = acronymMatch[1];
    
    const agencyMatch = grantXml.match(/<Agency>([^<]+)<\/Agency>/);
    if (agencyMatch) grant.agency = agencyMatch[1];
    
    const countryMatch = grantXml.match(/<Country>([^<]+)<\/Country>/);
    if (countryMatch) grant.country = countryMatch[1];
    
    grants.push(grant);
  }
  
  return grants;
}

/**
 * Parse publication types
 */
function parsePublicationTypesFromXml(xmlContent: string): string[] {
  const publicationTypes: string[] = [];
  const pubTypePattern = /<PublicationType[^>]*>([^<]+)<\/PublicationType>/g;
  const pubTypeMatches = [...xmlContent.matchAll(pubTypePattern)];
  
  for (const match of pubTypeMatches) {
    publicationTypes.push(match[1]);
  }
  
  return publicationTypes;
}

/**
 * Parse keywords
 */
function parseKeywordsFromXml(xmlContent: string): string[] {
  const keywords: string[] = [];
  const keywordPattern = /<Keyword[^>]*>([^<]+)<\/Keyword>/g;
  const keywordMatches = [...xmlContent.matchAll(keywordPattern)];
  
  for (const match of keywordMatches) {
    keywords.push(match[1]);
  }
  
  return keywords;
}

/**
 * Parse journal information
 */
function parseJournalFromXml(xmlContent: string): any {
  const journal: any = {};
  
  const titleMatch = xmlContent.match(/<Title>([^<]+)<\/Title>/);
  if (titleMatch) journal.title = titleMatch[1];
  
  const issnMatch = xmlContent.match(/<ISSN[^>]*>([^<]+)<\/ISSN>/);
  if (issnMatch) journal.issn = issnMatch[1];
  
  const volumeMatch = xmlContent.match(/<Volume>([^<]+)<\/Volume>/);
  if (volumeMatch) journal.volume = volumeMatch[1];
  
  const issueMatch = xmlContent.match(/<Issue>([^<]+)<\/Issue>/);
  if (issueMatch) journal.issue = issueMatch[1];
  
  return journal;
}

/**
 * Parse references (if available)
 */
function parseReferencesFromXml(xmlContent: string): string[] {
  const references: string[] = [];
  const refPattern = /<Reference[^>]*>([^<]+)<\/Reference>/g;
  const refMatches = [...xmlContent.matchAll(refPattern)];
  
  for (const match of refMatches) {
    references.push(match[1]);
  }
  
  return references;
}

/**
 * Parse structured abstract with sections
 */
function parseStructuredAbstractFromXml(xmlContent: string): any {
  const abstract: any = {
    sections: [],
    fullText: ""
  };
  
  const abstractPattern = /<AbstractText[^>]*(?:\s+Label="([^"]*)")?[^>]*>(.*?)<\/AbstractText>/gs;
  const abstractMatches = [...xmlContent.matchAll(abstractPattern)];
  
  if (abstractMatches.length > 0) {
    for (const match of abstractMatches) {
      const label = match[1] || "Main";
      let text = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      
      if (text) {
        abstract.sections.push({
          label: label,
          text: text
        });
        abstract.fullText += (abstract.fullText ? " " : "") + text;
      }
    }
  } else {
    // Try simple abstract pattern
    const simpleAbstractMatch = xmlContent.match(/<Abstract[^>]*>(.*?)<\/Abstract>/s);
    if (simpleAbstractMatch) {
      const text = simpleAbstractMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      abstract.fullText = text;
      abstract.sections = [{ label: "Main", text: text }];
    }
  }
  
  return abstract;
}

/**
 * Parse article IDs
 */
function parseArticleIdsFromXml(xmlContent: string): any[] {
  const articleIds: any[] = [];
  const idPattern = /<ArticleId[^>]*IdType="([^"]+)"[^>]*>([^<]+)<\/ArticleId>/g;
  const idMatches = [...xmlContent.matchAll(idPattern)];
  
  for (const match of idMatches) {
    articleIds.push({
      idType: match[1],
      value: match[2]
    });
  }
  
  return articleIds;
}

/**
 * Parse publication history
 */
function parsePublicationHistoryFromXml(xmlContent: string): any[] {
  const history: any[] = [];
  const historyPattern = /<PubMedPubDate[^>]*PubStatus="([^"]+)"[^>]*>(.*?)<\/PubMedPubDate>/gs;
  const historyMatches = [...xmlContent.matchAll(historyPattern)];
  
  for (const match of historyMatches) {
    const status = match[1];
    const dateXml = match[2];
    
    const yearMatch = dateXml.match(/<Year>(\d+)<\/Year>/);
    const monthMatch = dateXml.match(/<Month>(\d+)<\/Month>/);
    const dayMatch = dateXml.match(/<Day>(\d+)<\/Day>/);
    
    if (yearMatch) {
      const dateStr = `${yearMatch[1]}-${monthMatch ? monthMatch[1].padStart(2, '0') : '01'}-${dayMatch ? dayMatch[1].padStart(2, '0') : '01'}`;
      history.push({
        status: status,
        date: dateStr
      });
    }
  }
  
  return history;
}

/**
 * Parse abstract from PubMed XML content (enhanced version)
 */
export function parseAbstractFromXml(xmlContent: string): string {
  try {
    const abstractData = parseStructuredAbstractFromXml(xmlContent);
    return abstractData.fullText || "No abstract available";
  } catch (error) {
    return "Error parsing abstract";
  }
}

/**
 * Format PubMed paper summary for display
 */
export function formatPubMedPaper(summary: PubMedSummary): string {
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
