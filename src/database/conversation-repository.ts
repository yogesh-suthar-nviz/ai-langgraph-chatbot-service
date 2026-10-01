import { v4 as uuidv4 } from 'uuid';
import { dbService } from './client.js';

export interface DBConversation {
  id: string;
  userId: string;
  tenantId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface DBFeedback {
  id: string;
  conversationId: string;
  messageId?: string;
  userId: string;
  userType?: string;
  rating: string;
  comment?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export class ConversationRepository {
  // In-memory fallback stores
  private memConversations: Map<string, DBConversation> = new Map();
  private memMessages: Map<string, DBMessage[]> = new Map();
  private memFeedback: Map<string, DBFeedback[]> = new Map();

  async createConversation(userId: string, tenantId?: string, title = 'New Conversation'): Promise<DBConversation> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const conv: DBConversation = {
      id,
      userId,
      tenantId,
      title,
      createdAt: now,
      updatedAt: now,
    };

    const pool = dbService.getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO conversations (id, user_id, tenant_id, title, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, userId, tenantId, title, now, now]
        );
      } catch {
        // Fall back to memory
      }
    }

    this.memConversations.set(id, conv);
    this.memMessages.set(id, []);
    return conv;
  }

  async getConversation(id: string, userId: string): Promise<DBConversation | null> {
    const pool = dbService.getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, user_id as "userId", tenant_id as "tenantId", title, created_at as "createdAt", updated_at as "updatedAt"
           FROM conversations WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );
        if (res.rows.length > 0) return res.rows[0];
      } catch {
        // Fall back to memory
      }
    }

    const conv = this.memConversations.get(id);
    if (!conv) return null;
    if (conv.userId !== userId) return null; // Server-side ownership verification
    return conv;
  }

  async listConversations(userId: string): Promise<DBConversation[]> {
    const pool = dbService.getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, user_id as "userId", tenant_id as "tenantId", title, created_at as "createdAt", updated_at as "updatedAt"
           FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`,
          [userId]
        );
        if (res.rows.length > 0) return res.rows;
      } catch {
        // Fall back to memory
      }
    }

    return Array.from(this.memConversations.values())
      .filter((c) => c.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    const pool = dbService.getPool();
    if (pool) {
      try {
        const res = await pool.query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
        if ((res.rowCount ?? 0) > 0) return true;
      } catch {
        // Fall back
      }
    }

    const conv = this.memConversations.get(id);
    if (!conv || conv.userId !== userId) return false;
    this.memConversations.delete(id);
    this.memMessages.delete(id);
    return true;
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<DBMessage> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const msg: DBMessage = {
      id,
      conversationId,
      role,
      content,
      metadata,
      createdAt: now,
    };

    const pool = dbService.getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO messages (id, conversation_id, role, content, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, conversationId, role, content, JSON.stringify(metadata || {}), now]
        );
        await pool.query('UPDATE conversations SET updated_at = $1 WHERE id = $2', [now, conversationId]);
      } catch {
        // Fall back
      }
    }

    const list = this.memMessages.get(conversationId) || [];
    list.push(msg);
    this.memMessages.set(conversationId, list);

    const conv = this.memConversations.get(conversationId);
    if (conv) {
      conv.updatedAt = now;
      if (role === 'user' && conv.title === 'New Conversation') {
        conv.title = content.substring(0, 32).trim() + (content.length > 32 ? '...' : '');
      }
    }

    return msg;
  }

  async getMessages(conversationId: string): Promise<DBMessage[]> {
    const pool = dbService.getPool();
    if (pool) {
      try {
        const res = await pool.query(
          `SELECT id, conversation_id as "conversationId", role, content, metadata, created_at as "createdAt"
           FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
          [conversationId]
        );
        if (res.rows.length > 0) return res.rows;
      } catch {
        // Fall back
      }
    }

    return this.memMessages.get(conversationId) || [];
  }

  async recordFeedback(
    conversationId: string,
    userId: string,
    rating: string,
    messageId?: string,
    comment?: string,
    userType?: string,
    details?: Record<string, unknown>
  ): Promise<DBFeedback> {
    const id = uuidv4();
    const fb: DBFeedback = {
      id,
      conversationId,
      messageId,
      userId,
      userType,
      rating,
      comment,
      details,
      createdAt: new Date().toISOString(),
    };

    const list = this.memFeedback.get(conversationId) || [];
    list.push(fb);
    this.memFeedback.set(conversationId, list);
    return fb;
  }
}

export const conversationRepo = new ConversationRepository();
