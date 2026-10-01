import { ChatState } from '../../core/types.js';
import { LLMFactory } from '../../../llm/factory.js';
import { COMMERCE_PROMPTS } from '../../../prompts/commerce/search.js';
import { logger } from '../../../observability/logger.js';

export async function generateCommerceResponseNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Commerce Node: commerce_response', { conversationId: state.conversationId });

  const products = state.matchedProducts || [];
  const count = products.length;

  let textResponse = '';
  if (count === 0) {
    textResponse = "I couldn't find any products matching those exact specifications in our catalog. Would you like to try a different color, category, or price range?";
  } else {
    const top3 = products.slice(0, 3).map((p) => `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (Rating: ${p.rating}★)`).join('\n');
    textResponse = `I found **${count}** great option${count > 1 ? 's' : ''} matching your search:\n\n${top3}\n\nYou can explore each product card below for sizing, specifications, and availability!`;
  }

  return {
    response: textResponse,
    metadata: {
      products,
      component: 'product_carousel',
    },
  };
}
