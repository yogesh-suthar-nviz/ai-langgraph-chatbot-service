# Observability & Metrics Architecture

## Structured Logging
Every log entry carries correlation and execution context:
- `requestId`: Client correlation trace ID
- `conversationId`: Persistent thread ID
- `userId`: Normalized user ID
- `tenantId`: Organization tenant identifier
- `graphRunId`: Unique run ID for this LangGraph pass
- `nodeName`: Current executing graph node
- `toolName`: Currently invoked tool

Example structured output:
```json
{
  "level": 30,
  "time": 1727702400000,
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "conversationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "userId": "user_external_cust_ext_1001",
  "nodeName": "search_products",
  "toolName": "searchProducts",
  "msg": "Invoking tool searchProducts"
}
```

---

## Metrics Collection
The `MetricsCollector` captures:
- Total workflow duration (`totalDurationMs`)
- Individual node execution durations (`nodeTimings`)
- Tool call count
- Estimated prompt and completion token usage
- Final run status (`success`, `interrupted`, or `error`)
