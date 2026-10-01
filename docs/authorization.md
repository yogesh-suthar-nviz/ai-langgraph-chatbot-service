# Authorization & Permission Architecture

## Overview
Authorization answers **"What is this user allowed to do?"**

Authorization is strictly enforced **server-side**. The frontend UI never dictates permissions, and the LLM is never permitted to decide whether an action is allowed.

---

## Permission Matrix

| Capability | Permission String | Guest | External Customer | Internal Staff |
| :--- | :--- | :---: | :---: | :---: |
| Chat & Inquire | `chat` | ✅ | ✅ | ✅ |
| Search Catalog | `commerce.search` | ✅ | ✅ | ✅ |
| Product Details | `commerce.details` | ✅ | ✅ | ✅ |
| View Own Orders | `order.read` | ❌ | ✅ | ✅ |
| Create Return Request | `order.modify` | ❌ | ✅ | ✅ |
| Process Refund | `order.refund` | ❌ | ❌ (Queued for approval) | ✅ |
| Internal SOPs & Knowledge | `internal.knowledge` | ❌ | ❌ | ✅ |
| Admin Operations | `admin.access` | ❌ | ❌ | Only Admins |

---

## Deterministic Enforcement

Server-side authorization is applied before tool execution via `authorize(user, requiredPermission)`:

```typescript
export function can(user: UserIdentity, permission: Permission | string): boolean {
  if (!user) return false;
  if (user.roles.includes('admin') || user.permissions.includes('admin.access')) return true;
  return user.permissions.includes(permission as Permission);
}

export function authorize(user: UserIdentity, permission: Permission | string): void {
  if (!can(user, permission)) {
    throw new AuthorizationError(permission, user.id);
  }
}
```

If an unauthorized user attempts to trigger a protected action, the system halts immediately and logs the violation.
