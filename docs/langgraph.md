# LangGraph Architecture in AI Service

## Structure

```text
src/graph/
├── core/
│   ├── types.ts           # Strongly typed ChatState and Annotation definitions
│   ├── constants.ts       # Route names, iteration limits, node identifiers
│   ├── graph-factory.ts   # Subgraph registry enabling easy extensibility
│   └── errors.ts          # GraphExecutionError types
│
├── main/
│   ├── graph.ts           # Main coordinator graph
│   └── router.ts          # Structured intent classifier & deterministic routing
│
├── commerce/
│   ├── graph.ts           # Commerce Subgraph with cyclic query relaxation loop
│   └── nodes/             # Filter extraction, validation, search, and evaluation
│
├── support/
│   ├── graph.ts           # Support Subgraph with RBAC and Human-In-The-Loop
│   └── nodes/             # Understand, Authenticate, Authorize, Retrieve, Check rules, Approve
│
└── knowledge/
    └── graph.ts           # RAG document retrieval and citation formatting
```

---

## State Lifecycle

`ChatState` is immutable and passed across nodes:
1. `load_context`: Loads thread history and long-term user preferences from database/memory.
2. `validate_request`: Checks message size, rate limits, and injection defenses.
3. `understand_intent`: LLM produces structured intent matching `IntentClassificationSchema`.
4. `route_dispatch`: Resolves route (`commerce`, `support`, `knowledge`, `clarification`) and invokes subgraph.
5. `output_validation`: Ensures valid response structure before returning to client.
