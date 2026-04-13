# AI System Integration Guide

## What Just Happened

I've installed a **project-local AI framework** into your PayFlow SaaS codebase. This is NOT just reference documentation — it's an **active, usable system** that I will follow when building features, reviewing code, and making architectural decisions.

## Folder Structure

```
.ai-system/                      # Project-local AI operating system
├── agents/                       # Specialized agents for delegation
│   ├── architect.md             # System design decisions
│   ├── frontend-reviewer.md     # React/Next.js code review
│   ├── backend-reviewer.md      # Node.js/Express code review
│   └── security-auditor.md      # Security & auth audit
│
├── skills/                       # Workflow patterns (8 critical skills)
│   ├── frontend-patterns.md     # React/Next.js best practices
│   ├── backend-patterns.md      # Express/Node.js patterns
│   ├── api-design.md            # REST API design standards
│   ├── database-patterns.md     # PostgreSQL/Supabase patterns
│   ├── auth-patterns.md         # OAuth2, JWT, RLS security
│   ├── saas-billing.md          # Paddle billing integration
│   ├── tdd-workflow.md          # Test-driven development (RED→GREEN→REFACTOR)
│   └── deployment-patterns.md   # Vercel, Docker, CI/CD
│
├── rules/                        # Always-follow guidelines
│   ├── general.md               # Language-agnostic principles
│   ├── typescript.md            # TypeScript standards
│   └── [others as added]
│
├── context/                      # Project-specific system prompts
│   ├── project.md               # PayFlow product context & tech stack
│   ├── research.md              # How to research before proposing
│   └── review.md                # Code review standards
│
└── README.md                     # Overview (read first!)
```

## How I Will Use This (Going Forward)

### 1. **Before Writing Any Code**

I will:
- ✅ Read the relevant **skill** (e.g., `frontend-patterns.md` if building UI)
- ✅ Check **rules** (e.g., `typescript.md` for type safety)
- ✅ Verify alignment with `.ai-system/context/project.md`
- ✅ Reference existing patterns in codebase

**Example**: "You asked me to add invoice export to PDF"
- I read `.ai-system/skills/frontend-patterns.md` (React patterns)
- I read `.ai-system/skills/api-design.md` (API design)
- I read `.ai-system/context/project.md` (invoice ownership rules)
- I check existing code for similar features
- THEN I propose architecture

### 2. **Code Architecture & Design**

I will:
- ✅ Use **architect agent** for major decisions
- ✅ Follow **service → controller → route** pattern (backend-patterns)
- ✅ Follow **container → presentational** pattern (frontend-patterns)
- ✅ Ensure **row-level security** (database-patterns)
- ✅ Include **TDD from the start** (tdd-workflow)

**Example**: "Add subscription tiers (freemium + pro)"
1. I delegate to architect agent to design DB schema
2. I use `saas-billing.md` for Paddle integration
3. I use `api-design.md` for feature-gating endpoints
4. I use `tdd-workflow.md` to write tests FIRST

### 3. **Code Review & Quality**

I will:
- ✅ Use **frontend-reviewer agent** for React/Next.js code
- ✅ Use **backend-reviewer agent** for Node.js/Express code
- ✅ Use **security-auditor agent** for auth/payment logic
- ✅ Enforce **≥80% test coverage** (tdd-workflow)
- ✅ Check for **SQL injection, XSS, data ownership** (review.md)

**Example**: "Review my user authentication code"
- I use security-auditor agent from `.ai-system/agents/security-auditor.md`
- I check auth-patterns.md for OAuth2/JWT best practices
- I verify no hardcoded secrets, proper token expiry, RLS enabled
- I provide actionable feedback using tone guide in `.ai-system/context/review.md`

### 4. **Database Schema Design**

I will:
- ✅ Follow PostgreSQL naming conventions (snake_case columns, PascalCase tables)
- ✅ Use UUID primary keys (no sequential IDs that leak info)
- ✅ Include `created_at`, `updated_at` timestamps
- ✅ Implement RLS (row-level security) for user isolation
- ✅ Reference `database-patterns.md` for schema examples

**Example**: "Design schema for team workspaces"
- I check if PayFlow is single-tenant or multi-tenant (`.ai-system/context/project.md`)
- I design schema following database-patterns.md
- I add RLS policies so users only see their team data
- I write migration script

### 5. **API Endpoint Design**

I will:
- ✅ Follow REST conventions (GET/POST/PUT/DELETE)
- ✅ Use proper HTTP status codes (201 Created, 400 Bad Request, 401 Unauthorized, etc.)
- ✅ Include error responses with `code` and `message`
- ✅ Paginate list endpoints
- ✅ Validate input with Zod/Joi
- ✅ Check user owns resource before returning

