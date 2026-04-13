-- =============================================================
--  PayFlow AI — Production schema fix
--  Run once in the Supabase SQL editor (safe to re-run)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
--  USERS — add profile & onboarding columns
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed  BOOLEAN      NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url            TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invoice_prefix        TEXT         NOT NULL DEFAULT 'PF';
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_currency      TEXT         NOT NULL DEFAULT 'INR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_tax           DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_invoice_viewed     BOOLEAN  NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_payment_received   BOOLEAN  NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_daily_digest       BOOLEAN  NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reminder_days         INTEGER      NOT NULL DEFAULT 3;

-- ─────────────────────────────────────────────────────────────
--  CLIENTS — ensure required fields
-- ─────────────────────────────────────────────────────────────
-- email is required per product spec; guard against existing NULLs
UPDATE clients SET email = '' WHERE email IS NULL;
ALTER TABLE clients ALTER COLUMN email SET NOT NULL;

-- ─────────────────────────────────────────────────────────────
--  INVOICES — add structured money + metadata columns
-- ─────────────────────────────────────────────────────────────

-- title: human-readable name for the invoice
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS title          TEXT;
UPDATE invoices SET title = description WHERE title IS NULL AND description IS NOT NULL;

-- tax_percent: percentage input (e.g. 18 = 18%)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_percent    DECIMAL(5,2)  NOT NULL DEFAULT 0;

-- subtotal: sum of line items before tax
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal       DECIMAL(10,2);

-- tax: actual tax rupee/currency amount
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax            DECIMAL(5,2)  NOT NULL DEFAULT 0;

-- total: final billable amount  (subtotal + tax)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total          DECIMAL(10,2);

-- line_items: JSONB cache of line item rows (source of truth is invoice_items table)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_items     JSONB         NOT NULL DEFAULT '[]'::jsonb;

-- sent_at: timestamp when invoice was emailed/shared
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at        TIMESTAMPTZ;

-- Back-fill subtotal / tax amount / total from existing `amount` rows
UPDATE invoices
SET
  subtotal = ROUND(
    amount / NULLIF(1 + tax_percent / 100.0, 0),
    2
  ),
  tax = ROUND(
    amount - amount / NULLIF(1 + tax_percent / 100.0, 0),
    2
  ),
  total = amount
WHERE total IS NULL;

-- Drop old status constraint and recreate with 'partial'
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue'));

-- ─────────────────────────────────────────────────────────────
--  INVOICE_ITEMS — normalised line items table
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID          NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT          NOT NULL,
  quantity    INTEGER       NOT NULL DEFAULT 1 CHECK (quantity > 0),
  rate        DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own invoice items" ON invoice_items;
CREATE POLICY "Users manage own invoice items" ON invoice_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
--  PAYMENTS — add paid_at alias, tighten precision
-- ─────────────────────────────────────────────────────────────
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
UPDATE payments SET paid_at = payment_date WHERE paid_at IS NULL AND payment_date IS NOT NULL;

-- amount precision: widen to DECIMAL(10,2) if stored as narrower type
-- (skip if column already exists with correct type — safe no-op on Supabase)

-- Remove old check and re-add to ensure it exists
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_check;
ALTER TABLE payments ADD CONSTRAINT payments_amount_check CHECK (amount > 0);

-- ─────────────────────────────────────────────────────────────
--  REMINDERS — ensure sent_at is nullable (already is)
-- ─────────────────────────────────────────────────────────────
-- No changes needed — existing schema is correct.

-- ─────────────────────────────────────────────────────────────
--  INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_status_due   ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at      ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_user ON payments(invoice_id, user_id);
