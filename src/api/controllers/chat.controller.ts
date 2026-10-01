import { FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { ChatRequest } from '../schemas/chat.schema.js';
import { authService } from '../../auth/authentication/authenticator.js';
import { conversationRepo } from '../../database/conversation-repository.js';
import { rateLimiter } from '../../redis/rate-limiter.js';
import { mainGraph } from '../../graph/main/graph.js';
import { ChatState } from '../../graph/core/types.js';
import { MetricsCollector } from '../../observability/metrics.js';
import { logger } from '../../observability/logger.js';
import { formatDataStreamPart } from 'ai';

/**
 * Maps a completed main-graph node into a user-meaningful progress payload,
 * emitted on the Vercel AI SDK data channel (2:) while the graph is still running.
 * Nodes with no user-facing meaning return null and emit nothing.
 */
function progressForNode(node: string, update: Partial<ChatState>): Record<string, unknown> | null {
  switch (node) {
    case 'load_context':
      return { type: 'progress', node, label: 'Loading your context...' };

    case 'understand_intent': {
      const route = update.route;
      const label =
        route === 'commerce'
          ? 'Searching the product catalog...'
          : route === 'support'
            ? 'Looking up your order...'
            : route === 'knowledge'
              ? 'Searching policies and documentation...'
              : 'Preparing a response...';
      return { type: 'progress', node, label, intent: update.intent, route };
    }

    case 'route_dispatch': {
      const payload: Record<string, unknown> = { type: 'progress', node, label: 'Formatting results...' };
      if (update.matchedProducts) payload.productCount = update.matchedProducts.length;
      if (update.currentOrder) payload.orderId = update.currentOrder.id;
      if (update.retrievedDocuments) payload.documentCount = update.retrievedDocuments.length;
      if (update.requiresHumanApproval) payload.approvalRequired = true;
      return payload;
    }

    default:
      // validate_request / output_validation are internal guards.
      return null;
  }
}

/** Splits a completed response into small chunks so the client renders progressively. */
function* responseChunks(text: string): Generator<string> {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? ' ' : '');
  }
}

