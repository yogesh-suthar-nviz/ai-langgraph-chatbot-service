import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { orderService } from '../../integrations/orders/mock.js';

export const RefundOrderInputSchema = z.object({
  orderId: z.string().describe('The order number to refund, e.g. ORD-1001'),
  amount: z.number().positive().describe('The refund amount in account currency'),
  reason: z.string().describe('Detailed business justification for the refund'),
  approverId: z.string().optional().describe('ID of manager who approved refund if over threshold'),
});

export type RefundOrderInput = z.infer<typeof RefundOrderInputSchema>;

export class RefundOrderTool implements ApplicationTool<RefundOrderInput, any> {
  name = 'refundOrder';
  description = 'Process an immediate monetary refund for an order. Protected tool requiring high authorization.';
  inputSchema = RefundOrderInputSchema;
  requiredPermission = 'order.refund';

  async execute(input: RefundOrderInput, context: ToolContext): Promise<ToolResult<any>> {
    try {
      const result = await orderService.processRefund(input.orderId, input.amount, input.approverId || context.user.id);
      return {
        success: true,
        data: result,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to process refund',
      };
    }
  }
}

export const refundOrderTool = new RefundOrderTool();
