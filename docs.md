UniProt website API documentation | 

[

](https://www.uniprot.org/)

UniProt API Documentation
=========================

[UniProtKB](https://www.uniprot.org/api-documentation/uniprotkb)

[UniRef](https://www.uniprot.org/api-documentation/uniref)

[UniParc](https://www.uniprot.org/api-documentation/uniparc)

[Proteomes](https://www.uniprot.org/api-documentation/proteomes)

[Supporting Data](https://www.uniprot.org/api-documentation/support-data)

[Automatic Annotation](https://www.uniprot.org/api-documentation/aa)

[ID Mapping](https://www.uniprot.org/api-documentation/idmapping)

*   [UniProtKB](https://www.uniprot.org/api-documentation/uniprotkb#UniProtKB)
*   [/uniprotkb/{accession}](https://www.uniprot.org/api-documentation/uniprotkb#operations-UniProtKB-getByAccession)
*   [/uniprotkb/stream](https://www.uniprot.org/api-documentation/uniprotkb#operations-UniProtKB-stream)
*   [/uniprotkb/search](https://www.uniprot.org/api-documentation/uniprotkb#operations-UniProtKB-searchCursor)
*   [Schemas](https://www.uniprot.org/api-documentation/uniprotkb#schemas)

UniProtKB
=========

The UniProt Knowledgebase (UniProtKB) acts as the global hub of accurate, consistent and expertly curated information on protein sequence and function. Each UniProtKB entry is described by a stable protein identifier (accession ID) and contains core data consisting of the amino acid sequence, protein name or description, taxonomic information and links to relevant scientific publications. Further annotation is added when available, such as protein function, subcellular location and the position of protein features such as active sites, domains and post-translational modifications. Where possible these annotations are described using established biological ontologies, classifications and cross-references. A clear indication of the quality of annotation in the form of evidence attribution of experimental and computational data is added to each piece of data.

* * *

GET

/uniprotkb/{accession}

Get UniProtKB entry by a single accession.

GET

/uniprotkb/stream

Download UniProtKB entries retrieved by a search query. (Max. 10 million entries)

GET

/uniprotkb/search

Retrieve UniProtKB entries by a search query.

Additional information regarding how to use the REST API is available within [the website's help articles](https://www.uniprot.org/help?facets=category%3AProgrammatic+access)

#### Schemas

AlternativeSequence

Citation

Comment

CrossReferenceCitationDatabase

CrossReferenceEvidenceDatabase

CrossReferenceUniprotKBFeatureDatabase

EC

EntryAudit

EntryInactiveReason

Evidence

EvidenceDatabase

EvidenceDatabaseDetail

EvidenceLine

FeatureLocation

Gene

GeneLocation

GeneName

GeneNameSynonym

InternalLine

InternalSection

Keyword

Ligand

LigandPart

Name

ORFName

OrderedLocusName

Organism

OrganismHost

Position

Property

ProteinDescription

ProteinName

ProteinSection

ProteinSubName

ReferenceComment

Sequence

SourceLine

TaxonomyLineage

UniProtDatabaseAttribute

UniProtDatabaseDetail

UniProtKBCrossReference

UniProtKBEntry

UniProtKBFeature

UniProtKBReference

Absorption

AlternativeName

CitationType

CofactorType

CommentType

Component

Conflict

DbReferenceType

Disease

Domain

Entry

EventType

EvidenceType

EvidencedStringType

FeatureType

GeneLocationType

GeneNameType

GeneType

ImportedFromType

InteractantType

IsoformType

KeywordType

Kinetics

LigandPartType

LigandType

Lineage

Link

LocationType

MoleculeType

NameListType

OrganismNameType

OrganismType

PhDependence

PhysiologicalReactionType

PositionType

PropertyType

ProteinExistenceType

ProteinType

ReactionType

RecommendedName

RedoxPotential

ReferenceType

SequenceType

SourceDataType

SourceType

StatusType

SubcellularLocationType

SubmittedName

TemperatureDependence

StreamResult

Facet

FacetItem

ProblemPair

SearchResult

Suggestion

TermInfo

AlternativeProductsComment

MichaelisConstant

SequenceCautionComment

Interactant

MaximumVelocity

IsoformName

Cofactor

SubcellularLocationValue

FreeTextComment

CatalyticActivityComment

DiseaseComment

CrossReferenceReactionDatabase

PhysiologicalReaction

EvidencedValue

WebResourceComment

CofactorComment

RnaEditingComment

InteractionComment

RnaEdPosition

Interaction

CrossReferenceCofactorDatabase

BPCPComment

Reaction

SubcellularLocationComment

APIsoform

KineticParameters

Note

CrossReferenceDiseaseDatabase

MassSpectrometryComment

SubcellularLocation

Literature

Submission

ElectronicArticle

Thesis

Book

Patent

JournalArticle

Link to the [OpenAPI 3.0.1 specifications](https://rest.uniprot.org/uniprotkb/api/docs) in JSON

We have chosen to apply the [Creative Commons Attribution 4.0 International (CC BY 4.0) License](https://creativecommons.org/licenses/by/4.0/) to all copyrightable parts of our databases

[![](./UniProt website API documentation _ UniProt_files/uniprot-logo.img.0df091.svg)](https://www.uniprot.org/ "UniProt home page")

[![](./UniProt website API documentation _ UniProt_files/embl-ebi-logo.img.48e02e.svg)](https://www.ebi.ac.uk/ "European Bioinformatics Institute")[![](./UniProt website API documentation _ UniProt_files/pir-logo.653769.jpg)](https://pir.georgetown.edu/ "Protein Information Resource")[![](./UniProt website API documentation _ UniProt_files/sib-logo.d55d59.png)](https://www.sib.swiss/ "Swiss Institute of Bioinformatics")

[Release 2025\_03](https://www.uniprot.org/help/downloads "UniProt release 2025_03 released on Wed Jun 18 2025") | [Statistics](https://www.uniprot.org/uniprotkb/statistics)

[© 2002 – 2025 UniProt consortium](https://www.uniprot.org/help/about)

[License & Disclaimer](https://www.uniprot.org/help/license) | [Privacy Notice](https://www.uniprot.org/help/privacy)

*   Core data
    *   [Proteins (UniProtKB)](https://www.uniprot.org/uniprotkb)
    *   [Species (Proteomes)](https://www.uniprot.org/proteomes)
    *   [Protein clusters (UniRef)](https://www.uniprot.org/uniref)
    *   [Sequence archive (UniParc)](https://www.uniprot.org/uniparc)
*   [Supporting data](https://www.uniprot.org/supporting-data)
    *   [Literature citations](https://www.uniprot.org/citations?query=*)
    *   [Taxonomy](https://www.uniprot.org/taxonomy?query=*)
    *   [Keywords](https://www.uniprot.org/keywords?query=*)
    *   [Subcellular locations](https://www.uniprot.org/locations?query=*)
    *   [Cross-referenced databases](https://www.uniprot.org/database?query=*)
    *   [Diseases](https://www.uniprot.org/diseases?query=*)
*   Tools
    *   [BLAST](https://www.uniprot.org/blast)
    *   [Align](https://www.uniprot.org/align)
    *   [Retrieve/ID mapping](https://www.uniprot.org/id-mapping)
    *   [Peptide search](https://www.uniprot.org/peptide-search)
    *   [Tool results](https://www.uniprot.org/tool-dashboard)
*   Information
    *   [Cite UniProt](https://www.uniprot.org/help/publications)
    *   [About](https://www.uniprot.org/help/about) & [Help](https://www.uniprot.org/help)
    *   [UniProtKB manual](https://www.ebi.ac.uk/training/online/courses/uniprot-exploring-protein-sequence-and-functional-info/)
    *   [Technical corner](https://www.uniprot.org/help/technical)
    *   [Expert biocuration](https://www.uniprot.org/help/biocuration)
    *   [Statistics](https://www.uniprot.org/uniprotkb/statistics)

[Get in touch](https://www.uniprot.org/contact)

[](https://www.linkedin.com/company/uniprot/ "UniProt posts on LinkedIn")[](https://x.com/uniprot "UniProt posts on X (formerly Twitter)")[](https://www.youtube.com/user/uniprotvideos "UniProt videos on YouTube")[](https://insideuniprot.blogspot.com/ "UniProt blog")

[UniProt is an ELIXIR core data resource![](./UniProt website API documentation _ UniProt_files/elixir-cdr.48c606.png)](https://www.elixir-europe.org/platforms/data/core-data-resources)[![](./UniProt website API documentation _ UniProt_files/core-trust-seal-logo.729487.png)](https://www.coretrustseal.org/wp-content/uploads/2020/05/UniProt.pdf "Core Trust Seal assessment information")

[UniProt is a GBC global core biodata resource![](./UniProt website API documentation _ UniProt_files/gbc-gcbr.img.758e37.svg)](https://globalbiodata.org/scientific-activities/global-core-biodata-resources/)

Main [funding](https://www.uniprot.org/help/about) by:[National Institutes of Health](https://www.nih.gov/)[![](./UniProt website API documentation _ UniProt_files/embl-ebi-logo.img.48e02e.svg)](https://www.embl.org/ "European Molecular Biology Laboratory")[![](./UniProt website API documentation _ UniProt_files/seri-logo.ff1353.png)](https://www.sbfi.admin.ch/sbfi/en/home.html "State Secretariat for Education, Research and Innovation SERI")

This website requires cookies, and the limited processing of your personal data in order to function. By using the site you are agreeing to this as outlined in our [Privacy Notice](https://www.uniprot.org/help/privacy).I agree, dismiss this banner

[Help](https://www.uniprot.org/help)⬆

