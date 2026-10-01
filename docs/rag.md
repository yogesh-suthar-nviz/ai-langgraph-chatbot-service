# Retrieval-Augmented Generation (RAG) Architecture

## Overview
The RAG pipeline provides context-grounded answers for store return policies, shipping FAQs, and internal operating procedures.

```text
User Inquiry: "What is your 30-day return policy?"
      │
      ▼
Knowledge Subgraph Node (searchKnowledge)
      │
      ▼
Vector Store / Lexical Scorer
      │
      ├─► Filter out confidential docs if caller lacks 'internal.knowledge'
      ├─► Score documents by relevance and query overlap
      └─► Return top-3 matches
      │
      ▼
generateKnowledgeResponseNode
      │
      ├─► Assemble grounded response
      └─► Attach citations metadata for frontend CitationsList badge
```

---

## Access Control in RAG
Documents tagged `isConfidential: true` (e.g. `doc-003: Internal SOP High-Value Refund Approval Guidelines`) are automatically excluded from the vector search results unless `can(user, 'internal.knowledge')` evaluates to true.
