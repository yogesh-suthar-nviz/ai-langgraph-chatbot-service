# Tools Layer & Execution Engine

## Design Principle
Tools must remain decoupled from LangGraph and LLM provider implementations.

Every tool implements the `ApplicationTool` contract:
```typescript
interface ApplicationTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: ZodSchema<any>;
  requiredPermission?: string;
  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}
```

---

## Available Tools

| Tool Name | Input Schema | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `searchProducts` | `query, category, color, maxPrice, minPrice, limit` | `commerce.search` | Queries catalog for matching items |
| `getProduct` | `productId` | `commerce.details` | Retrieves full specs for a single product |
| `getOrder` | `orderId` | `order.read` | Looks up status and items with ownership check |
| `createReturn` | `orderId, reason` | `order.modify` | Initiates courier pickup return request |
| `refundOrder` | `orderId, amount, reason, approverId` | `order.refund` | Executes monetary refund to customer account |
| `searchDocuments` | `query` | Public / `internal.knowledge` | Searches store policies and internal SOPs |

---

## Tool Execution Lifecycle
When a tool is invoked through `toolRegistry.executeTool()`:
1. **Server-Side Authorization Check**: Verifies `can(context.user, tool.requiredPermission)`.
2. **Zod Validation**: Validates parameters against input schema.
3. **Audit Logging**: Emits structured log with caller ID, parameters, and execution time.
4. **Execution**: Dispatches to underlying commerce/ERP integration.
