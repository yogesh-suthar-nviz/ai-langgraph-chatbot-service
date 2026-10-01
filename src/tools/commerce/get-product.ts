import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { commerceService } from '../../integrations/commerce/mock.js';
import { Product } from '../../integrations/commerce/interface.js';

export const GetProductInputSchema = z.object({
  productId: z.string().describe('The unique product identifier'),
});

export type GetProductInput = z.infer<typeof GetProductInputSchema>;

export class GetProductTool implements ApplicationTool<GetProductInput, Product | null> {
  name = 'getProduct';
  description = 'Retrieve full specifications and details for a single product by ID.';
  inputSchema = GetProductInputSchema;
  requiredPermission = 'commerce.details';

  async execute(input: GetProductInput, _context: ToolContext): Promise<ToolResult<Product | null>> {
    try {
      const product = await commerceService.getProductById(input.productId);
      return {
        success: true,
        data: product,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to get product',
      };
    }
  }
}

export const getProductTool = new GetProductTool();
