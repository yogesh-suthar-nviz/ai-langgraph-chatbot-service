import { FastifyInstance } from 'fastify';
import { handleChatRequest } from '../controllers/chat.controller.js';
import {
  listConversationsHandler,
  createConversationHandler,
  getConversationHandler,
  deleteConversationHandler,
  feedbackHandler,
} from '../controllers/conversations.controller.js';
import { authService } from '../../auth/authentication/authenticator.js';
import { dbService } from '../../database/client.js';
import { redisService } from '../../redis/client.js';

export async function registerV1Routes(app: FastifyInstance) {
  // Chat endpoint
  app.post('/chat', {
    schema: {
      description: 'Stream or generate AI assistant chat responses via LangGraph',
      tags: ['chat'],
      body: {
        type: 'object',
        required: ['message'],
        properties: {
          conversationId: { type: 'string' },
          message: { type: 'string' },
          stream: { type: 'boolean', default: true },
          guestSessionId: { type: 'string' },
          action: { type: 'string', enum: ['message', 'approve_refund', 'reject_refund'] },
        },
      },
    },
  }, handleChatRequest);

  // Conversations CRUD
  app.get('/conversations', {
    schema: {
      description: 'List all conversations for authenticated user',
      tags: ['conversations'],
    },
  }, listConversationsHandler);

  app.post('/conversations', {
    schema: {
      description: 'Create a new conversation thread',
      tags: ['conversations'],
    },
  }, createConversationHandler);

  app.get('/conversations/:id', {
    schema: {
      description: 'Retrieve conversation details and message history',
      tags: ['conversations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, getConversationHandler);

  app.delete('/conversations/:id', {
    schema: {
      description: 'Delete a conversation',
      tags: ['conversations'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, deleteConversationHandler);

  // User identity / profile check
  app.get('/me', {
    schema: {
      description: 'Resolve current caller identity, roles, and effective permissions',
      tags: ['identity'],
    },
  }, async (req, reply) => {
    const user = await authService.resolveIdentity(req.headers.authorization);
    reply.send({ user });
  });

  // User Feedback
  app.post('/feedback', {
    schema: {
      description: 'Submit structured satisfaction feedback for a conversation or a specific response',
      tags: ['feedback'],
      body: {
        type: 'object',
        required: ['conversationId', 'rating', 'csat'],
        properties: {
          conversationId: { type: 'string' },
          messageId: { type: 'string' },
          rating: { type: 'string', enum: ['thumbs_up', 'thumbs_down'] },
          csat: { type: 'integer', minimum: 1, maximum: 5 },
          topic: { type: 'string' },
          reasons: { type: 'array', items: { type: 'string' } },
          comment: { type: 'string' },
          allowContact: { type: 'boolean' },
          contactEmail: { type: 'string' },
        },
      },
    },
  }, feedbackHandler);

  // Health and Readiness
  app.get('/health', {
    schema: {
      description: 'Liveness health check',
      tags: ['system'],
    },
  }, async (_req, reply) => {
    reply.send({
      status: 'ok',
      service: 'ai-service',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', {
    schema: {
      description: 'Readiness probe inspecting database and redis status',
      tags: ['system'],
    },
  }, async (_req, reply) => {
    const dbReady = dbService.isReady();
    const redisReady = redisService.isReady();

    reply.send({
      status: 'ready',
      database: dbReady ? 'connected' : 'memory-fallback',
      redis: redisReady ? 'connected' : 'memory-fallback',
      timestamp: new Date().toISOString(),
    });
  });
}
