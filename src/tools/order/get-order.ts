import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { orderService } from '../../integrations/orders/mock.js';
import { Order } from '../../integrations/orders/interface.js';

export const GetOrderInputSchema = z.object({
  orderId: z.string().describe('The order number or ID, e.g. ORD-1001'),
});

export type GetOrderInput = z.infer<typeof GetOrderInputSchema>;

export class GetOrderTool implements ApplicationTool<GetOrderInput, Order | null> {
  name = 'getOrder';
  description = 'Lookup and retrieve order status, tracking, and items by order ID.';
  inputSchema = GetOrderInputSchema;
  requiredPermission = 'order.read';

  async execute(input: GetOrderInput, context: ToolContext): Promise<ToolResult<Order | null>> {
    try {
      const order = await orderService.getOrder(input.orderId);
      if (!order) {
        return {
          success: false,
          error: `Order with ID "${input.orderId}" was not found in our records.`,
        };
      }

      // Check tenant or customer ownership if not internal staff
      if (context.user.type !== 'internal' && order.customerId !== context.user.id) {
        // Return clear ownership notice
        return {
          success: false,
          error: `You do not have permission to view order ${input.orderId}. It is registered to a different account.`,
        };
      }

      return {
        success: true,
        data: order,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to retrieve order',
      };
    }
  }
}

export const getOrderTool = new GetOrderTool();
