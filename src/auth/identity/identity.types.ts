export type IdentityType = 'guest' | 'external' | 'internal';

export interface BaseIdentity {
  type: IdentityType;
  id: string;
}

export interface GuestIdentity extends BaseIdentity {
  type: 'guest';
  sessionId: string;
}

export interface ExternalIdentity extends BaseIdentity {
  type: 'external';
  provider: string;
  subject: string;
  email?: string;
  name?: string;
  roles: string[];
}

export interface InternalIdentity extends BaseIdentity {
  type: 'internal';
  provider: string;
  subject: string;
  email?: string;
  name?: string;
  roles: string[];
  permissions: string[];
}

export interface UserIdentity {
  id: string;
  type: IdentityType;
  provider?: string;
  subject?: string;
  email?: string;
  name?: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
}
