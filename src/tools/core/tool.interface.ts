import { ZodSchema } from 'zod';
import { tool, CoreTool } from 'ai';
import { UserIdentity } from '../../auth/identity/identity.types.js';

export interface ToolContext {
  user: UserIdentity;
  conversationId: string;
  requestId?: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApplicationTool<TInput = any, TOutput = any> {
  name: string;
  description: string;
  inputSchema: ZodSchema<any>;
  requiredPermission?: string;

  execute(input: TInput, context: ToolContext): Promise<ToolResult<TOutput>>;
}

/**
 * Converts an ApplicationTool into a native Vercel AI SDK CoreTool for generateText / streamText.
 */
export function toVercelAITool(
  appTool: ApplicationTool,
  context: ToolContext
) {
  return tool({
    description: appTool.description,
    parameters: appTool.inputSchema,
    execute: async (args: any) => {
      const res = await appTool.execute(args, context);
      if (!res.success) {
        throw new Error(res.error || `Execution failed for tool ${appTool.name}`);
      }
      return res.data;
    },
  });
}
