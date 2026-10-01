# LangGraph Workflow Guide — Building, Changing and Scaling Workflows

Audience: engineers and AI coding agents working in `ai-service/src/graph/**`.

This is the **authoritative** guide for workflow work. Related docs and how they differ:

| Doc | Scope |
| :--- | :--- |
| `langgraph-patterns.md` | Conceptual patterns and diagrams (what the patterns *are*) |
| `extending.md` | Quick-start recipes for adding a subgraph or tool |
| **this file** | Contracts, gotchas, review checklists, scaling rules (how to do it *correctly here*) |

Where this file and the other two disagree, **this file wins**. `extending.md` §1 Step 3 in
particular still shows the imperative `invoke()` registry pattern; see §3 below for why that
is a transitional pattern and what to prefer.

---

## 1. The three contracts

Every workflow in this service is bound by three contracts. Breaking any of them produces
bugs that typecheck cleanly and pass tests — so they are review-gated, not compiler-gated.

### 1.1 State contract

All four graphs (`main`, `commerce`, `support`, `knowledge`) share **one** state schema:
`ChatStateAnnotation` in `src/graph/core/types.ts`. This is deliberate — it is what allows a
subgraph to be composed into the parent without a state adapter.

Adding a field means **two** edits that must stay in sync:

1. The `ChatState` TypeScript interface (what nodes see).
2. The `ChatStateAnnotation` entry (how LangGraph merges it across nodes).

Omit the annotation entry and the field is silently dropped between nodes. Nothing errors.

**Reducer semantics — pick deliberately, not by copy-paste:**

| Reducer | Behaviour | Use for |
| :--- | :--- | :--- |
| `(_x, y) => y` | Last write wins, replaces | Scalars and whole objects: `intent`, `route`, `response`, `currentOrder` |
| `(cur, upd) => [...cur, ...upd]` | Appends | Genuinely cumulative lists: `messages` |
| `(cur, upd) => ({...cur, ...upd})` | Shallow merge | Open bags: `metadata` |

**Trap 1 — `metadata` is shallow-merged *and* retained by the checkpointer.**
A node that writes `metadata.foo` does not clear any other key, and the checkpointer keeps
the previous turn's metadata for the same `thread_id`. Any **per-turn counter** in metadata
therefore accumulates across turns unless it is explicitly reset in the initial state.

This is not hypothetical: the token counters compounded 65 → 130 → 195 across three turns
until `chat.controller.ts` began seeding them:

```ts
metadata: {
  requestId,
  graphRunId,
  // Per-turn counters: the checkpointer retains this thread's metadata and the
  // reducer merges into it, so these must be reset or they accumulate.
  llmPromptTokens: 0,
  llmCompletionTokens: 0,
}
```

**Rule:** any metadata key that means "for this turn" must be reset in `initialState.metadata`.
Any key that means "for this thread" must not be.

**Trap 2 — `messages` appends, and the controller currently passes full history.**
`handleChatRequest` loads the whole conversation from the repository and passes it as
`messages` on every turn, while the reducer appends. On a persistent checkpointer with a
stable `thread_id`, turn N's state holds history roughly N times over. It is currently
invisible because every node reads only the *last* user message, but it is quadratic growth
and it will bite when state is serialized to Postgres.

The correct end state is: pass **only the new message**, let the checkpointer own history.
Do not change this in isolation — it is coupled to the HITL rework (§4), because resuming a
thread must not re-append the message that triggered the interrupt.

### 1.2 Node contract

```ts
export async function myNode(state: ChatState): Promise<Partial<ChatState>> { … }
```

- **Return a partial, never mutate `state`.** Treat the argument as frozen.
- **Return only what changed.** Returning untouched fields causes needless checkpoint churn.
- **Never throw raw.** Catch, log, and return `{ error: 'CODE', response: '<user-safe text>' }`.
  An uncaught throw aborts the whole graph and the client sees a bare `3:` error part.
- **Be idempotent.** A node may re-run after a resume or a retry. A node that performs a
  side effect (refund, email, write) must check whether it already happened — see
  `execute-action.ts`, which gates on `metadata.refundProcessed`.
- **No flow control inside nodes.** This is the big one; see below.

**Anti-pattern: guard-clause flow control.** The support subgraph is wired as eight
unconditional edges, so every node opens by re-implementing routing by hand:

```ts
// src/graph/support/nodes/*.ts — do not copy this into new workflows
if (state.error) return {};
```

The cost: an unauthenticated guest still traverses all eight nodes; the real control flow is
smeared across eight files instead of being readable in `graph.ts`; and every new node must
remember the guard or it will execute on a failed request. Express it as an edge instead:

