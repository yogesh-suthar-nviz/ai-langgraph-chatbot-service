import { UserIdentity } from '../identity/identity.types.js';

export interface IdentityProvider {
  /**
   * Validates an incoming authorization token or session reference and resolves to a normalized UserIdentity.
   */
  validateToken(token: string): Promise<UserIdentity>;
}
