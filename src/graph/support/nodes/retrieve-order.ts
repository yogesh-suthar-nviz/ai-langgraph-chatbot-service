import { ChatState } from '../../core/types.js';
import { toolRegistry } from '../../../tools/registry.js';
import { logger } from '../../../observability/logger.js';

export async function retrieveOrderNode(state: ChatState): Promise<Partial<ChatState>> {
  if (state.error) return {};

  const orderId = (state.metadata.extractedOrderId as string) || state.query || 'ORD-1001';
  logger.info('Executing Support Node: retrieve_order', { orderId, userId: state.user.id });

  const result = await toolRegistry.executeTool(
    'getOrder',
    { orderId },
    { user: state.user, conversationId: state.conversationId }
  );

  if (!result.success || !result.data) {
    return {
      currentOrder: null,
      response: `⚠️ ${result.error || `Unable to locate order "${orderId}". Please verify your order ID.`}`,
      error: 'ORDER_NOT_FOUND',
    };
  }

  return {
    currentOrder: result.data as any,
  };
}
