CREATE SCHEMA IF NOT EXISTS "public";
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_name" text NOT NULL,
	"properties" jsonb DEFAULT '{}' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "client_portal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"client_id" uuid NOT NULL,
	"token" text DEFAULT encode(gen_random_bytes(32), 'hex'::text) NOT NULL CONSTRAINT "client_portal_tokens_token_key" UNIQUE,
	"expires_at" timestamp with time zone DEFAULT (now() + '30 days'::interval) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"company_name" text,
	"gst_number" text,
	"pan_number" text,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "invoice_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"response_type" text NOT NULL,
	"reason" text,
	"new_due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoice_responses_response_type_check" CHECK (CHECK ((response_type = ANY (ARRAY['delay'::text, 'confirmation'::text]))))
);

CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"invoice_number" text NOT NULL CONSTRAINT "invoices_invoice_number_key" UNIQUE,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" timestamp with time zone,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"line_items" jsonb DEFAULT '[]' NOT NULL,
	"tax_percent" numeric(5, 2) DEFAULT '0',
	"sent_at" timestamp with time zone,
	CONSTRAINT "invoices_amount_check" CHECK (CHECK ((amount > (0)::numeric))),
	CONSTRAINT "invoices_status_check" CHECK (CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'pending'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text]))))
);
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "milestones_status_check" CHECK (CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'review'::text, 'done'::text]))))
);
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"notes" text,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_transaction_id" text,
	"failure_reason" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_check" CHECK (CHECK ((amount > (0)::numeric))),
	CONSTRAINT "payments_status_check" CHECK (CHECK ((status = ANY (ARRAY['completed'::text, 'pending'::text, 'failed'::text, 'cancelled'::text]))))
);
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"invoice_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"progress_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_progress_percent_check" CHECK (CHECK (((progress_percent >= (0)::numeric) AND (progress_percent <= (100)::numeric)))),
	CONSTRAINT "projects_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'completed'::text, 'on_hold'::text, 'cancelled'::text]))))
);
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"invoice_id" uuid NOT NULL,
	"client_id" uuid,
	"channel" text DEFAULT 'email' NOT NULL,
	"message" text NOT NULL,
	"tone" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_channel_check" CHECK (CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text])))),
	CONSTRAINT "reminders_status_check" CHECK (CHECK ((status = ANY (ARRAY['sent'::text, 'delivered'::text, 'failed'::text])))),
	CONSTRAINT "reminders_tone_check" CHECK (CHECK ((tone = ANY (ARRAY['friendly'::text, 'firm'::text, 'serious'::text]))))
);
ALTER TABLE "reminders" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "subscriptions_user_id_key" UNIQUE,
	"provider" text DEFAULT 'paddle' NOT NULL,
	"provider_subscription_id" text,
	"paddle_customer_id" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"next_billing_date" timestamp with time zone,
	"last_event_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_plan_check" CHECK (CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text, 'growth'::text])))),
	CONSTRAINT "subscriptions_status_check" CHECK (CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'past_due'::text]))))
);
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY,
	"email" text NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"name" text,
	"phone" text,
	"business_name" text,
	"plan" text DEFAULT 'free' NOT NULL,
	"trial_end" timestamp with time zone,
	"is_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"avatar_url" text,
	"invoice_prefix" text DEFAULT 'PF',
	"default_currency" text DEFAULT 'USD',
	"default_tax" numeric(5, 2) DEFAULT '0',
	"onboarding_completed" boolean DEFAULT false,
	"notify_invoice_viewed" boolean DEFAULT true,
	"notify_payment_received" boolean DEFAULT true,
	"notify_daily_digest" boolean DEFAULT false,
	"reminder_days" integer DEFAULT 3,
	CONSTRAINT "users_plan_check" CHECK (CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text, 'growth'::text]))))
);
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "analytics_events" DROP CONSTRAINT IF EXISTS "analytics_events_user_id_fkey";
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "client_portal_tokens" DROP CONSTRAINT IF EXISTS "client_portal_tokens_client_id_fkey";
ALTER TABLE "client_portal_tokens" ADD CONSTRAINT "client_portal_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;

ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_user_id_fkey";
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "invoice_responses" DROP CONSTRAINT IF EXISTS "invoice_responses_invoice_id_fkey";
ALTER TABLE "invoice_responses" ADD CONSTRAINT "invoice_responses_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;

ALTER TABLE "invoice_responses" DROP CONSTRAINT IF EXISTS "invoice_responses_user_id_fkey";
ALTER TABLE "invoice_responses" ADD CONSTRAINT "invoice_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_client_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_user_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "milestones" DROP CONSTRAINT IF EXISTS "milestones_project_id_fkey";
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_user_id_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_invoice_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_user_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_client_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_invoice_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL;

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_user_id_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "reminders_invoice_id_fkey";
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE;

ALTER TABLE "reminders" DROP CONSTRAINT IF EXISTS "reminders_user_id_fkey";
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_user_id_fkey";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "analytics_events_pkey" ON "analytics_events" ("id");
CREATE INDEX IF NOT EXISTS "idx_analytics_events_user_id" ON "analytics_events" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "client_portal_tokens_pkey" ON "client_portal_tokens" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "client_portal_tokens_token_key_idx" ON "client_portal_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_portal_tokens_client_id" ON "client_portal_tokens" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_portal_tokens_token" ON "client_portal_tokens" ("token");
CREATE UNIQUE INDEX IF NOT EXISTS "clients_pkey" ON "clients" ("id");
CREATE INDEX IF NOT EXISTS "idx_clients_company_name" ON "clients" ("company_name");
CREATE INDEX IF NOT EXISTS "idx_clients_user_id" ON "clients" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_responses_pkey" ON "invoice_responses" ("id");
CREATE INDEX IF NOT EXISTS "idx_invoices_client_id" ON "invoices" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices" ("status");
CREATE INDEX IF NOT EXISTS "idx_invoices_user_id" ON "invoices" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_number_key_idx" ON "invoices" ("invoice_number");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_pkey" ON "invoices" ("id");
CREATE INDEX IF NOT EXISTS "idx_milestones_order" ON "milestones" ("order");
CREATE INDEX IF NOT EXISTS "idx_milestones_project_id" ON "milestones" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_milestones_status" ON "milestones" ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "milestones_pkey" ON "milestones" ("id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_pkey" ON "notifications" ("id");
CREATE INDEX IF NOT EXISTS "idx_payments_invoice_id" ON "payments" ("invoice_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_payments_provider_transaction_id" ON "payments" ("provider_transaction_id");
CREATE INDEX IF NOT EXISTS "idx_payments_user_id" ON "payments" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_pkey" ON "payments" ("id");
CREATE INDEX IF NOT EXISTS "idx_projects_client_id" ON "projects" ("client_id");
CREATE INDEX IF NOT EXISTS "idx_projects_invoice_id" ON "projects" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects" ("status");
CREATE INDEX IF NOT EXISTS "idx_projects_user_id" ON "projects" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "projects_pkey" ON "projects" ("id");
CREATE INDEX IF NOT EXISTS "idx_reminders_invoice_id" ON "reminders" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_reminders_scheduled_for" ON "reminders" ("scheduled_for");
CREATE INDEX IF NOT EXISTS "idx_reminders_status" ON "reminders" ("status");
CREATE INDEX IF NOT EXISTS "idx_reminders_user_id" ON "reminders" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "reminders_pkey" ON "reminders" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_pkey" ON "subscriptions" ("id");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_id_key_idx" ON "subscriptions" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key_idx" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_pkey" ON "users" ("id");
