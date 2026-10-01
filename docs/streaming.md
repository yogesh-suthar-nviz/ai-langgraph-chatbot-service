# Real-Time Streaming Architecture

## Streaming Protocol

Streaming uses the **Vercel AI SDK Data Stream Protocol** (`X-Vercel-AI-Data-Stream: v1`)
over a plain `text/plain` HTTP response from `POST /api/v1/chat`. It is *not* SSE —
there are no `event:` / `data:` lines. The client is `useChat` from `@ai-sdk/react`,
which parses the protocol natively.

```text
Next.js client (useChat)
   │
   │  POST /api/chat  ──proxy──▶  POST /api/v1/chat { "stream": true }
   ▼
Fastify chat.controller
   │
   │  mainGraph.stream(state, { streamMode: ['updates', 'values'] })
   ▼
LangGraph execution — each node emits as it completes
   │
   ├─► 2:[{"type":"conversation","conversationId":"…"}]        thread identity
   ├─► 2:[{"type":"progress","node":"load_context", …}]        live node progress
   ├─► 2:[{"type":"progress","node":"understand_intent", …}]   includes intent + route
   ├─► 2:[{"type":"progress","node":"route_dispatch", …}]      includes result counts
   ├─► 0:"I found "                                            assistant text deltas
   ├─► 0:"4 options…"
   ├─► 8:[{ products:[…], component:"product_carousel", … }]   generative-UI annotations
   └─► d:{"finishReason":"stop","usage":{…}}                   finish + token usage
```

## Part codes

| Code | Part | Carries |
| :--- | :--- | :--- |
| `0:` | `text` | Assistant text deltas |
| `2:` | `data` | Graph progress and thread identity (read via `useChat`'s `data`) |
| `8:` | `message_annotations` | Products, orders, approval cards, citations, run metrics |
| `3:` | `error` | Execution failure message |
| `d:` | `finish_message` | Finish reason and token usage |

## Client handling

`ChatContainer` consumes two channels from the same `useChat` instance:

- `messages[].content` — assembled from `0:` text parts.
- `messages[].annotations` — the `8:` payload, rendered as product cards, order
  cards, approval cards and citation lists by `MessageItem`.
- `data` — the `2:` parts. The most recent `progress` label is shown as a live
  status row beneath the transcript while `isLoading` is true, and is cleared at
  the start of each turn.

## Known limitation: text is not token-streamed

`2:` progress parts are genuinely incremental — they are written as each LangGraph
node completes, so the status row advances while the graph is still running.

The `0:` text parts are **not** model tokens. Every terminal response node
(`commerce_response`, `generate_response`, `generate_knowledge_response`) builds its
text from template strings rather than from the model, so the full response only
exists once the graph has finished; the controller then chunks that finished string
for a typewriter effect. Time-to-first-*text* therefore still equals full graph
latency, even though time-to-first-*progress* does not.

Making text genuinely token-streamed requires the response nodes to call
`VercelAIClient.streamText` and the controller to forward those deltas. Note that
`streamEvents` would not help on its own: the LLM layer calls the Vercel AI SDK
directly rather than via a LangChain chat model, so LangGraph emits no
`on_chat_model_stream` events for it.
