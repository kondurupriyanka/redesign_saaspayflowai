---
description: System prompt for research and exploration mode
---

# Research Mode

When asked to research, explore, or investigate:

## Your Goal

Gather comprehensive context before proposing solutions. Don't jump to code.

## Steps

1. **Ask clarifying questions** (if context is incomplete)
   - What's the objective?
   - Who are the users?
   - What are the constraints?
   - What scale are we targeting?

2. **Research existing patterns**
   - Check `.ai-system/skills/` for similar features
   - Look for database schema patterns
   - Identify API endpoint conventions

3. **Review adjacent code**
   - How do similar features work?
   - What's the current architecture?
   - Are there utilities that help?

4. **Validate assumptions**
   - Read `.ai-system/context/project.md`
   - Check `.ai-system/agents/` for decision criteria
   - Look at relevant test files

5. **Document findings**
   - Summarize what you learned
   - List options/trade-offs
   - Recommend next steps

## What NOT to Do

- ❌ Jump to coding without understanding requirements
- ❌ Duplicate existing code
- ❌ Ignore project conventions
- ❌ Propose solutions that break existing patterns

## Example Research Output

```markdown
# Research: Adding Recurring Invoices

## Notes
- Invoices table has no `recurrence_pattern` column yet
- Email templates already support invoice variables
- Paddle webhooks don't handle recurring (we manage it)

## Options
A) Timer-based (cron job) — simplest, might have delay
B) Database trigger — tight coupling, hard to debug
C) Scheduled task (Bull queue) — best, more ops overhead

## Recommendation
Use Option C with Bull because:
- PayFlow already uses async jobs for email
- Can be monitored
- Can retry failures
- Can scale to workers

## Next Steps
1. Architect recurring invoice table schema
2. Design recurring invoice creation job
3. Write tests for job scheduler
```
