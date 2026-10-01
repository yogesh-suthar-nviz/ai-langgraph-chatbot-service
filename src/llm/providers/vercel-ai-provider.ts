import { generateText, generateObject, streamText, wrapLanguageModel, LanguageModelV1 } from 'ai';
import { ZodSchema } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { LLMClient, ChatMessage, LLMResponse } from '../provider.interface.js';
import { logger } from '../../observability/logger.js';
import { MockLLMClient } from './mock-provider.js';

/**
 * Enterprise Vercel AI SDK Client.
 * Demonstrates full Vercel AI SDK Core capabilities:
 * 1. Language model execution via generateText & streamText
 * 2. Strict structured object parsing via generateObject (Zod schemas)
 * 3. Enterprise observability & security middleware via wrapLanguageModel
 * 4. Graceful offline simulation for local development without API keys
 */
export class VercelAIClient implements LLMClient {
  private wrappedModel: LanguageModelV1 | null = null;
  private isLive = false;
  private mockFallback = new MockLLMClient();

  constructor(apiKey?: string, private readonly modelName = 'gpt-4o-mini') {
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes('mock')) {
      const openai = createOpenAI({ apiKey });
      const rawModel = openai(this.modelName);

      // Enterprise Language Model Middleware using Vercel AI SDK wrapLanguageModel
      this.wrappedModel = wrapLanguageModel({
        model: rawModel,
        middleware: {
          wrapGenerate: async ({ doGenerate, params, model }) => {
            const start = Date.now();
            logger.info('Vercel AI SDK wrapGenerate started', {
              modelId: model.modelId,
              promptLength: params.prompt?.length || 0,
            });

            const result = await doGenerate();
            const durationMs = Date.now() - start;

            logger.info('Vercel AI SDK wrapGenerate finished', {
              durationMs,
              promptTokens: result.usage?.promptTokens,
              completionTokens: result.usage?.completionTokens,
              finishReason: result.finishReason,
            });

            return result;
          },
          wrapStream: async ({ doStream, params, model }) => {
            const start = Date.now();
            logger.info('Vercel AI SDK wrapStream started', {
              modelId: model.modelId,
              promptLength: params.prompt?.length || 0,
            });

            const result = await doStream();
            logger.info('Vercel AI SDK wrapStream stream opened', {
              handshakeMs: Date.now() - start,
            });

            return result;
          },
        },
      });

      this.isLive = true;
      logger.info('Enterprise Vercel AI SDK Client initialized with OpenAI Provider', { model: modelName });
    } else {
      logger.info('Enterprise Vercel AI SDK Client initialized in Offline/Mock Mode (Local Development)');
      this.isLive = false;
    }
  }

  private convertMessages(messages: ChatMessage[]) {
    return messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));
  }

  getModel(): LanguageModelV1 | null {
    return this.wrappedModel;
  }

  async generateText(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<LLMResponse> {
    if (!this.isLive || !this.wrappedModel) {
      return this.mockFallback.generateText(messages, options);
    }

    try {
      const result = await generateText({
        model: this.wrappedModel,
        messages: this.convertMessages(messages),
        temperature: options?.temperature ?? 0.2,
        maxTokens: options?.maxTokens,
      });

      return {
        content: result.text,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
        },
      };
    } catch (err: any) {
      logger.warn('Live Vercel AI SDK generateText failed, using fallback', { error: err.message });
      return this.mockFallback.generateText(messages, options);
    }
  }

  async streamText(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ) {
    if (!this.isLive || !this.wrappedModel) {
      throw new Error('Streaming via streamText requires a live model configuration.');
    }

    return streamText({
      model: this.wrappedModel,
      messages: this.convertMessages(messages),
      temperature: options?.temperature ?? 0.2,
      maxTokens: options?.maxTokens,
    });
  }

  async generateStructured<T>(
    messages: ChatMessage[],
    schema: ZodSchema<T>,
    schemaName: string,
    schemaDescription?: string
  ): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }> {
    if (!this.isLive || !this.wrappedModel) {
      return this.mockFallback.generateStructured(messages, schema, schemaName, schemaDescription);
    }

    try {
      const result = await generateObject({
        model: this.wrappedModel,
        messages: this.convertMessages(messages),
        schema,
        schemaName,
        schemaDescription,
      });

      return {
        data: result.object as T,
        usage: {
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
        },
      };
    } catch (err: any) {
      logger.warn('Live Vercel AI SDK generateObject failed, falling back to mock schema evaluation', {
        error: err.message,
      });
      return this.mockFallback.generateStructured(messages, schema, schemaName, schemaDescription);
    }
  }
}
