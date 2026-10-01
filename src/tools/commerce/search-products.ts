import { z } from 'zod';
import { ApplicationTool, ToolContext, ToolResult } from '../core/tool.interface.js';
import { commerceService } from '../../integrations/commerce/mock.js';
import { Product } from '../../integrations/commerce/interface.js';

export const SearchProductsInputSchema = z.object({
  query: z.string().optional().describe('Search query keyword, e.g. "running shoes", "jacket"'),
  category: z.string().optional().describe('Product category filter'),
  color: z.string().optional().describe('Color filter, e.g. "black", "blue"'),
  maxPrice: z.number().optional().describe('Maximum price threshold'),
  minPrice: z.number().optional().describe('Minimum price threshold'),
  limit: z.number().optional().default(6).describe('Maximum number of items to return'),
});

export type SearchProductsInput = z.infer<typeof SearchProductsInputSchema>;

export class SearchProductsTool implements ApplicationTool<SearchProductsInput, Product[]> {
  name = 'searchProducts';
  description = 'Search products in catalog by keyword query, color, category, and price range.';
  inputSchema = SearchProductsInputSchema;
  requiredPermission = 'commerce.search';

  async execute(input: SearchProductsInput, _context: ToolContext): Promise<ToolResult<Product[]>> {
    try {
      const products = await commerceService.searchProducts(input);
      return {
        success: true,
        data: products,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to search products',
      };
    }
  }
}

export const searchProductsTool = new SearchProductsTool();
