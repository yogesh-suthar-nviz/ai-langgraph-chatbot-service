# LangGraph Design Patterns & Workflows

This document details the core architectural patterns implemented in the AI Chatbot Platform using **LangGraph.js**.

---

## 1. Linear Graph

Linear graphs execute steps in a strict, predictable sequence where each node transforms the state and passes it to the next.

```mermaid
graph LR
    A[Load Context] --> B[Validate Request]
    B --> C[Generate Response]
    C --> D[Log Metrics]
```

---

## 2. Conditional Routing

Conditional edges evaluate state properties and route to appropriate successor nodes.

```mermaid
graph TD
    A[Classify Intent] --> RouteCondition{routeIntent}
    RouteCondition -->|product_search| B[Commerce Subgraph]
    RouteCondition -->|order_status| C[Support Subgraph]
    RouteCondition -->|knowledge_search| D[Knowledge Subgraph]
    RouteCondition -->|other| E[Clarification Node]
```

---

## 3. Graph Loops & Iteration Bounds

Loops allow graphs to refine outputs or retry operations until a condition is satisfied. Every loop **must** have an upper bound (`MAX_SEARCH_ATTEMPTS = 3`) to prevent infinite recursion and token exhaustion.

```mermaid
graph TD
    Start[Extract Filters] --> Search[Search Products]
    Search --> Eval{Results Found?}
    Eval -->|Yes| Resp[Generate Response]
    Eval -->|No AND attempts < 3| Refine[Refine Query & Relax Bounds]
    Refine --> Search
    Eval -->|No AND attempts >= 3| Resp
```

---

## 4. Controlled Tool Calling

Tools represent external capabilities. The LLM suggests tool parameters, but the application validates input schemas with Zod and enforces server-side permission checks.

```mermaid
graph TD
    Node[Graph Node] --> ToolReq[Tool Execution Request]
    ToolReq --> AuthCheck{can user execute tool?}
    AuthCheck -->|No| Reject[Return Authorization Error]
    AuthCheck -->|Yes| ZodCheck{Zod Schema Valid?}
    ZodCheck -->|Yes| Exec[Execute Tool via Integration]
    ZodCheck -->|No| SchemaErr[Return Schema Validation Error]
    Exec --> Result[Update Graph State with Tool Result]
```

---

## 5. Subgraphs & Hierarchical Composition

Subgraphs encapsulate specialized domain logic. The Main Graph acts as a coordinator, delegating tasks to subgraphs that maintain their own internal state transitions.

```mermaid
graph TD
    Main[Main Chat Graph] --> Route[Router]
    Route --> Sub[Commerce Subgraph]
    subgraph Commerce Subgraph
        SF[Extract Filters] --> VF[Validate Filters]
        VF --> SP[Search Catalog]
        SP --> GR[Format Product Cards]
    end
    Sub --> Main
```

---

## 6. Human-In-The-Loop (Interrupt & Checkpoint)

High-stakes operations (e.g. monetary refunds > ₹5,000) trigger human approval workflows. The graph interrupts execution and yields control until a human supervisor submits approval.

```mermaid
graph TD
    Req[Refund Request] --> Retrieve[Get Order Details]
    Retrieve --> CheckRules[Check 30-Day Policy]
    CheckRules --> Threshold{Amount > ₹5,000?}
    Threshold -->|No| AutoExec[Execute Refund Tool]
    Threshold -->|Yes| Interrupt[INTERRUPT: Require Supervisor Approval]
    Interrupt --> SaveState[(Save Checkpoint to PostgreSQL)]
    SaveState --> Wait[Wait for Supervisor API Action]
    Wait --> Resume[Resume Graph Execution]
    Resume --> AutoExec
    AutoExec --> Done[Send Confirmation to User]
```

---

## 7. Deterministic Workflows vs Autonomous Agents

**The Golden Rule**: *Do not use an autonomous agent when a deterministic workflow is sufficient.*

| Aspect | Pure Autonomous Agent | LangGraph Hybrid Architecture (Used Here) |
| :--- | :--- | :--- |
| **Routing** | LLM guesses next step freely | Deterministic router based on structured intent |
| **Security** | LLM can be prompt-injected into bypassing checks | Server-side permission guards check every tool execution |
| **Financial Actions** | Agent calls refund tool directly | Hard rule-based validation + Human-In-The-Loop approval |
| **Predictability** | High variance & hallucination risk | Low variance, deterministic state transitions |
