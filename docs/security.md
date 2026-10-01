# Security & Defense-in-Depth

## Core Security Rules
1. **Never Expose LLM Keys**: The Next.js frontend has zero access to OpenAI/Anthropic credentials.
2. **Server-Side Authorization**: Every protected tool explicitly requires a permission (e.g. `order.read`, `order.refund`). The authorizer rejects unauthorized calls at the application boundary.
3. **Never Let LLM Decide Authorization**: The LLM suggests intent; deterministic code verifies credentials and permissions.
4. **Input Length & Injection Guardrails**: Messages exceeding 4,000 characters are halted at `validate_request`.
5. **Rate Limiting**: Sliding window rate limits (15 req/min for guests, 60 req/min for authenticated users) backed by Redis.
6. **Bounded Graph Loops**: `MAX_SEARCH_ATTEMPTS = 3` protects against denial-of-service from infinite loops.
7. **SSRF Protection**: URL-based tools reject internal loopback (`127.0.0.1`, `localhost`, `169.254.169.254`).
