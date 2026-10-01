import { ChatState } from '../../core/types.js';
import { logger } from '../../../observability/logger.js';

export async function validateFiltersNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Commerce Node: validate_filters', { conversationId: state.conversationId });

  const rawFilters = state.extractedFilters || {};
  const sanitized = { ...rawFilters };

  // Sanitize negative prices
  if (sanitized.maxPrice !== undefined && sanitized.maxPrice < 0) {
    delete sanitized.maxPrice;
  }
  if (sanitized.minPrice !== undefined && sanitized.minPrice < 0) {
    delete sanitized.minPrice;
  }

  // Ensure query exists
  if (!sanitized.query && !sanitized.color && !sanitized.category) {
    sanitized.query = 'shoes';
  }

  return {
    extractedFilters: sanitized,
  };
}
