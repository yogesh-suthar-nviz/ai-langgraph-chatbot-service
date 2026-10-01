import { ZodSchema } from 'zod';
import { ChatMessage, LLMClient, LLMResponse } from '../provider.interface.js';

export class MockLLMClient implements LLMClient {
  async generateText(messages: ChatMessage[], _options?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const lastSystemMessage = messages.find((m) => m.role === 'system')?.content || '';

    // Check system prompt context to formulate intelligent response
    let responseText = `I have received your request regarding: "${lastUserMessage}". Let me assist you with that.`;

    if (lastSystemMessage.includes('commerce') || lastUserMessage.toLowerCase().includes('shoe') || lastUserMessage.toLowerCase().includes('product')) {
      responseText = `I searched our catalog based on your preferences. Here are the top matching products found for you below.`;
    } else if (lastUserMessage.toLowerCase().includes('refund')) {
      responseText = `I have evaluated your refund request against our store policy and processed the necessary workflow.`;
    } else if (lastUserMessage.toLowerCase().includes('order')) {
      responseText = `Here are the latest order details and shipment tracking information for your inquiry.`;
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
      let intent = 'general_question';
      let confidence = 0.95;
      let reasoning = 'General question or greeting';

      if (lastUserMessage.includes('shoe') || lastUserMessage.includes('buy') || lastUserMessage.includes('find') || lastUserMessage.includes('product') || lastUserMessage.includes('jacket') || lastUserMessage.includes('search')) {
        intent = 'product_search';
        reasoning = 'User is looking for products in catalog';
      } else if (lastUserMessage.includes('refund')) {
        intent = 'refund_request';
        reasoning = 'User is requesting a refund for an order';
      } else if (lastUserMessage.includes('return')) {
        intent = 'return_request';
        reasoning = 'User is requesting to return an order';
      } else if (lastUserMessage.includes('order') || lastUserMessage.includes('status') || lastUserMessage.includes('tracking') || /ord-\d+/i.test(lastUserMessage)) {
        intent = 'order_status';
        reasoning = 'User is asking about order tracking or status';
      } else if (
        lastUserMessage.includes('policy') ||
        lastUserMessage.includes('shipping') ||
        lastUserMessage.includes('how long') ||
        lastUserMessage.includes('contact') ||
        lastUserMessage.includes('email') ||
        lastUserMessage.includes('phone') ||
        lastUserMessage.includes('support') ||
        lastUserMessage.includes('hour') ||
        lastUserMessage.includes('about') ||
        lastUserMessage.includes('faq') ||
        lastUserMessage.includes('price policy') ||
        lastUserMessage.includes('warranty')
      ) {
        intent = 'knowledge_search';
        reasoning = 'User is inquiring about company policies, contact info, or FAQs';
      }

      const rawResult = {
        intent,
        confidence,
        reasoning,
      };

      const parsed = schema.parse(rawResult);
      return { data: parsed, usage: { promptTokens: 30, completionTokens: 15 } };
    }

    // 2. Filter extraction schema handling
    if (schemaName === 'CommerceFilterExtraction') {
      let color: string | undefined;
      let query: string = lastUserMessage;
      let maxPrice: number | undefined;

      if (lastUserMessage.includes('black')) color = 'black';
      else if (lastUserMessage.includes('blue')) color = 'blue';
      else if (lastUserMessage.includes('red')) color = 'red';

      // Price regex matches: under 10000, under ₹10,000, < 10000, 5000, etc.
      const priceMatch = lastUserMessage.match(/(?:under|below|<|upto)\s*(?:₹|rs\.?|inr|\$)?\s*([\d,]+)/i);
      if (priceMatch) {
        maxPrice = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      }

      if (lastUserMessage.includes('running') || lastUserMessage.includes('shoes')) {
        query = 'running shoes';
      } else if (lastUserMessage.includes('jacket')) {
        query = 'jacket';
      }

      const rawResult = {
        query,
        color,
        maxPrice,
      };

      const parsed = schema.parse(rawResult);
      return { data: parsed, usage: { promptTokens: 35, completionTokens: 20 } };
    }

    // 3. Order ID extraction
    if (schemaName === 'OrderEntityExtraction') {
      const orderMatch = lastUserMessage.match(/ord-\d+/i);
      const rawResult = {
        orderId: orderMatch ? orderMatch[0].toUpperCase() : 'ORD-1001',
        reason: 'Customer requested via chat assistant',
      };
      const parsed = schema.parse(rawResult);
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
