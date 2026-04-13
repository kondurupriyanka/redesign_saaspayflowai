# PayFlow AI System

Project-local AI framework for building scalable SaaS. This system provides agents, skills, rules, and context to maintain consistency across frontend, backend, database, auth, billing, and deployment.

**Do not treat this as reference only. Use actively while coding.**

## Structure

```
.ai-system/
├── agents/                    # Specialized subagents for delegation
│   ├── architect.md          # System design decisions
│   ├── frontend-reviewer.md  # React/Next.js review
│   ├── backend-reviewer.md   # Node.js/API review
│   └── security-auditor.md   # Security & auth review
│
├── skills/                    # Workflow patterns
│   ├── frontend-patterns.md       # React/Next.js best practices
│   ├── backend-patterns.md        # Express/Node.js patterns
│   ├── api-design.md             # REST API design
│   ├── database-patterns.md       # Supabase/PostgreSQL patterns
│   ├── deployment-patterns.md     # Vercel/Docker deployment
│   ├── saas-billing.md           # Paddle billing integration
│   ├── auth-patterns.md          # OAuth2, JWT, session management
│   └── tdd-workflow.md           # Test-driven development
│
├── rules/                     # Always-follow guidelines
│   ├── typescript.md         # TypeScript best practices
│   ├── react.md             # React component patterns
│   ├── nodejs.md            # Node.js/Express patterns
│   └── general.md           # Language-agnostic principles
│
├── context/                   # Project-specific system prompts
│   ├── project.md           # PayFlow SaaS context
│   ├── research.md          # Research mode
│   └── review.md            # Code review mode
│
└── README.md                 # This file
```

## When to Use

| Task | Agent | Skill |
|------|-------|--------|
| Plan new feature | architect | frontend-patterns, backend-patterns |
| Code review | frontend-reviewer / backend-reviewer | (respective skill) |
| Security check | security-auditor | auth-patterns |
| API design | architect | api-design |
| Database design | architect | database-patterns |
| Deploy to production | (delegated) | deployment-patterns |
| Add billing | (delegated) | saas-billing |
| Write tests | (delegated) | tdd-workflow |

## How I Use This

When working on your project, I will:

1. **Check rules first** - Always follow coding standards in `rules/`
2. **Reference skills** - Use workflow patterns from `skills/` as templates
3. **Delegate to agents** - Use agents in `agents/` for complex decisions
4. **Respect context** - Apply project assumptions from `context/`
5. **Maintain consistency** - Keep UI design system, API patterns, and database schemas aligned

## Quick Start

For any task:
1. Read the relevant skill (if it exists)
2. Ask me to delegate to an agent if uncertain
3. Reference rules for code conventions
4. Apply project context to adapt general patterns

## System Rules (Meta)

- **No generic copy-paste**: All patterns are adapted to PayFlow's specific requirements
- **SaaS-first**: Consider billing, multi-tenancy, auth, and compliance
- **Production-ready**: All code follows enterprise standards
- **Modular**: Patterns are self-contained and reusable
- **Testable**: All code includes TDD-first approach
- **Documented**: Every pattern includes usage examples
