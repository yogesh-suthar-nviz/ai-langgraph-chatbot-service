# AI Service Architecture Guide

## Overview

The `ai-service` is an enterprise AI orchestration and API backend built with **Node.js**, **Fastify**, **LangGraph.js**, **PostgreSQL**, and **Redis**. It is completely decoupled from the presentation layer (`chatbot-web`) and exposes a versioned REST and Server-Sent Events (SSE) streaming API.

```mermaid
graph TD
    Client[Next.js Client / Chat UI] -->|POST /api/v1/chat (SSE Stream)| API[Fastify Gateway & API Layer]
    API --> Auth[Authentication & Identity Resolver]
    Auth --> Perm[Authorization & Permission Matrix]
    Perm --> MainGraph[Main LangGraph Orchestrator]

    MainGraph --> Router[Deterministic Intent Router]
    Router -->|product_search| CommerceGraph[Commerce Subgraph]
    Router -->|order_status / refund| SupportGraph[Support Subgraph]
    Router -->|knowledge_search| KnowledgeGraph[Knowledge RAG Subgraph]
    Router -->|general_question| ClarificationNode[Clarification Node]

    CommerceGraph --> Tools[Tool Registry & Permission Check]
    SupportGraph --> Tools
    KnowledgeGraph --> VectorStore[Vector Store / In-Memo RAG]

    Tools --> ExtCommerce[Commerce Mock / BigCommerce]
    Tools --> ExtOrders[Orders Mock / ERP]

    MainGraph --> Checkpointer[(PostgreSQL / Memory Checkpointer)]
    API --> DB[(PostgreSQL Conversation Store)]
    API --> Cache[(Redis Rate Limiter & Cache)]
```

---

## Architectural Principles

1. **Why Two Independent Repositories?**
   - **Frontend vs Backend Lifecycle**: Frontend UI iterations happen rapidly and deploy directly to edge/serverless networks (e.g., Vercel, Cloudflare Pages). Orchestration services require stateful connections, background tasks, long-running agent threads, and specialized database checkpointing that deploy to container platforms (AWS ECS, Kubernetes, Cloud Run).
   - **Zero Leaked Secrets**: Frontend never touches LLM API keys, ERP credentials, or database connection strings.
   - **Independent Scaling**: Compute-heavy LLM token processing scales separately from lightweight HTTP UI traffic.

2. **Why LangGraph.js?**
   - **Deterministic Agentic Workflows**: Unlike unpredictable black-box autonomous agents, LangGraph provides stateful cyclic graphs, conditional routing, guardrails, and deterministic checkpoints.
   - **Human-In-The-Loop**: Native interrupt and resume capabilities allow high-value financial actions (e.g. refunds > ₹5,000) to halt graph execution, wait for supervisor review, and resume safely without lost state.

3. **Why Fastify?**
   - Superior throughput, schema-based JSON serialization, built-in Swagger/OpenAPI support, and minimal overhead for low-latency streaming endpoints.

4. **Normalized Identity Model**
   - The entire LangGraph and tool layer works solely with a normalized `UserIdentity` object (`id`, `type: 'guest' | 'external' | 'internal'`, `roles`, `permissions`, `tenantId`).
   - Authentication adapters (Mock, Entra ID, Auth0) normalize provider claims before any graph logic executes.
