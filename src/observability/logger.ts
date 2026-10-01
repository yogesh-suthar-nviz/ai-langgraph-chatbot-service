import pino from 'pino';
import { config } from '../config/env.js';

export interface RequestContext {
  requestId?: string;
  conversationId?: string;
  userId?: string;
  tenantId?: string;
  graphRunId?: string;
  nodeName?: string;
  toolName?: string;
}

const transport = config.NODE_ENV === 'development'
  ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    }
  : undefined;

export const baseLogger = pino({
  level: config.NODE_ENV === 'test' ? 'silent' : 'info',
  transport,
});

export class ScopedLogger {
  constructor(private context: RequestContext = {}) {}

  withContext(extra: RequestContext): ScopedLogger {
    return new ScopedLogger({ ...this.context, ...extra });
  }

  info(msg: string, data?: Record<string, unknown>): void {
    baseLogger.info({ ...this.context, ...data }, msg);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    baseLogger.warn({ ...this.context, ...data }, msg);
  }

  error(msg: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    baseLogger.error(
      {
        ...this.context,
        err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        ...data,
      },
      msg
    );
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    baseLogger.debug({ ...this.context, ...data }, msg);
  }
}

export const logger = new ScopedLogger();