**All from**: `api-design.md` skill

### 6. **Authentication & Security**

I will:
- ✅ Use Supabase Auth (OAuth2 + JWT)
- ✅ Store JWT in httpOnly cookies (never localStorage)
- ✅ Verify user owns data before any operation
- ✅ Implement row-level security (RLS)
- ✅ Never store card data (use Paddle exclusively)
- ✅ Hash passwords with bcrypt (if custom auth needed)
- ✅ Validate ALL user input

**All from**: `auth-patterns.md` skill

### 7. **Billing & Payments**

I will:
- ✅ Use Paddle for ALL payments (never DIY)
- ✅ Create Paddle customer when user joins
- ✅ Handle webhooks to sync subscription status
- ✅ Implement feature gating (free tier limits)
- ✅ Never log payment data

**All from**: `saas-billing.md` skill

### 8. **Testing Strategy**

I will:
- ✅ Write tests FIRST (RED phase)
- ✅ Implement code to pass (GREEN phase)
- ✅ Refactor (BLUE phase)
- ✅ Target ≥80% coverage
- ✅ Test happy path + error cases + edge cases
- ✅ Use Vitest + React Testing Library (frontend)
- ✅ Use Vitest + Supertest (backend)

**All from**: `tdd-workflow.md` skill

### 9. **Deployment Checklist**

Before going to production, I will:
- ✅ Run full test suite (coverage ≥80%)
- ✅ Run linter (ESLint, Prettier)
- ✅ Check for console.log statements (remove)
- ✅ Verify environment variables set
- ✅ Run database migrations
- ✅ Test health check endpoint
- ✅ Verify no secrets in code
- ✅ Build and test docker image (if applicable)

**All from**: `deployment-patterns.md` skill

## When to Ask Me to Use Specific Agents

You can ask me to delegate to agents:

```
"Can you architect the recurring invoices feature?"
→ I'll use the architect agent

"Review my API endpoint"
→ I'll use backend-reviewer agent

"Check if my auth implementation is secure"
→ I'll use security-auditor agent

"Design the client portal"
→ I'll use frontend-reviewer agent (or ask architect first)
```

## What Changed

| Before | After |
|--------|-------|
| Generic coding advice | PayFlow-specific patterns |
| No testing emphasis | TDD from the start (RED→GREEN→REFACTOR) |
| Ad-hoc decisions | Consistent with project standards |
| No security focus | Active security checks (RLS, auth, payments) |
| Random patterns | Curated, battle-tested patterns |

## Key Rules I'll Follow

1. **NEVER hardcode secrets** — Use environment variables
2. **NEVER trust user input** — Always validate
3. **NEVER store card data** — Use Paddle exclusively
4. **NEVER N+1 query** — Eagerly load relations
5. **NEVER skip logging** — Track all actions in activity_logs
6. **NEVER delete data** — Soft deletes only (archive)
7. **ALWAYS test first** — Write tests before code
8. **ALWAYS check user owns resource** — RLS + explicit checks
9. **ALWAYS include error handling** — Centralized error middleware
10. **ALWAYS paginate lists** — No unbounded queries

## Quick Cheat Sheet

**When I'm building something...**

1. Read `.ai-system/README.md` (overview)
2. Read relevant **skill** (e.g., `frontend-patterns.md`)
3. Read relevant **rules** (e.g., `typescript.md`)
4. Read `.ai-system/context/project.md` (PayFlow constraints)
5. Delegate to **agent** if uncertain (architect, reviewer, auditor)
6. Write **tests first** (TDD)
7. Follow **patterns from skills/** (not making it up)
8. Submit for **review** before merging

## If You Want to Evolve the AI System

This is **your** system. You can:

- ✅ Add new skills (e.g., `mobile-patterns.md` if building iOS)
- ✅ Add new agents (e.g., `mobile-reviewer.md`)
- ✅ Update rules as team standards change
- ✅ Add new context files (e.g., `performance-budget.md`)
- ✅ Remove skills that don't apply
- ❌ BUT keep .ai-system/ in version control (team resource)

## Next Steps

1. **Run the website** — You're live at http://localhost:8082 ✅
2. **Ask me to build a feature** — I'll use the AI system
3. **Review code with me** — I'll use agents + review.md
4. **Iterate** — The system improves as you use it

---

**This AI system is now ACTIVE in your project.**
All future coding, architecture, and review decisions will use these patterns.

Start with: "Add [feature] using the AI system" or "Review my [code] against the AI standards"
