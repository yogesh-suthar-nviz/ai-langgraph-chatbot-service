import { ApplicationTool, ToolContext, ToolResult, toVercelAITool } from './core/tool.interface.js';
import { authorize } from '../auth/authorization/authorizer.js';
import { searchProductsTool } from './commerce/search-products.js';
import { getProductTool } from './commerce/get-product.js';
import { getOrderTool } from './order/get-order.js';
import { createReturnTool } from './order/create-return.js';
import { refundOrderTool } from './order/refund.js';
import { searchDocumentsTool } from './knowledge/search-documents.js';
import { logger } from '../observability/logger.js';

export class ToolRegistry {
  private tools: Map<string, ApplicationTool> = new Map();

  constructor() {
    this.register(searchProductsTool);
    this.register(getProductTool);
    this.register(getOrderTool);
    this.register(createReturnTool);
    this.register(refundOrderTool);
    this.register(searchDocumentsTool);
  }

  register(tool: ApplicationTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ApplicationTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ApplicationTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Returns a dictionary of native Vercel AI SDK Core tools ready for streamText/generateText.
   */
  getVercelAITools(context: ToolContext): Record<string, any> {
    const map: Record<string, any> = {};
    for (const [name, tool] of this.tools.entries()) {
      map[name] = toVercelAITool(tool, context);
    }
    return map;
  }

  /**
   * Executes a tool with automatic Zod input schema validation and server-side authorization check.
   */
  async executeTool(name: string, rawInput: unknown, context: ToolContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" is not registered in the system.`,
      };
    }

    logger.info(`Invoking tool "${name}"`, {
      toolName: name,
      userId: context.user.id,
      userType: context.user.type,
      conversationId: context.conversationId,
    });

    // 1. Authorize: check required permissions
    if (tool.requiredPermission) {
      try {
        authorize(context.user, tool.requiredPermission);
      } catch (authError: any) {
        logger.warn(`Authorization rejected for tool "${name}"`, {
          userId: context.user.id,
          requiredPermission: tool.requiredPermission,
        });
        return {
          success: false,
          error: `Unauthorized: User lacks required permission "${tool.requiredPermission}" to execute ${name}.`,
        };
      }
    }

    // 2. Validate input schema with Zod
    const parsed = tool.inputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: `Invalid input for tool "${name}": ${JSON.stringify(parsed.error.format())}`,
      };
    }

    // 3. Execute
    try {
      const result = await tool.execute(parsed.data, context);
      return result;
    } catch (err: any) {
      logger.error(`Error executing tool "${name}"`, err);
      return {
        success: false,
        error: err.message || `An error occurred while executing ${name}.`,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
