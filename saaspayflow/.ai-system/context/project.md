---
description: PayFlow SaaS project context and assumptions
---

# PayFlow Project Context

**Product**: AI-powered invoicing and payment collection platform

**Core Features**:
- Create, send, and track invoices
- Automated payment reminders
- Client portal for viewing/paying invoices
- Analytics dashboard
- Paddle billing integration

**Tech Stack**:
- **Frontend**: Next.js 14+ with React 18+, TypeScript, Tailwind CSS
- **Backend**: Node.js/Express with TypeScript
- **Database**: Supabase (PostgreSQL) with RLS
- **Auth**: Supabase Auth (OAuth2 + JWT)
- **Payments**: Paddle (never handle card data ourselves)
- **Deployment**: Vercel (frontend + API routes)

## Key Assumptions

1. **Single-tenant** (per user account, not workspaces)
2. **Invoice ownership**: Each invoice belongs to ONE user
3. **No sensitive data in logs** — payment data stays in Paddle
4. **GDPR compliant** — user deletion cascades throughout DB
5. **Audit trail required** — track all invoicing actions
6. **Paddle is source of truth** — subscription status, payments
7. **Real-time updates preferred** — webhooks, not polling

## Data Flow

```
User (Frontend)
  ↓
Next.js API Routes / Express
  ↓
Supabase (PostgreSQL + RLS)
  ↓
Analytics / Logging

Paddle (external)
  ↓
Webhook → Our API
```

## Common Workflows

**Creating an invoice**:
1. User fills form (client, amount, due date)
2. Modal/page shows preview
3. Click "Create"
4. API validates (client owned by user)
5. DB creates with status="draft"
6. UI shows success message with "Send Invoice" button

**Sending an invoice**:
1. User clicks "Send"
2. API validates (status="draft")
3. Email sent to client (template)
4. DB updates status="sent", sentAt=now
5. Activity log created

**Payment via Paddle**:
1. Client clicks "Pay" or "Pay Now" button
2. Redirects to Paddle checkout
3. Paddle handles payment securely
4. Webhook fires → Our API (verify signature!)
5. Update invoice status="paid", paidAt=now
6. Send payment confirmation email
7. User sees in dashboard

## Convention Over Configuration

**API Routes**: `/api/[resource]/[action]`
- `/api/invoices` — List/Create
- `/api/invoices/[id]` — Get/Update/Delete
- `/api/invoices/[id]/send` — Custom action
- `/api/invoices/[id]/print` — Export as PDF

**Database**: PascalCase tables (best practice), snake_case columns
- `users`, `invoices`, `clients`, `payments`, `activity_logs`
- Columns: `user_id`, `created_at`, `updated_at`

**Files**: Components in `/src/components`, pages in `/src/pages`, utils in `/src/lib`

## When to Delegate to Agents

- **Architecture decisions**: Ask architect
- **Code review**: Ask frontend-reviewer or backend-reviewer
- **Security concerns**: Ask security-auditor
- **Design system**: Reference design-tokens in context/
- **Testing strategy**: Reference tdd-workflow in skills/

## Constraints

- ✅ Use Paddle for all payments (never DIY)
- ✅ Use Supabase RLS for row-level access control
- ✅ All timestamps in UTC (Supabase defaults)
- ✅ All IDs are UUIDs (no predictable IDs)
- ✅ Soft deletes only (archive, don't destroy historical data)
- ❌ No storing card data
- ❌ No custom payment processing
- ❌ No storing plaintext passwords

## Feature Flags (Future)

For A/B testing or gradual rollouts:
```typescript
const isFeatureEnabled = (featureName: string, userId: string): boolean => {
  // Check feature_flags table
};

if (isFeatureEnabled('multipleInvoices', userId)) {
  // Show batch invoice creation UI
}
```
