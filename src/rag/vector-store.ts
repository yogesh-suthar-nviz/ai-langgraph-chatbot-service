import { KnowledgeDocument, MOCK_KNOWLEDGE_DOCS } from '../tools/knowledge/search-documents.js';

export interface ScoredDocument {
  doc: KnowledgeDocument;
  score: number;
}

export class InMemoVectorStore {
  private documents: KnowledgeDocument[] = [];

  constructor() {
    this.documents = [...MOCK_KNOWLEDGE_DOCS];
  }

  addDocument(doc: KnowledgeDocument): void {
    this.documents.push(doc);
  }

  /**
   * Performs semantic / lexical retrieval with relevance scoring
   */
  async search(query: string, limit = 3, allowConfidential = false): Promise<ScoredDocument[]> {
    // Strip punctuation before tokenising: without this, "sample?" never matches the
    // keyword "sample" and the question falls through to a weaker document.
    const normalized = query.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
    const terms = normalized.split(/\s+/).filter((t) => t.length > 0);

    const scored = this.documents
      .filter((d) => !d.isConfidential || allowConfidential)
      .map((doc) => {
        let matchCount = 0;
        const keywords = (doc.keywords || []).join(' ');
        const text = `${doc.title} ${doc.content} ${keywords}`.toLowerCase();
        const titleAndKeywords = `${doc.title} ${keywords}`.toLowerCase();

        for (const term of terms) {
          if (!text.includes(term)) continue;
          // Weight longer terms, and weight a title/keyword hit above a body hit so a
          // "how do I clean quartz" style question ranks the care guide first.
          matchCount += term.length > 3 ? 2 : 1;
          if (titleAndKeywords.includes(term)) matchCount += 2;
        }

        // Whole-phrase hit on a curated keyword is a strong signal.
        const phrase = normalized.trim().replace(/\s+/g, ' ');
        if (phrase.length > 3 && titleAndKeywords.includes(phrase)) matchCount += 4;

        const score = terms.length > 0 ? matchCount / terms.length : 0;
        return { doc, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }
}

export const vectorStore = new InMemoVectorStore();
