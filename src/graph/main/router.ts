import { z } from 'zod';
import { ChatState, Intent } from '../core/types.js';
import { LLMFactory } from '../../llm/factory.js';
import { INTENT_CLASSIFICATION_PROMPT } from '../../prompts/intent/classify-intent.js';
import { logger } from '../../observability/logger.js';

export const IntentClassificationSchema = z.object({
  intent: z.enum([
    'general_question',
    'product_search',
    'product_details',
    'order_status',
    'return_request',
    'refund_request',
    'account_help',
    'knowledge_search',
    'unknown',
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

export async function classifyIntentNode(state: ChatState): Promise<Partial<ChatState>> {
  const lastUserMsg = [...state.messages].reverse().find((m) => m.role === 'user')?.content || state.query || '';
  logger.info('Executing Main Node: understand_intent', { userMessage: lastUserMsg });

  const llm = LLMFactory.getClient();

  try {
    const { data, usage } = await llm.generateStructured(
      [
        { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
        { role: 'user', content: lastUserMsg },
      ],
      IntentClassificationSchema,
      'IntentClassification',
      'Classify the user intent into one of the allowed system intents'
    );

    const route = routeIntent(data.intent);
    logger.info('Intent classified deterministically', { intent: data.intent, route, confidence: data.confidence });

    return {
      intent: data.intent as Intent,
      route,
      metadata: {
        intentConfidence: data.confidence,
        intentReasoning: data.reasoning,
        llmPromptTokens: (Number(state.metadata?.llmPromptTokens) || 0) + (usage?.promptTokens || 0),
        llmCompletionTokens: (Number(state.metadata?.llmCompletionTokens) || 0) + (usage?.completionTokens || 0),
      },
    };
  } catch (err: any) {
    logger.warn('Intent classification fallback to general_question', { error: err.message });
    return {
      intent: 'general_question',
      route: 'clarification',
    };
  }
}

/**
 * Deterministic router: The LLM understands intent, but the application controls routing.
 */
export function routeIntent(intent?: Intent): 'commerce' | 'support' | 'knowledge' | 'clarification' {
  switch (intent) {
    case 'product_search':
    case 'product_details':
      return 'commerce';

    case 'order_status':
    case 'return_request':
    case 'refund_request':
      return 'support';

    case 'knowledge_search':
      return 'knowledge';

    case 'general_question':
    case 'account_help':
    case 'unknown':
    default:
      return 'clarification';
  }
}
