import { UserIdentity } from '../identity/identity.types.js';
import { IdentityProvider } from '../providers/identity-provider.interface.js';
import { MockIdentityProvider } from '../providers/mock-identity-provider.js';
import { OIDCIdentityProvider } from '../providers/oidc-identity-provider.js';
import { config } from '../../config/env.js';
import { logger } from '../../observability/logger.js';

/** Raised when a request carries a token that cannot be accepted. Mapped to HTTP 401. */
export class AuthenticationError extends Error {
  readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/** Token prefixes understood by MockIdentityProvider. Honoured ONLY in mock auth mode. */
const MOCK_TOKEN_PREFIXES = ['mock-', 'internal:', 'external:', 'guest:'] as const;

export class AuthenticationService {
  private primaryProvider: IdentityProvider;
  private mockProvider: IdentityProvider;
  private readonly mockTokensEnabled: boolean;

  constructor() {
    this.mockProvider = new MockIdentityProvider();
    if (config.AUTH_MODE === 'oidc' && config.OIDC_ISSUER) {
      this.primaryProvider = new OIDCIdentityProvider({
        issuer: config.OIDC_ISSUER,
        clientId: config.OIDC_CLIENT_ID,
        audience: config.OIDC_AUDIENCE,
      });
    } else {
      this.primaryProvider = this.mockProvider;
    }

    // Simulated identities are a development affordance. They must never be
    // reachable when a real identity provider is configured, otherwise a caller
    // can mint a privileged identity simply by prefixing a token with "internal:".
    this.mockTokensEnabled = config.AUTH_MODE === 'mock';

    if (this.mockTokensEnabled && config.NODE_ENV === 'production') {
      logger.error(
        'SECURITY: AUTH_MODE=mock in a production build. Simulated identity tokens ' +
          '(internal:/external:/guest:/mock-) are accepted and grant their full permission set. ' +
          'Set AUTH_MODE=oidc with OIDC_ISSUER before serving real traffic.'
      );
    }
  }

  private isMockToken(token: string): boolean {
    return MOCK_TOKEN_PREFIXES.some((prefix) => token.startsWith(prefix));
  }

  /**
   * Resolves the request token or session reference into a normalized UserIdentity.
   * If no token is provided, returns an anonymous GuestIdentity with safe limits.
   */
  async resolveIdentity(authHeader?: string, guestSessionId?: string): Promise<UserIdentity> {
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      if (this.mockTokensEnabled) {
        return await this.mockProvider.validateToken(token);
      }

      if (this.isMockToken(token)) {
        logger.warn('Rejected simulated identity token outside mock auth mode', {
          authMode: config.AUTH_MODE,
          prefix: token.split(':')[0],
        });
        throw new AuthenticationError('Simulated identity tokens are not accepted in this auth mode');
      }

      try {
        return await this.primaryProvider.validateToken(token);
      } catch (err) {
        // Local development convenience only: never degrade a failed real token
        // validation into an identity outside of development.
        if (config.NODE_ENV === 'development') {
          logger.warn('Primary identity validation failed; degrading to guest identity (development only)');
          return await this.mockProvider.validateToken('guest:failed_validation');
        }
        throw err;
      }
    }

    // Default to Guest session
    const sessionId = guestSessionId || `anon_${Math.random().toString(36).substring(2, 10)}`;
    return await this.mockProvider.validateToken(`guest:${sessionId}`);
  }
}

export const authService = new AuthenticationService();
