import { describe, it, expect } from 'vitest';
import { can, authorize, AuthorizationError } from '../src/auth/authorization/authorizer.js';
import { PERMISSIONS } from '../src/auth/authorization/permissions.js';
import { MockIdentityProvider } from '../src/auth/providers/mock-identity-provider.js';

describe('Authorization & Identity System', () => {
  const provider = new MockIdentityProvider();

  it('correctly grants guest only public catalog permissions', async () => {
    const guest = await provider.validateToken('guest:session_123');

    expect(guest.type).toBe('guest');
    expect(can(guest, PERMISSIONS.COMMERCE_SEARCH)).toBe(true);
    expect(can(guest, PERMISSIONS.COMMERCE_DETAILS)).toBe(true);
    expect(can(guest, PERMISSIONS.ORDER_READ)).toBe(false);
    expect(can(guest, PERMISSIONS.ORDER_REFUND)).toBe(false);
    expect(can(guest, PERMISSIONS.INTERNAL_KNOWLEDGE)).toBe(false);
  });

  it('grants external customers order read permissions but not refund permissions', async () => {
    const customer = await provider.validateToken('external:cust_123');

    expect(customer.type).toBe('external');
    expect(can(customer, PERMISSIONS.COMMERCE_SEARCH)).toBe(true);
    expect(can(customer, PERMISSIONS.ORDER_READ)).toBe(true);
    expect(can(customer, PERMISSIONS.ORDER_MODIFY)).toBe(true);
    expect(can(customer, PERMISSIONS.ORDER_REFUND)).toBe(false);
  });

  it('grants internal employees full support and refund permissions', async () => {
    const employee = await provider.validateToken('internal:emp_456');

    expect(employee.type).toBe('internal');
    expect(can(employee, PERMISSIONS.ORDER_READ)).toBe(true);
    expect(can(employee, PERMISSIONS.ORDER_REFUND)).toBe(true);
    expect(can(employee, PERMISSIONS.INTERNAL_KNOWLEDGE)).toBe(true);
  });

  it('throws AuthorizationError on unauthorized action', async () => {
    const guest = await provider.validateToken('guest:session_123');

    expect(() => authorize(guest, PERMISSIONS.ORDER_REFUND)).toThrow(AuthorizationError);
  });
});
