import { redisService } from './client.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export class RateLimiter {
  private memStore: Map<string, { count: number; expiresAt: number }> = new Map();

  async checkLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const redis = redisService.getClient();

    if (redis) {
      try {
        const fullKey = `ratelimit:${key}`;
        const current = await redis.incr(fullKey);
        if (current === 1) {
          await redis.expire(fullKey, windowSeconds);
        }
        const ttl = await redis.ttl(fullKey);

        return {
          allowed: current <= limit,
          remaining: Math.max(0, limit - current),
          resetSeconds: ttl > 0 ? ttl : windowSeconds,
        };
      } catch {
        // Fall back to memory
      }
    }

    // In-memory sliding window fallback
    const now = Date.now();
    const entry = this.memStore.get(key);

    if (!entry || entry.expiresAt <= now) {
      this.memStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return {
        allowed: true,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    const resetSeconds = Math.ceil((entry.expiresAt - now) / 1000);

    return {
      allowed: entry.count <= limit,
      remaining,
      resetSeconds,
    };
  }
}

export const rateLimiter = new RateLimiter();
