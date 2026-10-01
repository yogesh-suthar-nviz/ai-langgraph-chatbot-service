import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { orderService } from '../../integrations/orders/mock.js';

export const CreateReturnInputSchema = z.object({
  orderId: z.string().describe('The order number for return, e.g. ORD-1001'),
  reason: z.string().describe('Reason for initiating the product return'),
});

export type CreateReturnInput = z.infer<typeof CreateReturnInputSchema>;

export class CreateReturnTool implements ApplicationTool<CreateReturnInput, any> {
  name = 'createReturn';
  description = 'Initiate a return request for an eligible delivered order.';
  inputSchema = CreateReturnInputSchema;
  requiredPermission = 'order.modify';

  async execute(input: CreateReturnInput, _context: ToolContext): Promise<ToolResult<any>> {
    try {
      const result = await orderService.createReturn(input.orderId, input.reason);
      return {
        success: true,
        data: result,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to create return request',
      };
    }
  }
}

export const createReturnTool = new CreateReturnTool();
