import { ChatState } from '../../core/types.js';
import { toolRegistry } from '../../../tools/registry.js';
import { logger } from '../../../observability/logger.js';

export async function searchProductsNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Commerce Node: search_products', {
    conversationId: state.conversationId,
    attempt: state.searchAttempts,
    filters: state.extractedFilters,
  });

  const filters = state.extractedFilters || {};

  const result = await toolRegistry.executeTool('searchProducts', filters, {
    user: state.user,
    conversationId: state.conversationId,
  });

  if (result.success && Array.isArray(result.data)) {
    return {
      matchedProducts: result.data,
    };
  }

  return {
    matchedProducts: [],
    error: result.error,
  };
}
