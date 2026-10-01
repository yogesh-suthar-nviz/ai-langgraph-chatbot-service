import pg from 'pg';
import { config } from '../config/env.js';
import { logger } from '../observability/logger.js';

const { Pool } = pg;

export class DatabaseService {
  private pool: pg.Pool | null = null;
  private isConnected = false;

  constructor() {
    if (config.DATABASE_URL) {
      try {
        this.pool = new Pool({
          connectionString: config.DATABASE_URL,
          connectionTimeoutMillis: 3000,
        });

        // Test connection asynchronously
        this.pool.connect((err, client, release) => {
          if (err) {
            logger.warn('PostgreSQL database not available locally. Using in-memory repository fallback.', {
              error: err.message,
            });
            this.isConnected = false;
          } else {
            logger.info('Connected to PostgreSQL successfully');
            this.isConnected = true;
            release();
          }
        });
      } catch (e: any) {
        logger.warn('Failed to initialize PostgreSQL pool, falling back to memory store', { error: e.message });
      }
    }
  }

  getPool(): pg.Pool | null {
    return this.isConnected ? this.pool : null;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const dbService = new DatabaseService();
