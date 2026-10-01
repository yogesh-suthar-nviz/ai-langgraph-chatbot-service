import { ChatState } from '../../core/types.js';
import { GRAPH_CONSTANTS } from '../../core/constants.js';
import { logger } from '../../../observability/logger.js';

export function evaluateResultsCondition(state: ChatState): 'refine_query' | 'commerce_response' {
  const count = state.matchedProducts?.length || 0;
  const attempts = state.searchAttempts || 1;

  if (count > 0 || attempts >= GRAPH_CONSTANTS.MAX_SEARCH_ATTEMPTS) {
    logger.info('Commerce evaluation satisfied', { count, attempts });
    return 'commerce_response';
  }

  logger.info('Commerce search yielded 0 results, looping to refine query', { attempts });
  return 'refine_query';
}

export async function refineQueryNode(state: ChatState): Promise<Partial<ChatState>> {
  const currentFilters = state.extractedFilters || {};
  const attempts = (state.searchAttempts || 1) + 1;

  logger.info('Executing Commerce Node: refine_query', {
    conversationId: state.conversationId,
    newAttempt: attempts,
  });

  // Relax restrictive filters
  const refined = { ...currentFilters };
  if (refined.finish) {
    // Finish is the most restrictive attribute: relax it first
    delete refined.finish;
  } else if (refined.color) {
    // Drop strict color constraint on the next pass
    delete refined.color;
  } else if (refined.maxPrice) {
    // Relax budget by 20% on next pass
    refined.maxPrice = Math.round(refined.maxPrice * 1.25);
  }

  return {
    extractedFilters: refined,
    searchAttempts: attempts,
  };
}
