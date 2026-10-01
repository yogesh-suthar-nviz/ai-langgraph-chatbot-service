export const PERMISSIONS = {
  CHAT: 'chat',
  COMMERCE_SEARCH: 'commerce.search',
  COMMERCE_DETAILS: 'commerce.details',
  ORDER_READ: 'order.read',
  ORDER_MODIFY: 'order.modify',
  ORDER_REFUND: 'order.refund',
  INTERNAL_KNOWLEDGE: 'internal.knowledge',
  ADMIN_ACCESS: 'admin.access',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Standard default permissions mapped to user types/roles
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  guest: [
    PERMISSIONS.CHAT,
    PERMISSIONS.COMMERCE_SEARCH,
    PERMISSIONS.COMMERCE_DETAILS,
  ],
  external_customer: [
    PERMISSIONS.CHAT,
    PERMISSIONS.COMMERCE_SEARCH,
    PERMISSIONS.COMMERCE_DETAILS,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_MODIFY,
  ],
  internal_employee: [
    PERMISSIONS.CHAT,
    PERMISSIONS.COMMERCE_SEARCH,
    PERMISSIONS.COMMERCE_DETAILS,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_MODIFY,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.INTERNAL_KNOWLEDGE,
  ],
  admin: Object.values(PERMISSIONS),
};
