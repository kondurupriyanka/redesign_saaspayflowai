---
description: General coding principles (language-agnostic)
---

# General Principles

## Code Organization

- **One responsibility per file/function** (Single Responsibility Principle)
- **Max 300 lines per file** — break into modules if larger
- **Group related code** — don't scatter utils everywhere
- **Clear folder structure**: `services/`, `controllers/`, `utils/`, `types/`, etc.

## Comments & Documentation

```typescript
// ✅ Good comments explain WHY, not WHAT
// We limit to 100/hour because free tier customers were abusing reminders
const REMINDERS_PER_HOUR = 100;

// ❌ Bad comments repeat code
// This function gets the user
function getUser(id: string) { }
```

## DRY (Don't Repeat Yourself)

```typescript
// ❌ Bad: Repeated logic
const validEmail = (email) => email.includes('@') && email.includes('.');
const validEmail2 = (email) => email.includes('@') && email.includes('.');

// ✅ Good: Extracted to utility
function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}
```

## Error Handling

```typescript
// ✅ Always handle errors
try {
  await sendEmail(user.email);
} catch (error) {
  logger.error('Failed to send email', { userId: user.id, error });
  // Notify user or retry
}

// ❌ Silent failures
try {
  await sendEmail(user.email);
} catch (error) {
  // Ignored
}
```

## Performance

- Use caching for expensive operations
- Lazy-load components and data
- Batch database queries
- Avoid N+1 queries
- Preload critical resources

## Security

- ✅ Validate all user input
- ✅ Sanitize untrusted data
- ✅ Hash passwords with bcrypt
- ✅ Use HTTPS everywhere
- ✅ Never log sensitive data (tokens, passwords)
- ❌ Never trust user input
- ❌ Never hardcode secrets

## Testing

- Write tests **before** code (TDD)
- Test happy path + error cases
- Aim for ≥80% coverage
- Mock external dependencies
- Use descriptive test names

```typescript
// ✅ Clear test names
it('should return 400 if email is missing', () => {});
it('should create user and send welcome email', () => {});

// ❌ Vague test names
it('tests email', () => {});
it('works', () => {});
```

## Code Review Principles

When reviewing code:

1. **Does it work?** Run tests, check logic
2. **Is it secure?** Check auth, validation, data handling
3. **Is it maintainable?** Clear code, good names, proper structure
4. **Is it tested?** Coverage ≥80%
5. **Is it documented?** Comments for complex logic

Feedback tone:

- ✅ "This could be more efficient with..." (suggestion)
- ✅ "I'd recommend..." (guidance)
- ❌ "This is wrong" (judgmental)
- ❌ "Just do it my way" (unhelpful)