```ts
.addConditionalEdges('authenticate', (s) => (s.error ? END : 'authorize'), {
  [END]: END,
  authorize: 'authorize',
})
```

New workflows must use conditional edges. When you touch an existing support node, migrating
its guard to an edge is a welcome change — just do it for the whole chain at once, not one
node at a time.

### 1.3 Edge contract

- `addEdge(a, b)` — unconditional. Use when B must always follow A.
- `addConditionalEdges(from, fn, map)` — the condition function must be **pure and
  synchronous**. It reads state and returns a key of `map`. Do not do I/O in it, and do not
  let it mutate anything.
- **Every loop must be bounded by a counter held in state.** `commerce/graph.ts` is the
  reference implementation: `search_products → evaluateResultsCondition → refine_query →
  search_products`, capped by `GRAPH_CONSTANTS.MAX_SEARCH_ATTEMPTS`. An unbounded cycle is a
  token-burn incident, not a bug.
- Keep the condition function next to the node it branches from
  (`evaluateResultsCondition` lives in `nodes/evaluate-results.ts`), not in `graph.ts`.

---

## 2. Adding a new workflow — checklist

Worked example: a `returns` workflow. Do these in order.

1. **Decide if you need a new workflow at all.** A new *intent* that routes to an existing
   subgraph is cheaper. Only add a subgraph when the node sequence genuinely differs.

2. **Add the intent** to the `Intent` union in `core/types.ts` *and* to
   `IntentClassificationSchema` in `main/router.ts`. The Zod enum is what constrains the
   model; the union is what constrains the compiler. Both or neither.

3. **Add the routing rule** in `routeIntent()` (`main/router.ts`). Routing stays
   deterministic: the model classifies, the switch dispatches. Never let the model emit a
   route name directly.

4. **Add the route constant** to `GRAPH_CONSTANTS.ROUTES` and node names to
   `GRAPH_CONSTANTS.NODES`.

5. **Extend state only if required**, per §1.1. Prefer putting workflow-local scratch data
   under `metadata` over adding a top-level field used by one workflow.

6. **Write the nodes** under `src/graph/returns/nodes/`, one node per file, per §1.2.

7. **Write the graph** in `src/graph/returns/graph.ts`. Export a `createReturnsGraph()`
   factory — never a module-level compiled singleton, so tests can build an isolated instance
   with their own checkpointer.

8. **Register the route** in `core/graph-factory.ts` (§3).

9. **Add progress labels** in `progressForNode()` in `api/controllers/chat.controller.ts`, or
   the new workflow will run with a silent UI (§6).

10. **Add tests** (§8). A workflow with no deny-path test is not done.

11. **Update `docs/langgraph.md`** structure tree and this file's workflow table if you added
    a pattern that is not already described.

---

## 3. Subgraph composition: registry vs node attachment

**Current pattern** (`core/graph-factory.ts`): each subgraph is compiled without a
checkpointer and called imperatively from inside `routeDispatchNode`:

```ts
this.register('commerce', async (state) => await commerceGraph.invoke(state));
```

This works, and it keeps route registration pleasantly decoupled. But it is a plain function
call, not graph composition, and it costs four things:

1. Child state is never checkpointed — only the parent's `route_dispatch` result is.
2. `interrupt()` inside a subgraph cannot propagate, so HITL cannot live in a subgraph.
3. `.stream()` on the parent emits nothing for child nodes, so UI progress is coarse —
   `route_dispatch` is one opaque step covering the entire subgraph.
4. A child failure surfaces as a parent node throw, losing which child node failed.

**Preferred pattern** — attach the compiled graph directly as a node. This is available
because all graphs share `ChatStateAnnotation`:

```ts
const workflow = new StateGraph(ChatStateAnnotation)
  .addNode('commerce', createCommerceGraph())
  .addNode('support', createSupportGraph())
  .addConditionalEdges('understand_intent', (s) => s.route ?? 'clarification', {
    commerce: 'commerce',
    support: 'support',
    knowledge: 'knowledge',
    clarification: 'clarification',
  })
```

Use the registry pattern only for routes that are a single node with no internal branching
(`clarification` is a fair use). Anything with real internal steps should be attached as a
node. When you convert one, pass `subgraphs: true` to `.stream()` to receive child node
events, and extend `progressForNode()` to handle the namespaced names.

---

## 4. Human-in-the-loop

**Current state: not implemented.** There is no `interrupt()` anywhere in the codebase.
`support/nodes/human-approval.ts` is an ordinary node that writes a message and falls through
to `execute_action`. Treat the HITL section of `langgraph-patterns.md` as a design target.

