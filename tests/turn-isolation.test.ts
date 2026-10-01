import { describe, it, expect } from 'vitest';
import { mainGraph } from '../src/graph/main/graph.js';
import { MockIdentityProvider } from '../src/auth/providers/mock-identity-provider.js';
import { ChatState } from '../src/graph/core/types.js';

/**
 * The checkpointer retains thread state between turns and most channels are
 * last-write-wins, so turn-scoped values must be cleared by `reset_turn`.
 * These are multi-turn by necessity: a single-turn test cannot catch either failure.
 */
function turn(threadId: string, user: any, message: string): ChatState {
  return {
    conversationId: threadId,
    user,
    messages: [{ role: 'user', content: message }],
    query: message,
    searchAttempts: 0,
    requiresHumanApproval: false,
    metadata: {},
  };
}

describe('Turn isolation across a checkpointed thread', () => {
  it('does not let one auth error poison the rest of the conversation', async () => {
    const guest = await new MockIdentityProvider().validateToken('guest:isolation_1');
    const threadId = 'turn-isolation-error';
    const cfg = { configurable: { thread_id: threadId } };

    // Turn 1: a guest hitting a support route legitimately fails.
    const t1 = await mainGraph.invoke(turn(threadId, guest, 'What is the status of my order?'), cfg);
    expect(t1.error).toBe('AUTHENTICATION_REQUIRED');
    expect(t1.response).toContain('Sign-in Required');

    // Turn 2: an unrelated knowledge question must be answered, not blocked.
    const t2 = await mainGraph.invoke(turn(threadId, guest, 'How can I contact customer support?'), cfg);
    expect(t2.route).toBe('knowledge');
    expect(t2.error).toBeUndefined();
    expect(t2.response).not.toContain('Sign-in Required');

    // Turn 3: a product search is public and must return catalog results.
    const t3 = await mainGraph.invoke(turn(threadId, guest, 'Show me black laminate under 4000'), cfg);
    expect(t3.route).toBe('commerce');
    expect(t3.error).toBeUndefined();
    expect(t3.matchedProducts?.length).toBeGreaterThan(0);
    expect(t3.response).not.toContain('Sign-in Required');
  });

  it('does not leak a previous turn generative-UI payload into the next answer', async () => {
    const guest = await new MockIdentityProvider().validateToken('guest:isolation_2');
    const threadId = 'turn-isolation-payload';
    const cfg = { configurable: { thread_id: threadId } };

    const t1 = await mainGraph.invoke(turn(threadId, guest, 'Show me black laminate'), cfg);
    expect((t1.metadata as any).component).toBe('product_carousel');
    expect((t1.metadata as any).products?.length).toBeGreaterThan(0);

    // A knowledge answer must not carry the product carousel forward.
    const t2 = await mainGraph.invoke(turn(threadId, guest, 'What is your shipping policy?'), cfg);
    expect((t2.metadata as any).component).toBe('citation_list');
    expect((t2.metadata as any).products).toBeUndefined();
    expect(t2.matchedProducts).toBeUndefined();
    expect((t2.metadata as any).citations?.length).toBeGreaterThan(0);
  });
});
