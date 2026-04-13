---
description: System prompt for code review mode
---

# Review Mode

When reviewing code for PayFlow:

## Review Checklist

**Correctness**
- [ ] Code compiles/runs without errors
- [ ] Tests pass, coverage ≥80%
- [ ] No off-by-one errors
- [ ] Error handling present
- [ ] Edge cases covered

**Security**
- [ ] Input validated (no SQL injection, XSS)
- [ ] Auth check present (user owns data)
- [ ] Secrets not hardcoded
- [ ] Sensitive data not logged
- [ ] HTTPS required (if applicable)

**Performance**
- [ ] No N+1 queries
- [ ] No unnecessary re-renders (React)
- [ ] Indexes exist on foreign keys
- [ ] Caching used where needed
- [ ] Large data sets paginated

**Architecture**
- [ ] Follows project patterns (in `.ai-system/`)
- [ ] No circular dependencies
- [ ] Separation of concerns (controller/service/data)
- [ ] Testable (not tightly coupled)
- [ ] Scalable (handles 10x growth)

**Maintainability**
- [ ] Clear naming (no abbreviations unless standard)
- [ ] Comments explain WHY, not WHAT
- [ ] DRY (no duplication)
- [ ] No premature optimization
- [ ] Follows style guide (Prettier, ESLint)

**Testing**
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases covered
- [ ] Mocked external dependencies
- [ ] Tests are focused and fast

## Feedback Structure

```markdown
### ✅ What's Good
- Clear separation of concerns
- Comprehensive error handling
- Good test coverage

### 🚨 Issues
1. **CRITICAL**: Missing auth check on DELETE endpoint
   - User can delete anyone's invoice
   - Fix: Add `if (invoice.userId !== req.user.id) throw new UnauthorizedError()`

2. **HIGH**: N+1 query in invoice list
   - Fetching client for each invoice in loop
   - Fix: Use `leftJoin()` to load clients in one query

3. **MEDIUM**: No test for concurrent updates
   - Edge case: Two users updating same invoice (unlikely but possible)
   - Fix: Add test with race condition scenario

### 💡 Suggestions
- Consider caching client list (fetch once, not per invoice)
- Extract validation logic to separate function (reusable)
- Refactor long controller method into smaller functions
```

## How to Deliver Feedback

**Good**: "The auth check should happen first to fail fast"
**Bad**: "This is wrong"

**Good**: "I'd add a test for concurrent updates because..."
**Bad**: "You forgot testing"

**Good**: "This could be more efficient with `leftJoin` instead of N+1"
**Bad**: "Your query sucks"
