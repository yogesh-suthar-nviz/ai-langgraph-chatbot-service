import { ZodSchema } from 'zod';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMClient {
  generateText(messages: ChatMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse>;
  generateStructured<T>(
    messages: ChatMessage[],
    schema: ZodSchema<T>,
    schemaName: string,
    schemaDescription?: string
  ): Promise<{ data: T; usage?: { promptTokens: number; completionTokens: number } }>;
}
