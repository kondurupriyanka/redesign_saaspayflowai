-- Run this in your Supabase SQL Editor to add settings fields to the users table
-- Adding profile and notification fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'PF',
ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS default_tax numeric(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_invoice_viewed boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_payment_received boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_daily_digest boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_days integer DEFAULT 3;
