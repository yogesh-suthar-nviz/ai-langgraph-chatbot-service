import { UserIdentity } from '../identity/identity.types.js';
import { Permission, PERMISSIONS } from './permissions.js';

export class AuthorizationError extends Error {
  constructor(
    public readonly requiredPermission: string,
    public readonly userId: string,
    message?: string
  ) {
    super(message || `Access denied: User '${userId}' lacks required permission '${requiredPermission}'`);
    this.name = 'AuthorizationError';
  }
}

/**
 * Deterministically checks if a user has a specific permission.
 * Never allows the LLM to decide or override permissions.
 */
export function can(user: UserIdentity, permission: Permission | string): boolean {
  if (!user) return false;

  // Admin users possess all permissions
  if (user.roles.includes('admin') || user.permissions.includes(PERMISSIONS.ADMIN_ACCESS)) {
    return true;
  }

  return user.permissions.includes(permission as Permission);
}

/**
 * Asserts that the user possesses the required permission or throws an AuthorizationError.
 */
export function authorize(user: UserIdentity, permission: Permission | string): void {
  if (!can(user, permission)) {
    throw new AuthorizationError(permission, user.id);
  }
}