**Do not try to resume by pre-seeding approved state.** The controller currently seeds
`humanApprovalDetails.status = 'approved'` and re-invokes from `START`. It does not work and
cannot be made to work this way: the graph re-runs `check_rules`, which recomputes the field
unconditionally, and the `(_x, y) => y` reducer replaces the seeded approval with `pending`.
The refund never executes — verified for both external customers and internal staff.

**The correct shape:**

```ts
// in the approval node
import { interrupt } from '@langchain/langgraph';

const decision = interrupt({
  type: 'refund_approval',
  orderId: order.id,
  amount: order.totalAmount,
});
// execution halts here; state is persisted by the checkpointer

// resuming, from the controller
import { Command } from '@langchain/langgraph';

await graph.invoke(new Command({ resume: { approved: true, approverId: user.id } }), {
  configurable: { thread_id: conversationId },
});
```

Non-negotiables for any HITL work:

- **A durable checkpointer is required.** `interrupt()` with `MemorySaver` cannot survive a
  restart or a second replica. See §5.
- **Authorize the approver at resume time.** Check the permission (`order.refund`) against
  the resuming user. Who *requested* the action is not who may *approve* it.
- **Never hardcode the entity.** The controller currently hardcodes `'ORD-1001'`; the entity
  must come from the interrupt payload held in the checkpoint.
- **Keep the side-effect node idempotent.** A resume may replay it.

---

## 5. Thread and checkpointer semantics

- `thread_id` is always the `conversationId`. One conversation, one thread.
- A graph compiled with a checkpointer **resumes** that thread on every `invoke`/`stream`.
  Input state is merged into the retained state by the reducers — it does not replace it.
  Re-read §1.1 Trap 1 before adding anything to state.
- `createMainGraph(checkpointer?)` is already parameterized. Tests should pass their own.

**`MemorySaver` is a correctness ceiling, not a performance one.** It is in-process:

- Thread state is lost on restart or redeploy.
- A second replica cannot see the first replica's threads.
- Therefore HITL resume **cannot work behind a load balancer**, because the approval may land
  on a different instance than the one holding the interrupt.

Before horizontal scaling or any HITL work, move to `PostgresSaver` from
`@langchain/langgraph-checkpoint-postgres`. Notes:

- It manages its own tables via `.setup()`. Do not hand-add them to `schema.sql`.
- Postgres is already in `docker-compose.yml`; `config.DATABASE_URL` is already wired.
- Checkpoint rows grow per superstep per thread. Plan a retention job before production —
  thread state is not free, and §1.1 Trap 2 makes it grow faster than it needs to.

---

## 6. Streaming contract

The controller consumes LangGraph's own stream and translates it to the Vercel AI SDK data
stream protocol. See `docs/streaming.md` for the wire format.

```ts
mainGraph.stream(initialState, { streamMode: ['updates', 'values'] })
// yields [mode, payload] tuples:
//   'updates' -> { [nodeName]: partialState }  — one per node completion
//   'values'  -> full state after each superstep; the last one is final
```

**When you add a node, add its progress label.** `progressForNode()` in
`chat.controller.ts` maps a completed node to a `2:` data part. Return `null` for internal
guards. A node with no entry is invisible to the user — acceptable for `validate_request`,
not for anything that takes real time.

**Do not claim token streaming.** The `0:` text parts are *not* model tokens. Every terminal
response node builds its text from template strings, so the full response only exists once
the graph finishes; the controller chunks that finished string for a typewriter effect.
Making it genuine requires the response nodes to call `VercelAIClient.streamText` and the
controller to forward those deltas.

Note that `streamEvents` will **not** give you model token events here: the LLM layer calls
the Vercel AI SDK directly rather than through a LangChain chat model, so LangGraph never
sees an `on_chat_model_stream`. This is why `.stream()` is used rather than `streamEvents`.

---

## 7. Tools

Tools are the **only** sanctioned way for a workflow to touch an external system. The order
in `ToolRegistry.executeTool` is fixed and must stay that way:

1. **Authorize** — `requiredPermission` checked against the caller's `UserIdentity`.
2. **Validate** — Zod `safeParse` on the input.
3. **Execute**.

Rules:

- **The model never decides authorization.** It may propose arguments; permissions are
  checked server-side against the identity resolved from the token. There is no path where a
  prompt can grant a permission.
- **Always handle `result.success === false`.** A denied or failed tool call must change what
  the user is told. Silently swallowing it is how `execute-action.ts` came to report
  "✅ Refund Successful" for a refund that was denied and never happened.
