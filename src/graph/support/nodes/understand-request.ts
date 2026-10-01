import { z } from 'zod';
import { ChatState } from '../../core/types.js';
import { LLMFactory } from '../../../llm/factory.js';
import { logger } from '../../../observability/logger.js';

export const OrderEntityExtractionSchema = z.object({
  orderId: z.string().describe('Extracted order ID like ORD-1001'),
  reason: z.string().optional().describe('Reason for return or refund if mentioned'),
});

export async function understandSupportRequestNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Support Node: understand_request', { conversationId: state.conversationId });

  const lastUserMsg = [...state.messages].reverse().find((m) => m.role === 'user')?.content || state.query || '';
  const llm = LLMFactory.getClient();

  try {
    const { data, usage } = await llm.generateStructured(
      [
        { role: 'system', content: 'Extract the order ID (format: ORD-XXXX) and any reason mentioned.' },
        { role: 'user', content: lastUserMsg },
      ],
      OrderEntityExtractionSchema,
      'OrderEntityExtraction',
      'Extract order identifier and reason from user message'
    );

    return {
      query: data.orderId,
      metadata: {
        extractedOrderId: data.orderId,
        supportReason: data.reason || 'Customer inquiry via assistant',
        llmPromptTokens: (Number(state.metadata?.llmPromptTokens) || 0) + (usage?.promptTokens || 0),
        llmCompletionTokens: (Number(state.metadata?.llmCompletionTokens) || 0) + (usage?.completionTokens || 0),
      },
    };
  } catch {
    const match = lastUserMsg.match(/ORD-\d+/i);
    return {
      query: match ? match[0].toUpperCase() : 'ORD-1001',
      metadata: {
        extractedOrderId: match ? match[0].toUpperCase() : 'ORD-1001',
      },
    };
  }
}