export async function handleChatRequest(req: FastifyRequest<{ Body: ChatRequest }>, reply: FastifyReply) {
  const body = req.body;
  const authHeader = req.headers.authorization;
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();

  // 1. Resolve Identity (Guest, External, or Internal)
  let user;
  try {
    user = await authService.resolveIdentity(authHeader, body.guestSessionId);
  } catch (err: any) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: err.message || 'Could not resolve a valid identity for this request.',
    });
    return;
  }

  // 2. Check Rate Limits
  const rateLimitKey = `${user.type}:${user.id}`;
  const maxRequestsPerMinute = user.type === 'guest' ? 15 : 60;
  const rateLimit = await rateLimiter.checkLimit(rateLimitKey, maxRequestsPerMinute, 60);

  if (!rateLimit.allowed) {
    reply.status(429).send({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please wait ${rateLimit.resetSeconds} seconds before sending another message.`,
    });
    return;
  }

  // 3. Resolve or create conversation
  let conversationId = body.conversationId;
  let conversationCreated = false;
  if (!conversationId) {
    const conv = await conversationRepo.createConversation(user.id, user.tenantId, 'New Chat');
    conversationId = conv.id;
    conversationCreated = true;
  } else {
    // Verify ownership
    const existing = await conversationRepo.getConversation(conversationId, user.id);
    if (!existing) {
      reply.status(404).send({
        error: 'Conversation Not Found',
        message: 'The requested conversation does not exist or belongs to another user.',
      });
      return;
    }
  }

  // 4. Record User Message
  await conversationRepo.addMessage(conversationId, 'user', body.message);

  // 5. Retrieve recent conversation history
  const history = await conversationRepo.getMessages(conversationId);
  const formattedMessages = history.map((m) => ({
    role: m.role,
    content: m.content,
    metadata: m.metadata,
  }));

  // 6. Setup Graph State & Metrics
  const graphRunId = uuidv4();
  const metrics = new MetricsCollector(graphRunId, conversationId);

  // Handle human-in-the-loop resumption if action is specified
  const initialApprovalDetails = body.action === 'approve_refund'
    ? { approvalType: 'refund' as const, entityId: 'ORD-1001', status: 'approved' as const, approvedBy: user.id }
    : undefined;

  const initialState: ChatState = {
    conversationId,
    user,
    messages: formattedMessages,
    query: body.message,
    searchAttempts: 0,
    requiresHumanApproval: false,
    humanApprovalDetails: initialApprovalDetails,
    metadata: {
      requestId,
      graphRunId,
      action: body.action,
      // Per-turn counters. The checkpointer retains this thread's metadata and the
      // reducer merges into it, so these must be reset or they accumulate across turns.
      llmPromptTokens: 0,
      llmCompletionTokens: 0,
    },
  };

  const graphConfig = { configurable: { thread_id: conversationId } };

  // 7. Streaming vs Non-Streaming execution
  if (body.stream) {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    const writeData = (payload: Record<string, unknown>) => {
      reply.raw.write(formatDataStreamPart('data', [payload as any]));
    };

    try {
      // Tell the client which thread this turn belongs to, so a conversation
      // created server-side on the first message is not forked on the next one.
      writeData({
        type: 'conversation',
        conversationId,
        created: conversationCreated,
        graphRunId,
      });

      // Consume LangGraph's own stream: "updates" yields each node's partial
      // state as it completes, "values" the full state after each superstep.
      const stream = await mainGraph.stream(initialState, {
        ...graphConfig,
        streamMode: ['updates', 'values'],
      });

      let finalState: ChatState | undefined;
      let lastTick = Date.now();

      for await (const entry of stream as AsyncIterable<[string, unknown]>) {
        const [mode, chunk] = entry;

        if (mode === 'values') {
          finalState = chunk as ChatState;
          continue;
        }

        if (mode !== 'updates' || !chunk) continue;

        for (const [node, update] of Object.entries(chunk as Record<string, Partial<ChatState>>)) {
          const now = Date.now();
          metrics.recordNodeDuration(node, now - lastTick);
          lastTick = now;

          const progress = progressForNode(node, update || {});
          if (progress) writeData(progress);
        }
      }

      if (!finalState) {
        throw new Error('Graph execution produced no final state');
      }

      // Stream the assistant text as Vercel AI SDK text parts
      const fullResponse = finalState.response || '';
      for (const delta of responseChunks(fullResponse)) {
        reply.raw.write(formatDataStreamPart('text', delta));
      }

      // Persist the assistant turn
      await conversationRepo.addMessage(conversationId, 'assistant', fullResponse, finalState.metadata);

      metrics.recordTokens(
        Number(finalState.metadata?.llmPromptTokens || 0),
        Number(finalState.metadata?.llmCompletionTokens || 0)
      );
      const runMetrics = metrics.finish(finalState.requiresHumanApproval ? 'interrupted' : 'success');

      // Rich metadata for generative UI (products, orders, approvals, citations)
      // as Vercel AI SDK message annotations
      reply.raw.write(formatDataStreamPart('message_annotations', [{
        ...finalState.metadata,
        conversationId,
        intent: finalState.intent,
        route: finalState.route,
        metrics: runMetrics,
      }] as any));

      // Finish marker
      reply.raw.write(formatDataStreamPart('finish_message', {
        finishReason: 'stop',
        usage: {
          promptTokens: runMetrics.estimatedPromptTokens,
          completionTokens: runMetrics.estimatedCompletionTokens,
        },
      }));

      reply.raw.end();
    } catch (err: any) {
      logger.error('Error during streaming execution', err);
      metrics.finish('error');
      reply.raw.write(formatDataStreamPart('error', err.message || 'Internal graph execution error'));
      reply.raw.end();
    }
  } else {
    // Non-streaming response
    try {
      const finalState = await mainGraph.invoke(initialState, graphConfig);

      const fullResponse = finalState.response || '';
      await conversationRepo.addMessage(conversationId, 'assistant', fullResponse, finalState.metadata);

      metrics.recordTokens(
        Number(finalState.metadata?.llmPromptTokens || 0),
        Number(finalState.metadata?.llmCompletionTokens || 0)
      );
      const runMetrics = metrics.finish(finalState.requiresHumanApproval ? 'interrupted' : 'success');

      reply.send({
        conversationId,
        message: fullResponse,
        intent: finalState.intent,
        route: finalState.route,
        metadata: finalState.metadata,
        metrics: runMetrics,
      });
    } catch (err: any) {
      metrics.finish('error');
      reply.status(500).send({
        error: 'Execution Error',
        message: err.message,
      });
    }
  }
}
