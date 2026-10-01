# API Specification & Contracts

The `ai-service` exposes a strictly versioned REST and Server-Sent Events (SSE) streaming API at `/api/v1/...`.

Interactive OpenAPI Swagger UI is available at:
`http://localhost:4000/docs`

---

## 1. Chat & Streaming Endpoint

### `POST /api/v1/chat`

Handles message transmission, multi-intent classification, LangGraph workflow execution, and real-time streaming deltas.

#### Request Headers
| Header | Type | Description |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Required |
| `Authorization` | `Bearer <token>` | Optional. Defaults to guest session if omitted |
| `X-Request-Id` | `string` | Optional client-generated tracing ID |

#### Request Body
```json
{
  "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Show me white laminate under ₹4,000",
  "stream": true,
  "guestSessionId": "optional-guest-id",
  "action": "message"
}
```

#### Streaming Response (`stream: true`)
Returns a `text/event-stream` stream with conceptual events:
- `graph-start`: `{ graphRunId, conversationId, userType }`
- `node-start`: `{ node: "understand_intent" }`
- `node-end`: `{ node: "understand_intent", intent: "product_search", route: "commerce" }`
- `tool-start`: `{ tool: "searchProducts", query: "laminate" }`
- `tool-result`: `{ tool: "searchProducts", count: 4 }`
- `message-start`: `{ role: "assistant" }`
- `message-delta`: `{ delta: "I found " }`
- `message-end`: `{}`
- `graph-end`: `{ status: "completed", metadata: { products: [...] } }`

---

## 2. Conversations Management

### `GET /api/v1/conversations`
Returns all conversation threads owned by the authenticated caller.

### `POST /api/v1/conversations`
Creates a new conversation thread.
```json
{
  "title": "Running Shoes Search"
}
```

### `GET /api/v1/conversations/:id`
Retrieves conversation history and recorded messages. Server enforces that the conversation belongs to the caller.

### `DELETE /api/v1/conversations/:id`
Deletes a conversation and its messages.

---

## 3. Feedback & Monitoring

### `POST /api/v1/feedback`
Submits role-adaptive feedback with specialized fields depending on the caller type:

#### 1. Guest Visitor Payload
```json
{
  "conversationId": "uuid",
  "rating": "thumbs_up",
  "foundWhatLookingFor": true,
  "browsingCategory": "Running Shoes",
  "contactEmail": "visitor@example.com",
  "comment": "Found the shoe I wanted!"
}
```

#### 2. External Customer Payload
```json
{
  "conversationId": "uuid",
  "rating": "thumbs_up",
  "resolutionStatus": "resolved",
  "orderId": "ORD-1001",
  "supportExperienceScore": 5,
  "comment": "Fast order update."
}
```

#### 3. Internal Specialist Payload
```json
{
  "conversationId": "uuid",
  "rating": "thumbs_up",
  "accuracyScore": 5,
  "routingCorrect": true,
  "policyCompliant": true,
  "reportedIssueType": "none",
  "internalNotes": "Supervisor refund interrupt triggered correctly."
}
```

### `GET /api/v1/health`
Liveness probe returning service uptime and status.

### `GET /api/v1/ready`
Readiness probe inspecting PostgreSQL and Redis connectivity.
