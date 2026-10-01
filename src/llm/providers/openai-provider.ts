import { ChatOpenAI } from '@langchain/openai';
import { ZodSchema } from 'zod';
import { ChatMessage, LLMClient, LLMResponse } from '../provider.interface.js';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

export class OpenAIClient implements LLMClient {
  private model: ChatOpenAI;

  constructor(apiKey: string, modelName = 'gpt-4o-mini') {
    this.model = new ChatOpenAI({
      apiKey,
      model: modelName,
      temperature: 0.2,
    });
  }

  private convertMessages(messages: ChatMessage[]) {
    return messages.map((m) => {
      if (m.role === 'system') return new SystemMessage(m.content);
      if (m.role === 'assistant') return new AIMessage(m.content);
      return new HumanMessage(m.content);
    });
  }

  async generateText(messages: ChatMessage[], _options?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse> {
    const langchainMessages = this.convertMessages(messages);
    const response = await this.model.invoke(langchainMessages);

    const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    return {
      content,
      usage: {
        promptTokens: (response.response_metadata as any)?.tokenUsage?.promptTokens || 0,
        completionTokens: (response.response_metadata as any)?.tokenUsage?.completionTokens || 0,
      },
    };
  }

  async generateStructured<T>(
    messages: ChatMessage[],
    schema: ZodSchema<T>,
    schemaName: string,
    _schemaDescription?: string
  ): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }> {
    const langchainMessages = this.convertMessages(messages);
    const structuredModel = this.model.withStructuredOutput(schema as any, {
      name: schemaName,
    });

    const result = await structuredModel.invoke(langchainMessages);
    return {
      data: result as T,
    };
  }
}
