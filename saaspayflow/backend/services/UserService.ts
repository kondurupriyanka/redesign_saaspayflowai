// ============= USER SERVICE =============

import { query } from '../database/db.js';
import { User } from '../database/types.js';
import { SUBSCRIPTION_PLANS, TRIAL_DURATION_DAYS, isOwner } from '../config/billing.js';

export class UserService {
  static async createUser(
    id: string,
    email: string,
    name: string | null = null
  ): Promise<User> {
    const trial_end = new Date();
    trial_end.setDate(trial_end.getDate() + TRIAL_DURATION_DAYS);

    const result = await query(
      `INSERT INTO users (id, email, name, business_name, onboarding_completed, plan, trial_end, is_owner)
       VALUES ($1, $2, $3, NULL, false, 'free', $4, $5)
       RETURNING *`,
      [id, email, name, trial_end.toISOString(), isOwner(email)]
    );

    if (!result.rows[0]) throw new Error('Failed to create user');
    return result.rows[0];
  }

  static async getUserById(userId: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    return result.rows[0] || null;
  }

  static async updateUserPlan(
    userId: string,
    plan: 'free' | 'pro' | 'growth'
  ): Promise<User> {
    const result = await query(
      `UPDATE users SET plan = $1, trial_end = NULL, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [plan, userId]
    );
    if (!result.rows[0]) throw new Error('Failed to update user plan');
    return result.rows[0];
  }

  static canPerformAction(
    userPlan: string,
    action: string,
    isOwnerUser = false
  ): boolean {
    if (isOwnerUser || userPlan === 'owner') return true;

    const plan = SUBSCRIPTION_PLANS[userPlan as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) return false;

    const actionFeatureMap: Record<string, keyof typeof plan.features> = {
      'add-client': 'maxClients',
      'ai-reminder': 'aiReminders',
      'recurring-invoice': 'recurringInvoices',
      'client-portal': 'clientPortal',
      'email-notification': 'emailNotifications',
      'advanced-analytics': 'advancedAnalytics',
      'whatsapp-support': 'whatsappSupport',
    };

    const requiredFeature = actionFeatureMap[action];
    return requiredFeature ? Boolean(plan.features[requiredFeature]) : false;
  }
}
