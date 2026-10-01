import { ZodSchema } from 'zod';
import { ChatMessage, LLMClient, LLMResponse } from '../provider.interface.js';

/** Terms that indicate the user wants documentation rather than an action. */
const DOC_TERMS = [
  'policy', 'policies', 'warranty', 'guarantee', 'care', 'clean', 'cleaning', 'maintain',
  'maintenance', 'how long', 'lead time', 'leadtime', 'sample', 'swatch', 'chip',
  'contact', 'email', 'phone', 'support desk', 'customer service', 'hours', 'faq', 'faqs',
  'fire rating', 'fire rated', 'flame', 'astm', 'sustainab', 'greenguard', 'leed', 'eco',
  'environment', 'fabricat', 'install', 'substrate', 'adhesive', 'radius', 'postform',
  'thickness', 'sheet size', 'slab size', 'dimension', 'format', 'freight', 'damaged',
  'damage', 'restocking', 'certif', 'compliance', 'repair', 'scratch', 'seal', 'sealing',
  'heat resistant', 'cut-out', 'cutout',
  // Internal documentation. These must precede the refund/return action terms so
  // "show internal SOP for high-value refunds" is a document lookup, not a refund request.
  'sop', 'procedure', 'guideline', 'triage', 'internal doc', 'internal sop',
];

/** Terms that indicate the user is browsing the catalogue. */
const PRODUCT_TERMS = [
  'laminate', 'quartz', 'solid surface', 'solid-surface', 'compact', 'edgeband', 'edging',
  'edge band', 'countertop', 'counter top', 'worktop', 'surface', 'sheet', 'slab', 'decor',
  'panel', 'finish', 'product', 'catalog', 'catalogue', 'buy', 'price', 'pricing', 'cost',
  'show me', 'browse', 'looking for', 'do you have', 'options', 'range', 'marble', 'woodgrain',
  'oak', 'stone',
];

const ORDER_TERMS = ['order', 'status', 'tracking', 'track', 'shipment', 'delivery', 'dispatch', 'despatch'];

const QUESTION_STARTERS = ['what is', 'what are', 'how do i', 'how can i', 'can i', 'do you', 'where can', 'tell me about'];

export class MockLLMClient implements LLMClient {
  async generateText(messages: ChatMessage[], _options?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lastSystemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const lower = lastUserMessage.toLowerCase();

    let responseText = `I have received your request regarding: "${lastUserMessage}". Let me assist you with that.`;

    if (lastSystemMessage.includes('commerce') || PRODUCT_TERMS.some((t) => lower.includes(t))) {
      responseText = 'I searched our surfacing catalogue based on your requirements. The closest matching decors are shown below.';
    } else if (lower.includes('refund')) {
      responseText = 'I have evaluated your refund request against our returns policy and progressed the appropriate workflow.';
    } else if (lower.includes('order')) {
      responseText = 'Here are the latest order details and shipment tracking information for your inquiry.';
    }

    return {
      content: responseText,
      usage: {
        promptTokens: 40,
        completionTokens: 25,
      },
    };
  }

