# Memory Architecture

## Short-Term vs Long-Term Memory

```text
Short-Term Conversation Memory          Long-Term User Memory
┌─────────────────────────────┐        ┌─────────────────────────────┐
│ • Thread-scoped messages    │        │ • Category preferences     │
│ • LangGraph State Checkpoint│        │ • Shoe size / Fit preference│
│ • Tool results in thread    │        │ • Currency (INR, USD)       │
│ • Ephemeral session flags   │        │ • Durable across all chats  │
└──────────────┬──────────────┘        └──────────────┬──────────────┘
               │                                      │
               ▼                                      ▼
     PostgreSQL / Memory                   UserMemoryService (PostgreSQL)
```

1. **Short-Term Memory**:
   - Persisted in PostgreSQL table `messages` linked by `conversation_id`.
   - Loaded into `state.messages` on each request to maintain multi-turn context.
2. **Long-Term Memory**:
   - Managed by `UserMemoryService` in table `user_preferences`.
   - Injected into `state.metadata.userPreferences` at `load_context` node so the LLM respects shoe size, preferred currency, and styling tone.
