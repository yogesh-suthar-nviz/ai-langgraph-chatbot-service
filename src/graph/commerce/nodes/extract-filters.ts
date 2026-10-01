import { z } from 'zod';
import { ChatState } from '../../core/types.js';
import { LLMFactory } from '../../../llm/factory.js';
import { COMMERCE_PROMPTS } from '../../../prompts/commerce/search.js';
import { logger } from '../../../observability/logger.js';

export const CommerceFilterExtractionSchema = z.object({
  query: z.string().optional().describe('Main keyword description of product'),
  category: z.string().optional().describe('Category such as running_shoes, apparel, accessories'),
  color: z.string().optional().describe('Color preference if specified'),
  maxPrice: z.number().optional().describe('Maximum budget or price threshold'),
  minPrice: z.number().optional().describe('Minimum price threshold'),
});

export type CommerceFilters = z.infer<typeof CommerceFilterExtractionSchema>;

export async function extractFiltersNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Commerce Node: extract_filters', { conversationId: state.conversationId });

  const lastUserMsg = [...state.messages].reverse().find((m) => m.role === 'user')?.content || state.query || '';
  const llm = LLMFactory.getClient();

  try {
    const { data, usage } = await llm.generateStructured(
      [
        { role: 'system', content: COMMERCE_PROMPTS.EXTRACT_FILTERS },
        { role: 'user', content: lastUserMsg },
      ],
      CommerceFilterExtractionSchema,
      'CommerceFilterExtraction',
      'Extract structured product attributes, category, color, and price bounds'
    );

    return {
      extractedFilters: data,
      searchAttempts: 1,
      metadata: {
        llmPromptTokens: (Number(state.metadata?.llmPromptTokens) || 0) + (usage?.promptTokens || 0),
        llmCompletionTokens: (Number(state.metadata?.llmCompletionTokens) || 0) + (usage?.completionTokens || 0),
      },
    };
  } catch (err: any) {
    logger.warn('Failed to extract structured filters, using raw query fallback', { error: err.message });
    return {
      extractedFilters: { query: lastUserMsg },
      searchAttempts: 1,
    };
  }
}
