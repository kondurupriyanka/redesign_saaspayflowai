-- Run this in your Supabase SQL Editor to update the reminders table and add client response tracking.

-- 1. Evolve the reminders table to support channels, messages, and better status tracking
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'sms')),
ADD COLUMN IF NOT EXISTS message text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 2. Update status constraint for reminders
ALTER TABLE reminders DROP CONSTRAINT IF EXISTS reminders_status_check;
ALTER TABLE reminders ADD CONSTRAINT reminders_status_check 
  CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed', 'cancelled'));

-- 3. Create table for client responses (e.g. from the payment portal)
CREATE TABLE IF NOT EXISTS invoice_responses (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  response_type text not null check (response_type in ('delay', 'confirmation')),
  reason text,
  new_due_date date,
  created_at timestamptz not null default now()
);

-- RLS for invoice_responses
ALTER TABLE invoice_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own invoice responses" ON invoice_responses;
CREATE POLICY "Users manage own invoice responses" ON invoice_responses 
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_invoice_responses_invoice_id ON invoice_responses(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_responses_user_id ON invoice_responses(user_id);

-- Optional: Simulation function for delivery events (can be called via RPC for demo)
CREATE OR REPLACE FUNCTION simulate_delivery_event(reminder_id UUID, next_status TEXT)
RETURNS void AS $$
BEGIN
  UPDATE reminders 
  SET status = next_status, 
      updated_at = now() 
  WHERE id = reminder_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
