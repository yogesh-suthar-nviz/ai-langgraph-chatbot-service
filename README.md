# AI Service (LangGraph.js & Fastify)

Independent AI application and orchestration service powering the enterprise chatbot platform.

## Features
- **LangGraph.js Architecture**: StateGraph with subgraphs (Commerce, Support, Knowledge), cyclic search loops with bounded retries, and Human-In-The-Loop checkpoints.
- **Strict Authorization**: Server-side permission model (`can(user, permission)`) with Guest, External User, and Internal User personas.
- **Streaming Protocol**: Real-time Server-Sent Events (SSE) emitting `message-delta`, `tool-start`, `tool-result`, `node-start`, and `graph-end`.
- **Zero-Dependency Local Dev**: Automatic in-memory database and mock LLM fallbacks if Postgres, Redis, or OpenAI keys are absent.
- **OpenAPI / Swagger**: Interactive API docs at `/docs`.

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp .env.example .env

# 3. Run development server (port 4000)
pnpm dev

# 4. Run tests
pnpm test

# 5. Build for production
pnpm build
```

---

## Key Endpoints
- `POST /api/v1/chat`: Streaming SSE and REST chat endpoint
- `GET /api/v1/conversations`: List conversations for the user
- `POST /api/v1/conversations`: Create conversation
- `GET /api/v1/conversations/:id`: Retrieve conversation history
- `DELETE /api/v1/conversations/:id`: Delete conversation
- `POST /api/v1/feedback`: Submit user feedback
- `GET /api/v1/me`: Current caller identity and permissions
- `GET /api/v1/health`: Liveness probe
- `GET /api/v1/ready`: Readiness probe
- `GET /docs`: Interactive Swagger UI
