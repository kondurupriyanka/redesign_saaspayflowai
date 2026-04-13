# PayFlow AI — Replit Project

## Overview
AI-powered invoice and payment management SaaS for freelancers. Helps create invoices, track payments, and send smart AI-driven payment reminders.

## Architecture

### Frontend (Port 5000)
- **React + Vite** with TypeScript
- **Supabase Auth** — used only for user authentication (login/signup/JWT)
- All API calls go to `/api/*` which Vite proxies to the Express backend on port 3001

### Backend (Port 3001)
- **Express.js** server at `backend/server.ts`
- **Direct PostgreSQL** via `pg` pool at `backend/database/db.ts` — all DB queries use Replit's built-in database
- JWT verification uses `supabaseAdmin.auth.getUser()` in `backend/middleware/auth.ts`
- Services: UserService, ClientService, InvoiceService, AnalyticsService, NotificationService, PaymentService, BillingService, FinancialAnalyticsService, EmailService, AIService

### Database
- **Replit PostgreSQL** (built-in) — schema at `backend/database/schema.sql`
- Tables: users, clients, invoices, payments, reminders, projects, milestones, notifications, analytics_events, subscriptions, client_portal_tokens, invoice_responses
- `invoices.share_token TEXT UNIQUE` — 40-char hex token for per-invoice public share links (added via ALTER TABLE)
- `users.payment_info JSONB` — freelancer's UPI/bank details shown on client invoice page (added via ALTER TABLE)
- `invoice_messages` — client ↔ freelancer messages per invoice (sender: 'client'|'freelancer')
- `invoice_payments` — client-submitted payment confirmations with status: pending|confirmed
- `invoice_requests` — extension/dispute requests with status: pending|approved|rejected
- `invoice_activity` — full audit timeline of all events per invoice

## Running the App
```bash
npm run dev
```
This starts both the Vite frontend (port 5000) and the Express backend (port 3001) concurrently.

## Environment Secrets Required
- `SUPABASE_URL` — Supabase project URL (for auth)
- `SUPABASE_ANON_KEY` — Supabase public anon key (for frontend auth)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for server-side JWT verification)
- `DATABASE_URL` — Replit PostgreSQL connection string (auto-provisioned)

## Optional Secrets
- `OPENROUTER_API_KEY` — For AI-powered features (payment reminders, invoice extraction, financial insights)
- `OPENROUTER_MODEL` — AI model to use (defaults to `openai/gpt-4o-mini`)

## Key Files
- `vite.config.ts` — Injects Supabase env vars for frontend via `define`, proxies `/api` to backend
- `backend/server.ts` — Express app entry point
- `backend/database/db.ts` — PostgreSQL pool connection
- `backend/database/schema.sql` — Full DB schema
- `backend/config/supabase.ts` — Supabase client (auth JWT only)
- `backend/middleware/auth.ts` — JWT verification middleware
- `src/lib/supabase.ts` — Frontend Supabase client for auth
- `backend/routes/dashboard.ts` — `GET /api/dashboard` — aggregates stats, chart, activity, recent invoices from Replit PostgreSQL
- `src/lib/api/dashboard.ts` — Frontend wrapper; calls `GET /api/dashboard` via `apiRequest()`
- `src/hooks/useReminderEngine.ts` — Fetches overdue invoices from `GET /api/invoices/list/overdue` (not Supabase)
- `src/lib/api/settings.ts` — `uploadAvatar()` uses Supabase Storage with a clear error message if bucket is not configured

## Data Flow (important)
- **All business data** (invoices, clients, payments, reminders, etc.) lives in **Replit PostgreSQL**. Never read these from Supabase tables.
- **Auth only** (login, JWT, session refresh) goes through Supabase Auth.
- `apiRequest()` in `src/lib/api/client.ts` attaches the Supabase JWT as `Authorization: Bearer` for every backend call.
- Outstanding amount = `totalBilled − totalRevenue` (confirmed payments only).
