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
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const scored = this.documents
      .filter((d) => !d.isConfidential || allowConfidential)
      .map((doc) => {
        let matchCount = 0;
        const text = `${doc.title} ${doc.content}`.toLowerCase();

        for (const term of terms) {
          if (text.includes(term)) {
            matchCount += term.length > 3 ? 2 : 1;
          }
        }

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
