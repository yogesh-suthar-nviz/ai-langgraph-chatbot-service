import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../src/tools/registry.js';
import { MockIdentityProvider } from '../src/auth/providers/mock-identity-provider.js';

describe('Tool Registry & Permission Enforcement', () => {
  const provider = new MockIdentityProvider();

  it('allows guest to search products', async () => {
    const guest = await provider.validateToken('guest:session_abc');
    const result = await toolRegistry.executeTool(
      'searchProducts',
      { query: 'laminate', color: 'white', maxPrice: 5000 },
      { user: guest, conversationId: 'conv-1' }
    );

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect((result.data as any[]).length).toBeGreaterThan(0);
  });

  it('rejects guest from running refundOrder tool server-side', async () => {
    const guest = await provider.validateToken('guest:session_abc');
    const result = await toolRegistry.executeTool(
      'refundOrder',
      { orderId: 'ORD-1001', amount: 500, reason: 'test' },
      { user: guest, conversationId: 'conv-1' }
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });

  it('allows internal employee to execute refundOrder tool', async () => {
    const internal = await provider.validateToken('internal:emp_1');
    const result = await toolRegistry.executeTool(
      'refundOrder',
      { orderId: 'ORD-1001', amount: 6299, reason: 'Supervisor approved' },
      { user: internal, conversationId: 'conv-1' }
    );

    expect(result.success).toBe(true);
    expect((result.data as any).transactionId).toBeDefined();
  });
});
