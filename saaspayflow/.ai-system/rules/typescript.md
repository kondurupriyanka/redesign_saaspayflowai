---
description: TypeScript coding standards
---

# TypeScript Rules

## Type Safety

- ✅ Use strict TypeScript mode (`strict: true` in tsconfig.json)
- ✅ Explicitly type all function parameters and return values
- ✅ Use interfaces for objects, not type aliases (consistency)
- ❌ Never use `any` — use `unknown` if truly unknown, then narrow

```typescript
// ✅ Good
function createInvoice(userId: string, amount: number): Promise<Invoice> {
  // ...
}

const user: User = { id: '123', email: 'test@example.com' };

// ❌ Bad
function createInvoice(userId, amount): any {
  // ...
}

const user: any = { id: '123' };
```

## Naming Conventions

- **Types/Interfaces**: PascalCase (`User`, `CreateInvoiceInput`)
- **Functions/Variables**: camelCase (`getUserById`, `maxRetries`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_INVOICE_AMOUNT`)
- **Files**: kebab-case for utilities, PascalCase for components (`invoice-service.ts`, `InvoiceForm.tsx`)

## Exports

```typescript
// ✅ Named exports (better for large codebases)
export const userService = { /* ... */ };
export const invoiceService = { /* ... */ };

// ❌ Avoid default exports (harder to refactor)
export default userService;
```

## Union Types & Discriminated Unions

```typescript
// ✅ Use discriminated unions for state
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

type InvoiceState =
  | { status: 'draft'; }
  | { status: 'sent'; sentAt: Date }
  | { status: 'paid'; paidAt: Date; transactionId: string }
  | { status: 'cancelled'; reason: string };

function handleInvoice(state: InvoiceState) {
  switch (state.status) {
    case 'draft':
      // Only these fields available
      return;
    case 'paid':
      console.log(state.transactionId); // ✅ Type-safe
  }
}
```

## Generics (for reusable code)

```typescript
// ✅ Generic API response wrapper
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
}

async function fetchInvoices(): Promise<ApiResponse<Invoice[]>> {
  // ...
}
```

## Error Handling

```typescript
// ✅ Use custom error classes
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ❌ Avoid throwing plain strings
throw new Error('Invalid amount'); // ✅
throw 'Invalid amount'; // ❌
```
