-- Run this in your Supabase SQL Editor to update the invoices table for line items.

ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tax_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Update status check constraint to include 'draft' and 'sent'
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled'));

-- Let's also ensure reminders table exists, as the spec mentions adding a reminder on "Send"
CREATE TABLE IF NOT EXISTS reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'cancelled')),
  tone text not null default 'friendly',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own reminders" ON reminders;
CREATE POLICY "Users manage own reminders" ON reminders 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_invoice_id ON reminders(invoice_id);
