import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgrespassword@localhost:5432/chatbot_db'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  LLM_PROVIDER: z.enum(['vercel', 'openai', 'anthropic', 'mock']).default('vercel'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  LLM_API_KEY: z.string().optional().default(''),

  AUTH_MODE: z.enum(['mock', 'oidc', 'hybrid']).default('mock'),
  INTERNAL_SSO_ENABLED: z.coerce.boolean().default(false),
  EXTERNAL_SSO_ENABLED: z.coerce.boolean().default(false),

  OIDC_ISSUER: z.string().optional().default(''),
  OIDC_CLIENT_ID: z.string().optional().default(''),
  OIDC_CLIENT_SECRET: z.string().optional().default(''),
  OIDC_AUDIENCE: z.string().optional().default(''),

  MAX_SEARCH_ATTEMPTS: z.coerce.number().default(3),
  REFUND_APPROVAL_THRESHOLD: z.coerce.number().default(5000), // In INR/USD, refunds above this require Human-In-The-Loop approval
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Environment variable validation failed');
  }
  return parsed.data;
}

export const config = loadConfig();
