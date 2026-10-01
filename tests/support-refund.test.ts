import { describe, it, expect } from 'vitest';
import {
  executeSupportActionNode,
  generateSupportResponseNode,
} from '../src/graph/support/nodes/execute-action.js';
import { MockIdentityProvider } from '../src/auth/providers/mock-identity-provider.js';
import { orderService } from '../src/integrations/orders/mock.js';
import { ChatState } from '../src/graph/core/types.js';

/**
 * Regression cover for a refund that bypasses human approval (amount under the
 * threshold). The refund tool still enforces `order.refund` server-side, and a
 * denial must never be reported to the user as a completed transaction.
 */
async function runRefund(token: string): Promise<{ response?: string; refundProcessed: unknown }> {
  const provider = new MockIdentityProvider();
  const user = await provider.validateToken(token);
  const order = await orderService.getOrder('ORD-1001');

  const state: ChatState = {
    conversationId: 'refund-regression',
    user,
    messages: [{ role: 'user', content: 'Refund order ORD-1001' }],
    intent: 'refund_request',
    currentOrder: order as any,
    searchAttempts: 0,
    requiresHumanApproval: false,
    humanApprovalDetails: {
      approvalType: 'refund',
      entityId: 'ORD-1001',
      status: 'approved',
    },
    metadata: {},
  };

  const exec = await executeSupportActionNode(state);
  const merged = {
    ...state,
    ...exec,
    metadata: { ...state.metadata, ...(exec.metadata || {}) },
  } as ChatState;

  const out = await generateSupportResponseNode(merged);

  return {
    response: merged.response || out.response,
    refundProcessed: merged.metadata?.refundProcessed,
  };
}

describe('Support refund execution reporting', () => {
  it('does not report success when the refund tool denies authorization', async () => {
    const before = await orderService.getOrder('ORD-1001');
    expect(before?.status).toBe('DELIVERED');

    const { response, refundProcessed } = await runRefund('external:cust_ext_1001');

    expect(refundProcessed).toBe(false);
    expect(response).toBeDefined();
    expect(response).not.toContain('Refund Successful');
    expect(response).toContain('Refund Not Processed');
    expect(response).toContain('No funds have been moved');

    // The order must be untouched by a denied refund.
    const after = await orderService.getOrder('ORD-1001');
    expect(after?.status).toBe('DELIVERED');
  });

  it('reports success only once the refund tool has actually completed', async () => {
    const { response, refundProcessed } = await runRefund('internal:emp_internal_99');

    expect(refundProcessed).toBe(true);
    expect(response).toContain('Refund Successful');

    const after = await orderService.getOrder('ORD-1001');
    expect(after?.status).toBe('REFUNDED');
  });
});
