import Redis from 'ioredis';
import { config } from '../config/env.js';
import { logger } from '../observability/logger.js';

export class RedisService {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    if (config.REDIS_URL) {
      try {
        this.client = new Redis(config.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          connectTimeout: 2000,
        });

        this.client.connect()
          .then(() => {
            logger.info('Connected to Redis successfully');
            this.isConnected = true;
          })
          .catch((err) => {
            logger.warn('Redis not available locally. Using in-memory fallback for rate limiting & cache.', {
              error: err.message,
            });
            this.isConnected = false;
          });
      } catch (err: any) {
        logger.warn('Failed to initialize Redis client', { error: err.message });
      }
    }
  }

  getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
    }
  }
}

export const redisService = new RedisService();
