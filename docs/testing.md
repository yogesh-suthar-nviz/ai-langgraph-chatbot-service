# Testing Strategy & Test Suites

## Vitest Unit & Integration Suites
Tests are located in `ai-service/tests/`:
1. `tests/authorization.test.ts`:
   - Guest vs External vs Internal permission matrices
   - Assertion of `AuthorizationError` on protected actions
2. `tests/tools.test.ts`:
   - Public tool execution (`searchProducts`)
   - Protected tool denial (`refundOrder` called by guest)
   - Authorized execution (`refundOrder` called by internal staff)
3. `tests/graphs.test.ts`:
   - Commerce Graph product search and card assembly
   - Support Graph guest authentication roadblock
   - Support Graph authenticated order tracking
   - Human-In-The-Loop interrupt when refund > ₹5,000

Run tests:
```bash
pnpm test
```