  async generateStructured<T>(
    messages: ChatMessage[],
    schema: ZodSchema<T>,
    schemaName: string,
    _schemaDescription?: string
  ): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }> {
    const lastUserMessage = ([...messages].reverse().find((m) => m.role === 'user')?.content || '').toLowerCase();

    // 1. Intent classification schema handling
    if (schemaName === 'IntentClassification') {
      const has = (terms: string[]) => terms.some((t) => lastUserMessage.includes(t));
      const hasOrderId = /ord-\d+/i.test(lastUserMessage);

      let intent = 'general_question';
      const confidence = 0.95;
      let reasoning = 'General question or greeting';

      // Informational questions are checked FIRST and beat action verbs. Without this,
      // "What is your 30-day return policy?" matches "return", routes to the support
      // workflow and is refused for guests - a public policy question must reach the
      // knowledge base. An explicit order number overrides: that is a real order query.
      if (has(DOC_TERMS) && !hasOrderId) {
        intent = 'knowledge_search';
        reasoning = 'User is asking about policies, product documentation or specifications';
      } else if (has(['refund', 'money back', 'credit note', 'reimburse'])) {
        intent = 'refund_request';
        reasoning = 'User is requesting a refund for an order';
      } else if (has(['return', 'exchange', 'send back'])) {
        intent = 'return_request';
        reasoning = 'User is requesting to return an order';
      } else if (hasOrderId || has(ORDER_TERMS)) {
        intent = 'order_status';
        reasoning = 'User is asking about order tracking or status';
      } else if (has(PRODUCT_TERMS)) {
        intent = 'product_search';
        reasoning = 'User is looking for products in the catalogue';
      } else if (has(QUESTION_STARTERS)) {
        // A general question with no catalogue signal is most usefully answered from docs.
        intent = 'knowledge_search';
        reasoning = 'Open question with no catalogue signal; searching documentation';
      }

      const parsed = schema.parse({ intent, confidence, reasoning });
      return { data: parsed, usage: { promptTokens: 30, completionTokens: 15 } };
    }

    // 2. Commerce filter extraction
    if (schemaName === 'CommerceFilterExtraction') {
      let color: string | undefined;
      let category: string | undefined;
      let finish: string | undefined;
      let query: string = lastUserMessage;
      let maxPrice: number | undefined;
      let minPrice: number | undefined;

      const COLORS = ['white', 'black', 'grey', 'gray', 'charcoal', 'oak', 'walnut', 'beige', 'sand', 'silver', 'brown', 'bronze', 'natural'];
      color = COLORS.find((c) => lastUserMessage.includes(c));
      if (color === 'gray') color = 'grey';

      if (lastUserMessage.includes('quartz')) category = 'quartz';
      else if (lastUserMessage.includes('solid surface') || lastUserMessage.includes('solid-surface')) category = 'solid_surface';
      else if (lastUserMessage.includes('edgeband') || lastUserMessage.includes('edging') || lastUserMessage.includes('edge band')) category = 'edgeband';
      else if (lastUserMessage.includes('compact')) category = 'compact_laminate';
      else if (lastUserMessage.includes('laminate')) category = 'laminate';

      if (lastUserMessage.includes('matte') || lastUserMessage.includes('matt ')) finish = 'Matte';
      else if (lastUserMessage.includes('gloss')) finish = 'Gloss';
      else if (lastUserMessage.includes('texture')) finish = 'Texture';
      else if (lastUserMessage.includes('honed')) finish = 'Honed';
      else if (lastUserMessage.includes('polished')) finish = 'Polished';

      const maxMatch = lastUserMessage.match(/(?:under|below|less than|<|upto|up to)\s*(?:₹|rs\.?|inr|\$)?\s*([\d,]+)/i);
      if (maxMatch) maxPrice = parseInt(maxMatch[1].replace(/,/g, ''), 10);

      const minMatch = lastUserMessage.match(/(?:over|above|more than|>|from)\s*(?:₹|rs\.?|inr|\$)?\s*([\d,]+)/i);
      if (minMatch) minPrice = parseInt(minMatch[1].replace(/,/g, ''), 10);

      // Narrow the free-text query to the material family when one is obvious, so the
      // lexical catalogue search is not diluted by the rest of the sentence.
      if (category) {
        query = category.replace(/_/g, ' ');
      } else if (lastUserMessage.includes('marble')) {
        query = 'marble';
      } else if (lastUserMessage.includes('woodgrain') || lastUserMessage.includes('wood grain')) {
        query = 'woodgrain';
      } else if (lastUserMessage.includes('countertop') || lastUserMessage.includes('worktop')) {
        query = 'countertop';
      }

      const parsed = schema.parse({ query, category, color, finish, maxPrice, minPrice });
      return { data: parsed, usage: { promptTokens: 35, completionTokens: 20 } };
    }

    // 3. Order ID extraction
    if (schemaName === 'OrderEntityExtraction') {
      const orderMatch = lastUserMessage.match(/ord-\d+/i);
      const parsed = schema.parse({
        orderId: orderMatch ? orderMatch[0].toUpperCase() : 'ORD-1001',
        reason: 'Customer requested via chat assistant',
      });
      return { data: parsed, usage: { promptTokens: 25, completionTokens: 15 } };
    }

    // Generic schema fallback
    try {
      const parsed = schema.parse({});
      return { data: parsed, usage: { promptTokens: 10, completionTokens: 10 } };
    } catch {
      // If empty object does not satisfy schema, create mock fields
      const mockObj: any = {};
      const parsed = schema.parse(mockObj);
      return { data: parsed };
    }
  }
}
