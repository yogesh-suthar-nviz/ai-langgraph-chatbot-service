import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { ChatStateAnnotation, ChatState } from '../core/types.js';
import { classifyIntentNode } from './router.js';
import { subgraphRegistry } from '../core/graph-factory.js';
import { userMemoryService } from '../../memory/user-memory.js';
import { logger } from '../../observability/logger.js';

/**
 * Clears turn-scoped state before anything else runs.
 *
 * The checkpointer retains this thread's state between turns, and most channels use a
 * last-write-wins reducer. Without this reset, a node that returns `{}` leaves the PREVIOUS
 * turn's value in place. Two user-visible failures came from that:
 *
 *  1. Thread poisoning. One `error` (e.g. a guest hitting a support route) persisted, so
 *     `route_dispatch` short-circuited on every later turn and replayed the stale `response`
 *     forever - product searches and FAQ answers all came back as "Sign-in Required".
 *  2. Stale generative UI. `metadata.products` from a product search survived into a later
 *     knowledge answer, rendering product cards under an unrelated citation response.
 *
 * Thread-scoped values (messages, user, conversationId) and controller-seeded approval
 * fields are deliberately NOT cleared here.
 */
export async function resetTurnNode(_state: ChatState): Promise<Partial<ChatState>> {
  return {
    // Turn outputs
    error: undefined,
    response: undefined,
    intent: undefined,
    route: undefined,
    // Turn working set
    extractedFilters: undefined,
    searchAttempts: 0,
    matchedProducts: undefined,
    currentOrder: undefined,
    retrievedDocuments: undefined,
    // Turn-scoped generative-UI payload (metadata uses a shallow-merge reducer)
    metadata: {
      component: undefined,
      products: undefined,
      order: undefined,
      citations: undefined,
      approvalRequired: undefined,
      approvalDetails: undefined,
      refundProcessed: undefined,
      refundError: undefined,
      transaction: undefined,
      extractedOrderId: undefined,
      supportReason: undefined,
    },
  };
}

export async function loadContextNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Main Node: load_context', {
    userId: state.user?.id,
    conversationId: state.conversationId,
  });

  const preferences = await userMemoryService.getPreferences(state.user.id);
  return {
    metadata: {
      userPreferences: preferences,
      loadedAt: new Date().toISOString(),
    },
  };
}

export async function validateRequestNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Main Node: validate_request');
  const userMsg = [...state.messages].reverse().find((m) => m.role === 'user')?.content;

  if (!userMsg || userMsg.trim().length === 0) {
    return {
      error: 'EMPTY_INPUT',
      response: 'It looks like your message was empty. How can I help you today?',
    };
  }

  // Security guardrails against basic injection attempts
  if (userMsg.length > 4000) {
    return {
      error: 'INPUT_TOO_LONG',
      response: 'Your message exceeds the maximum allowed length (4,000 characters). Please provide a more concise inquiry.',
    };
  }

  return {};
}

export async function routeDispatchNode(state: ChatState): Promise<Partial<ChatState>> {
  if (state.error) return {};

  const route = state.route || 'clarification';
  logger.info('Executing Main Node: route_dispatch', { route });

  const runner = subgraphRegistry.getRunner(route);
  const result = await runner(state);

  return result;
}

export async function outputValidationNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Main Node: output_validation', {
    hasResponse: !!state.response,
    component: state.metadata?.component,
  });

  if (!state.response) {
    return {
      response: 'I have processed your request, but no response was generated. Please try again.',
    };
  }

  return {};
}

export function createMainGraph(checkpointer?: MemorySaver) {
  const workflow = new StateGraph(ChatStateAnnotation)
    .addNode('reset_turn', resetTurnNode)
    .addNode('load_context', loadContextNode)
    .addNode('validate_request', validateRequestNode)
    .addNode('understand_intent', classifyIntentNode)
    .addNode('route_dispatch', routeDispatchNode)
    .addNode('output_validation', outputValidationNode)
    .addEdge(START, 'reset_turn')
    .addEdge('reset_turn', 'load_context')
    .addEdge('load_context', 'validate_request')
    .addEdge('validate_request', 'understand_intent')
    .addEdge('understand_intent', 'route_dispatch')
    .addEdge('route_dispatch', 'output_validation')
    .addEdge('output_validation', END);

  return workflow.compile({
    checkpointer: checkpointer || new MemorySaver(),
  });
}

// Global default main graph instance with in-memory checkpointer
export const mainGraph = createMainGraph();
