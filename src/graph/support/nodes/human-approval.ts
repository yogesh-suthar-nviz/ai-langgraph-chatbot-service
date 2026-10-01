import { ChatState } from '../../core/types.js';
import { logger } from '../../../observability/logger.js';

export async function humanApprovalNode(state: ChatState): Promise<Partial<ChatState>> {
  if (state.error || !state.requiresHumanApproval) return {};

  const details = state.humanApprovalDetails;
  logger.info('Executing Support Node: human_approval check', { details });

  if (details && details.status === 'pending') {
    // Interruption notice for Human In The Loop approval
    return {
      response: `⏸️ **Supervisor Approval Required**: A refund request for **₹${details.amount?.toLocaleString('en-IN')}** on Order **${details.entityId}** exceeds the automated threshold (₹5,000). A supervisor must review and approve this transaction.\n\nYou can click the approval button below or have an internal specialist approve it.`,
      metadata: {
        approvalRequired: true,
        approvalDetails: details,
        component: 'approval_card',
      },
    };
  }

  return {};
}
