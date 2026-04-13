-- Migration to add onboarding columns to the users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS business_name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_completed);
