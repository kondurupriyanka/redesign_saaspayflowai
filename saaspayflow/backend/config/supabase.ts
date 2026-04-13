// ============= SUPABASE CONFIG =============
// Supabase is used ONLY for JWT verification in auth middleware.
// All database queries use the Replit PostgreSQL directly via backend/database/db.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && serviceRoleKey) {
  _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
} else {
  console.warn('[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — JWT auth will be unavailable');
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return _supabaseAdmin;
}

// Used only for verifying JWTs in the auth middleware
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

export const supabase = supabaseAdmin;

export type Database = any;
