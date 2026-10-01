import { LLMClient } from './provider.interface.js';
import { MockLLMClient } from './providers/mock-provider.js';
import { OpenAIClient } from './providers/openai-provider.js';
import { VercelAIClient } from './providers/vercel-ai-provider.js';
import { config } from '../config/env.js';
import { logger } from '../observability/logger.js';

export class LLMFactory {
  private static instance: LLMClient | null = null;

  static getClient(): LLMClient {
    if (this.instance) {
      return this.instance;
    }

    if (config.LLM_PROVIDER === 'vercel') {
      logger.info('Initializing Enterprise Vercel AI SDK Core LLM provider in AI Service', {
        model: config.LLM_MODEL,
        mode: config.LLM_API_KEY ? 'live' : 'offline-mock',
      });
      this.instance = new VercelAIClient(config.LLM_API_KEY, config.LLM_MODEL);
    } else if (config.LLM_PROVIDER === 'openai' && config.LLM_API_KEY) {
      logger.info('Initializing OpenAI LLM provider', { model: config.LLM_MODEL });
      this.instance = new OpenAIClient(config.LLM_API_KEY, config.LLM_MODEL);
    } else {
      logger.info('Initializing Mock LLM provider (offline/local development)');
      this.instance = new MockLLMClient();
    }

    return this.instance;
  }

  /**
   * For testing purposes to override the singleton client.
   */
  static setClient(client: LLMClient | null): void {
    this.instance = client;
  }
}
