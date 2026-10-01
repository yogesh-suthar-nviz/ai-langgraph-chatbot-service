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
    textResponse =
      "I couldn't find any decors matching those exact criteria. Would you like to try a different " +
      'colour, finish, material family, or price range?';
  } else {
    const top3 = products
      .slice(0, 3)
      .map((p) => {
        const detail = [p.finish, p.thicknessMm ? `${p.thicknessMm}mm` : null].filter(Boolean).join(', ');
        const stock = p.inStock ? '' : ' — _currently out of stock_';
        return (
          `• **${p.name}**${detail ? ` (${detail})` : ''} — ` +
          `₹${p.price.toLocaleString('en-IN')} per ${p.priceUnit || 'unit'}${stock}`
        );
      })
      .join('\n');

    const more = count > 3 ? `\n\nShowing the top 3 of **${count}** matches.` : '';
    textResponse =
      `I found **${count}** matching decor${count > 1 ? 's' : ''}:\n\n${top3}${more}\n\n` +
      'Each card below has the sheet sizes, rated applications and certifications.';
  }

  return {
    response: textResponse,
    metadata: {
      products,
      component: 'product_carousel',
    },
  };
}
