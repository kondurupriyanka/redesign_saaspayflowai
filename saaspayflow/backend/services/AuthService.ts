// ============= AUTH SERVICE =============
// User profile reads/writes go to Replit PostgreSQL.
// JWT verification stays in the auth middleware (Supabase).

import { query } from '../database/db.js';
import { isOwner, TRIAL_DURATION_DAYS } from '../config/billing.js';

interface SyncPayload {
  id: string;
  email: string;
  name?: string | null;
}

export class AuthService {
  /**
   * Sync authenticated user into our local users table.
   * Safe to call on every login (upsert).
   */
  static async syncUserFromSupabase(payload: SyncPayload) {
    const ownerFlag = isOwner(payload.email);
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

    const result = await query(
      `INSERT INTO users (id, email, name, business_name, onboarding_completed, plan, trial_end, is_owner)
       VALUES ($1, $2, $3, NULL, false, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         is_owner = CASE WHEN EXCLUDED.is_owner THEN true ELSE users.is_owner END,
         plan = CASE WHEN EXCLUDED.is_owner THEN 'growth' ELSE users.plan END,
         updated_at = NOW()
       RETURNING *`,
      [
        payload.id,
        payload.email,
        payload.name || null,
        ownerFlag ? 'growth' : 'free',
        trialEnd.toISOString(),
        ownerFlag,
      ]
    );

    if (!result.rows[0]) throw new Error('Failed to sync user profile');
    return result.rows[0];
  }

  /**
   * Get user profile from local PostgreSQL.
   */
  static async getUserProfile(userId: string) {
    const result = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update user profile fields in local PostgreSQL.
   */
  static async updateProfile(
    userId: string,
    updates: {
      name?: string;
      phone?: string;
      businessName?: string;
      avatarUrl?: string;
      invoicePrefix?: string;
      defaultCurrency?: string;
      defaultTax?: number;
      onboardingCompleted?: boolean;
      notifyInvoiceViewed?: boolean;
      notifyPaymentReceived?: boolean;
      notifyDailyDigest?: boolean;
      reminderDays?: number;
      paymentInfo?: Record<string, string>;
    }
  ) {
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];

    const fieldMap: Record<string, string> = {
      name: 'name',
      phone: 'phone',
      businessName: 'business_name',
      avatarUrl: 'avatar_url',
      invoicePrefix: 'invoice_prefix',
      defaultCurrency: 'default_currency',
      defaultTax: 'default_tax',
      onboardingCompleted: 'onboarding_completed',
      notifyInvoiceViewed: 'notify_invoice_viewed',
      notifyPaymentReceived: 'notify_payment_received',
      notifyDailyDigest: 'notify_daily_digest',
      reminderDays: 'reminder_days',
    };

    if (updates.paymentInfo !== undefined) {
      params.push(JSON.stringify(updates.paymentInfo));
      setClauses.push(`payment_info = $${params.length}`);
    }

    for (const [key, col] of Object.entries(fieldMap)) {
      if (key in updates && (updates as any)[key] !== undefined) {
        params.push((updates as any)[key]);
        setClauses.push(`${col} = $${params.length}`);
      }
    }

    params.push(userId);
    const result = await query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (!result.rows[0]) throw new Error('Failed to update profile');
    return result.rows[0];
  }
}
