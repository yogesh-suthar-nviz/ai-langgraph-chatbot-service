import { ChatState } from '../../core/types.js';
import { GRAPH_CONSTANTS } from '../../core/constants.js';
import { logger } from '../../../observability/logger.js';

export async function checkBusinessRulesNode(state: ChatState): Promise<Partial<ChatState>> {
  if (state.error || !state.currentOrder) return {};

  const order = state.currentOrder;
  logger.info('Executing Support Node: check_rules', { orderId: order.id, intent: state.intent });

  // If simple order status inquiry, pass through
  if (state.intent === 'order_status') {
    return {};
  }

  // Handle Return or Refund request
  if (state.intent === 'refund_request' || state.intent === 'return_request') {
    if (!order.isEligibleForRefund) {
      return {
        error: 'INELIGIBLE_FOR_REFUND',
        response: `❌ **Refund Ineligible**: Order **${order.id}** is currently not eligible for a refund. Orders must be in **DELIVERED** status and within the 30-day return window. (Current status: ${order.status}).`,
      };
    }

    const amount = order.totalAmount;
    const requiresApproval = amount >= GRAPH_CONSTANTS.REFUND_APPROVAL_THRESHOLD_INR;

    return {
      requiresHumanApproval: requiresApproval,
      humanApprovalDetails: {
        approvalType: 'refund',
        entityId: order.id,
        amount,
        reason: (state.metadata.supportReason as string) || 'Customer requested refund via AI assistant',
        status: requiresApproval ? 'pending' : 'approved',
      },
    };
  }

  return {};
}
