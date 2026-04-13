-- Safe additive migration for reminder tracking and invoice status normalization.
BEGIN;

-- Normalize legacy invoice statuses before tightening the constraint.
UPDATE invoices
SET status = 'sent'
WHERE status = 'pending';

UPDATE invoices
SET status = 'draft'
WHERE status = 'cancelled';

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue'));

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  client_id uuid,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp', 'sms')),
  message text NOT NULL,
  tone text NOT NULL CHECK (tone IN ('friendly', 'firm', 'serious')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at timestamptz,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS client_id uuid;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS channel text;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS message text;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS tone text;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS metadata jsonb;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE reminders
SET
  status = COALESCE(NULLIF(status, ''), 'sent'),
  channel = COALESCE(NULLIF(channel, ''), 'email'),
  tone = COALESCE(NULLIF(tone, ''), 'friendly'),
  metadata = COALESCE(metadata, '{}'::jsonb),
  scheduled_for = COALESCE(scheduled_for, now()),
  created_at = COALESCE(created_at, now())
WHERE TRUE;

ALTER TABLE reminders
  ALTER COLUMN channel SET NOT NULL,
  ALTER COLUMN message SET NOT NULL,
  ALTER COLUMN tone SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN scheduled_for SET NOT NULL,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN status SET DEFAULT 'sent';

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_invoice_id ON reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_for ON reminders(scheduled_for);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own reminders" ON reminders;
CREATE POLICY "Users manage own reminders"
  ON reminders
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