- **Declare `requiredPermission` on every tool that reads or writes customer data**, and add
  the permission to `PERMISSIONS` plus the right `DEFAULT_ROLE_PERMISSIONS` entries.
- `toVercelAITool()` / `getVercelAITools()` exist for model-driven tool selection but are
  currently **unused** — every tool call in the graphs is explicit. If you introduce
  model-driven tool calling, it does not relax rule 1: `toVercelAITool` wraps
  `appTool.execute`, so the permission check still runs.

---

## 8. Testing requirements

A workflow change is not complete until all of these exist:

1. **Happy path** through the full graph, asserting `intent`, `route`, and the terminal
   `response`.
2. **One deny path** — a caller lacking the required permission. Assert both that the side
   effect did *not* occur and that the user-facing text does not claim it did.
   `tests/support-refund.test.ts` is the reference.
3. **Loop bound** — for any cyclic workflow, a case that exhausts the cap and still
   terminates with a sensible response.
4. **Per-turn state hygiene** — if you added a per-turn metadata counter, assert it across
   two turns on the same `thread_id`. Single-turn tests cannot catch Trap 1.

Give each test a unique `thread_id`; a shared one leaks state between tests. Run with
`pnpm test`. The mock LLM provider makes graph tests fully offline and deterministic.

---

## 9. Scaling rules

**What must change before running more than one replica:**

| Component | Today | Required for scale |
| :--- | :--- | :--- |
| Graph checkpointer | `MemorySaver`, in-process | `PostgresSaver` |
| Conversation store | Postgres **and** an in-memory map, always both written | Postgres as the single source of truth |
| Rate limiter | Redis with in-memory fallback | Redis, with the fallback treated as degraded |
| User memory | Hardcoded `Map` in `user-memory.ts` | `user_preferences` table (already in `schema.sql`, unused) |
| Knowledge retrieval | Lexical substring scoring in `InMemoVectorStore` | Real embeddings + pgvector or a vector DB |

The in-memory fallbacks are excellent for zero-dependency local development and must be kept.
The problem is that the repository writes to **both** stores unconditionally and reads
Postgres first *only if it returns rows* — so an empty-but-valid result silently falls through
to memory and the two diverge. Before scaling, make Postgres authoritative when connected and
let the memory path be a clearly-labelled degraded mode.

**Per-request cost discipline:**

- Every `generateStructured` call is a blocking model round-trip. A workflow's latency is the
  sum of its LLM nodes. Budget them: the main graph already spends one on intent
  classification before any workflow runs.
- Bound every loop (§1.3). `MAX_SEARCH_ATTEMPTS = 3` means up to 3× the search cost.
- Thread usage through `metadata.llmPromptTokens` / `llmCompletionTokens` in any node that
  calls the model, or that node's cost becomes invisible in the run metrics.
- Note `GRAPH_CONSTANTS.MAX_SEARCH_ATTEMPTS` and `REFUND_APPROVAL_THRESHOLD_INR` are
  hardcoded while `config.MAX_SEARCH_ATTEMPTS` and `config.REFUND_APPROVAL_THRESHOLD` exist
  and are never read. Wire the constants to config before anyone tries to tune them by env var.

**Adding workflows scales linearly, by design.** A new workflow touches `router.ts`,
`graph-factory.ts`, `constants.ts`, `progressForNode()` and its own directory. It does not
touch existing workflows. Preserve that property: if a change to one workflow requires
editing another workflow's nodes, the shared logic belongs in a tool or a shared node, not
copied across.

---

## 10. Anti-patterns quick reference

| Do not | Instead |
| :--- | :--- |
| `if (state.error) return {}` at the top of a node | A conditional edge that routes to `END` |
| Add a `ChatState` field without an annotation entry | Add both, with a deliberate reducer |
| Put a per-turn counter in `metadata` without resetting it | Seed it to `0` in `initialState.metadata` |
| Resume a workflow by pre-seeding "approved" state | `interrupt()` + `Command({ resume })` |
| Ignore `result.success === false` from a tool | Surface it; never report an action that did not happen |
| Let the model return a route name | Model classifies intent; `routeIntent()` dispatches |
| An unbounded cycle | A counter in state plus a cap in `GRAPH_CONSTANTS` |
| A module-level compiled graph with a baked checkpointer | A `createXGraph(checkpointer?)` factory |
| Claim a capability in docs before it is wired | Document what the code does; list the rest as a target |
| Reuse a `thread_id` across tests | A unique `thread_id` per test |
