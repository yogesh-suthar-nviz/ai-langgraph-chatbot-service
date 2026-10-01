import { ChatState } from '../../core/types.js';
import { toolRegistry } from '../../../tools/registry.js';
import { logger } from '../../../observability/logger.js';

export async function executeSupportActionNode(state: ChatState): Promise<Partial<ChatState>> {
  if (state.error || !state.currentOrder) return {};

  const order = state.currentOrder;
  const details = state.humanApprovalDetails;

  // If waiting for supervisor approval, do not execute financial refund yet
  if (state.requiresHumanApproval && details?.status === 'pending') {
    return {};
  }

  // Execute refund if approved
  if (state.intent === 'refund_request' && (details?.status === 'approved' || !state.requiresHumanApproval)) {
    logger.info('Executing approved refund', { orderId: order.id, amount: order.totalAmount });
    const result = await toolRegistry.executeTool(
      'refundOrder',
      {
        orderId: order.id,
        amount: order.totalAmount,
        reason: details?.reason || 'Approved customer refund',
        approverId: details?.approvedBy || state.user.id,
      },
      { user: state.user, conversationId: state.conversationId }
    );

    if (result.success) {
      return {
        metadata: {
          refundProcessed: true,
          transaction: result.data,
        },
      };
    }

    // A failed refund must never fall through silently: the response node would
    // otherwise report success for a transaction that never moved any money.
    logger.warn('Refund execution was rejected or failed', {
      orderId: order.id,
      userId: state.user.id,
      error: result.error,
    });

    return {
      error: 'REFUND_EXECUTION_FAILED',
      response:
        `⚠️ **Refund Not Processed**: ${result.error || 'The refund could not be completed.'}\n\n` +
        `No funds have been moved on order **${order.id}**. Please escalate to a support specialist with refund authority.`,
      metadata: {
        refundProcessed: false,
        refundError: result.error,
      },
    };
  }

  return {};
}

export async function generateSupportResponseNode(state: ChatState): Promise<Partial<ChatState>> {
  // If response has already been set by an error or pending approval, preserve it
  if (state.response) return {};

  const order = state.currentOrder;
  if (!order) {
    return {
      response: 'I could not find the specified order. Please double-check your order number.',
    };
  }

  const orderSummary =
    `📦 **Order ${order.id}**:\n\n` +
    `• **Status**: ${order.status}\n` +
    `• **Tracking Number**: \`${order.trackingNumber || 'N/A'}\` (${order.carrier || 'Standard Courier'})\n` +
    `• **Order Total**: ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
    `• **Shipping Address**: ${order.shippingAddress}\n` +
    `• **Items**: ${order.items.map((i) => `${i.name} (Qty: ${i.quantity})`).join(', ')}`;

  let text = '';
  if (state.intent === 'order_status') {
    text = orderSummary;
  } else if (state.intent === 'refund_request') {
    // Only claim success when execute_action actually completed the transaction.
    if (state.metadata?.refundProcessed === true) {
      text = `✅ **Refund Successful**: Order **${order.id}** for **₹${order.totalAmount.toLocaleString('en-IN')}** has been processed successfully. Funds should reflect in your original payment method in 3–5 business days.`;
    } else {
      text = `⚠️ **Refund Not Completed**: I was unable to process a refund for order **${order.id}**. No funds have been moved. Please escalate to a support specialist with refund authority.`;
    }
  } else {
    // Any other support intent (e.g. return_request) reports verified order facts
    // rather than asserting an action that no node performed.
    text = orderSummary;
  }

  return {
    response: text,
    metadata: {
      order,
      component: 'order_card',
    },
  };
}
