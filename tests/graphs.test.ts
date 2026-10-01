import { describe, it, expect } from 'vitest';
import { mainGraph } from '../src/graph/main/graph.js';
import { MockIdentityProvider } from '../src/auth/providers/mock-identity-provider.js';
import { ChatState } from '../src/graph/core/types.js';

describe('LangGraph End-to-End Orchestration', () => {
  const provider = new MockIdentityProvider();

  it('orchestrates Commerce Graph for product search', async () => {
    const guest = await provider.validateToken('guest:session_1');
    const state: ChatState = {
      conversationId: 'test-conv-1',
      user: guest,
      messages: [{ role: 'user', content: 'Show me black running shoes under ₹10,000' }],
      query: 'Show me black running shoes under ₹10,000',
      searchAttempts: 0,
      requiresHumanApproval: false,
      metadata: {},
    };

    const result = await mainGraph.invoke(state, {
      configurable: { thread_id: 'test-conv-1' },
    });

    expect(result.intent).toBe('product_search');
    expect(result.route).toBe('commerce');
    expect(result.matchedProducts).toBeDefined();
    expect(result.matchedProducts.length).toBeGreaterThan(0);
    expect(result.response).toContain('option');
  });

  it('rejects guest attempting to inspect private order status', async () => {
    const guest = await provider.validateToken('guest:session_2');
    const state: ChatState = {
      conversationId: 'test-conv-2',
      user: guest,
      messages: [{ role: 'user', content: 'What is the status of order ORD-1001?' }],
      query: 'What is the status of order ORD-1001?',
      searchAttempts: 0,
      requiresHumanApproval: false,
      metadata: {},
    };

    const result = await mainGraph.invoke(state, {
      configurable: { thread_id: 'test-conv-2' },
    });

    expect(result.route).toBe('support');
    expect(result.error).toBe('AUTHENTICATION_REQUIRED');
    expect(result.response).toContain('Sign-in Required');
  });

  it('allows authenticated external customer to view order ORD-1001 status', async () => {
    const customer = await provider.validateToken('external:cust_ext_1001');
    const state: ChatState = {
      conversationId: 'test-conv-3',
      user: customer,
      messages: [{ role: 'user', content: 'What is the status of order ORD-1001?' }],
      query: 'What is the status of order ORD-1001?',
      searchAttempts: 0,
      requiresHumanApproval: false,
      metadata: {},
    };

    const result = await mainGraph.invoke(state, {
      configurable: { thread_id: 'test-conv-3' },
    });

    expect(result.route).toBe('support');
    expect(result.currentOrder).toBeDefined();
    expect(result.currentOrder.id).toBe('ORD-1001');
    expect(result.response).toContain('BLUEDART-8829104');
  });

  it('triggers Human-In-The-Loop approval when refund exceeds ₹5,000 threshold', async () => {
    const customer = await provider.validateToken('external:cust_ext_1001');
    const state: ChatState = {
      conversationId: 'test-conv-4',
      user: customer,
      messages: [{ role: 'user', content: 'I want a refund for order ORD-1001' }],
      query: 'I want a refund for order ORD-1001',
      searchAttempts: 0,
      requiresHumanApproval: false,
      metadata: {},
    };

    const result = await mainGraph.invoke(state, {
      configurable: { thread_id: 'test-conv-4' },
    });

    expect(result.route).toBe('support');
    expect(result.requiresHumanApproval).toBe(true);
    expect(result.humanApprovalDetails?.status).toBe('pending');
    expect(result.humanApprovalDetails?.amount).toBe(6299);
    expect(result.response).toContain('Supervisor Approval Required');
  });
});
