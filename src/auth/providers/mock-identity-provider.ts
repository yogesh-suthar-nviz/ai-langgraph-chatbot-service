import { IdentityProvider } from './identity-provider.interface.js';
import { UserIdentity } from '../identity/identity.types.js';
import { DEFAULT_ROLE_PERMISSIONS } from '../authorization/permissions.js';

export class MockIdentityProvider implements IdentityProvider {
  async validateToken(token: string): Promise<UserIdentity> {
    const trimmed = (token || '').trim();

    // Check for internal user simulation
    if (trimmed.startsWith('internal:') || trimmed === 'mock-internal-token') {
      const subject = trimmed.replace('internal:', '') || 'emp_internal_99';
      return {
        id: `user_internal_${subject}`,
        type: 'internal',
        provider: 'mock-entra-id',
        subject,
        email: `${subject}@enterprise.internal`,
        name: 'Sarah Connor (Staff Specialist)',
        roles: ['internal_employee', 'support_agent'],
        permissions: [...DEFAULT_ROLE_PERMISSIONS.internal_employee],
        tenantId: 'tenant-enterprise-hq',
      };
    }

    // Check for external authenticated user simulation
    if (trimmed.startsWith('external:') || trimmed === 'mock-external-token') {
      const subject = trimmed.replace('external:', '') || 'cust_ext_1001';
      return {
        id: `user_external_${subject}`,
        type: 'external',
        provider: 'mock-auth0',
        subject,
        email: 'alex.shopper@gmail.com',
        name: 'Alex Johnson',
        roles: ['external_customer'],
        permissions: [...DEFAULT_ROLE_PERMISSIONS.external_customer],
        tenantId: 'tenant-ecommerce-store',
      };
    }

    // Default to Guest identity
    const sessionId = trimmed.startsWith('guest:') ? trimmed.replace('guest:', '') : (trimmed || 'anon_guest_session');
    return {
      id: `guest_${sessionId}`,
      type: 'guest',
      provider: 'local-session',
      subject: sessionId,
      name: 'Guest Visitor',
      roles: ['guest'],
      permissions: [...DEFAULT_ROLE_PERMISSIONS.guest],
      tenantId: 'public-guest',
    };
  }
}
