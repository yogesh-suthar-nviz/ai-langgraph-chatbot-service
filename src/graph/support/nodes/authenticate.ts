import { ChatState } from '../../core/types.js';
import { can } from '../../../auth/authorization/authorizer.js';
import { PERMISSIONS } from '../../../auth/authorization/permissions.js';
import { logger } from '../../../observability/logger.js';

export async function authenticateSupportNode(state: ChatState): Promise<Partial<ChatState>> {
  logger.info('Executing Support Node: authenticate', {
    userId: state.user.id,
    userType: state.user.type,
  });

  if (state.user.type === 'guest') {
    return {
      error: 'AUTHENTICATION_REQUIRED',
      response: '🔒 **Sign-in Required**: To protect your privacy and view confidential order or refund information, please sign in with your customer account or enterprise SSO using the identity selector.',
    };
  }

  return {};
}

export async function authorizeSupportNode(state: ChatState): Promise<Partial<ChatState>> {
  // If already flagged with authentication error, skip
  if (state.error) return {};

  logger.info('Executing Support Node: authorize', {
    userId: state.user.id,
    intent: state.intent,
  });

  const requiredPerm = state.intent === 'refund_request' ? PERMISSIONS.ORDER_REFUND : PERMISSIONS.ORDER_READ;

  // External customers can read orders, but direct refunds require internal staff permission
  if (state.intent === 'refund_request' && state.user.type === 'external') {
    // External customers can submit refund requests, which will trigger Human Approval review if eligible
    return {};
  }

  if (!can(state.user, requiredPerm)) {
    return {
      error: 'AUTHORIZATION_DENIED',
      response: `⛔ **Access Denied**: You do not have the required permissions (${requiredPerm}) to perform this action.`,
    };
  }

  return {};
}
