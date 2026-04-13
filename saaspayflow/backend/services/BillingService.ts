import crypto from 'crypto';
import { query } from '../database/db.js';
import { SUBSCRIPTION_PLANS } from '../config/billing.js';

type PlanId = 'free' | 'pro' | 'growth';

const PADDLE_API_BASE =
  process.env.PADDLE_ENV === 'live'
    ? 'https://api.paddle.com'
    : 'https://sandbox-api.paddle.com';

interface PaddleTransactionResponse {
  error?: { detail?: string };
  data?: { id?: string; checkout?: { url?: string } };
}

export class BillingService {
  static async createCheckout(userId: string, email: string, planId: PlanId) {
    if (planId === 'free') {
      throw new Error('Free plan does not require checkout');
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan?.paddleProductId) {
      throw new Error(`Paddle product is not configured for plan: ${planId}`);
    }

    if (!process.env.PADDLE_API_KEY) {
      throw new Error('Missing PADDLE_API_KEY');
    }

    const response = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{ price_id: plan.paddleProductId, quantity: 1 }],
        customer: { email },
        custom_data: { userId, planId },
      }),
    });

    const body = (await response.json()) as PaddleTransactionResponse;
    if (!response.ok) {
      throw new Error(body?.error?.detail || 'Failed to create Paddle checkout transaction');
    }

    return {
      transactionId: body?.data?.id,
      checkoutUrl: body?.data?.checkout?.url,
    };
  }

  static verifyWebhookSignature(rawBody: string, signatureHeader?: string) {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!secret || !signatureHeader) return false;

    try {
      const parts = signatureHeader.split(';');
      const tsPart = parts.find(p => p.startsWith('ts='));
      const hPart = parts.find(p => p.startsWith('h='));
      if (!tsPart || !hPart) return false;

      const ts = tsPart.split('=')[1];
      const hToken = hPart.split('=')[1];
      const stringToSign = `${ts}:${rawBody}`;
      const expected = crypto.createHmac('sha256', secret).update(stringToSign).digest('hex');
      if (expected.length !== hToken.length) return false;
      return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hToken));
    } catch (e) {
      console.error('Webhook signature verification failed:', e);
      return false;
    }
  }

  static async handleWebhook(event: any) {
    const eventType = event?.event_type;
    const data = event?.data || {};
    const customData = data?.custom_data || {};
    const userId = customData?.userId || data?.custom_data?.user_id;
    const eventId = event?.event_id;

    if (!userId) {
      console.warn('Webhook received without userId in custom_data', eventId);
      return;
    }

    if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
      const planId = customData?.planId || this.planFromPriceId(data?.items?.[0]?.price?.id);
      const status = data?.status === 'active' ? 'active' : (data?.status === 'past_due' ? 'past_due' : 'cancelled');
      const nextBillingDate = data?.next_billing_period?.start;
      const paddleCustomerId = data?.customer_id;
      await this.upsertSubscription(userId, planId as PlanId, status as any, data?.id, paddleCustomerId, nextBillingDate, eventId);
    }

    if (eventType === 'subscription.canceled') {
      await this.upsertSubscription(userId, 'free', 'cancelled', data?.id, null, null, eventId);
    }
  }

  static async upsertSubscription(
    userId: string,
    plan: PlanId,
    status: 'active' | 'cancelled' | 'past_due',
    externalSubscriptionId: string | null,
    paddleCustomerId?: string | null,
    nextBillingDate?: string | null,
    lastEventId?: string | null
  ) {
    const now = new Date().toISOString();

    await query(
      `INSERT INTO subscriptions
         (user_id, plan, status, provider, provider_subscription_id, paddle_customer_id, next_billing_date, last_event_id, updated_at)
       VALUES ($1, $2, $3, 'paddle', $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         plan = EXCLUDED.plan, status = EXCLUDED.status,
         provider_subscription_id = EXCLUDED.provider_subscription_id,
         paddle_customer_id = EXCLUDED.paddle_customer_id,
         next_billing_date = EXCLUDED.next_billing_date,
         last_event_id = EXCLUDED.last_event_id,
         updated_at = EXCLUDED.updated_at`,
      [userId, plan, status, externalSubscriptionId, paddleCustomerId, nextBillingDate, lastEventId, now]
    );

    await query(
      `UPDATE users SET plan = $1, updated_at = $2 WHERE id = $3`,
      [plan, now, userId]
    );

    if (plan !== 'free' && status === 'active') {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data, is_read)
         VALUES ($1, 'system', $2, $3, $4, false)`,
        [
          userId,
          'Welcome to Pro!',
          `You have successfully upgraded to the ${plan} plan. Your premium features are now active.`,
          JSON.stringify({ plan, subscription_id: externalSubscriptionId }),
        ]
      );
    }
  }

  static async getUserSubscription(userId: string) {
    const result = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  private static planFromPriceId(priceId?: string): PlanId {
    if (!priceId) return 'free';
    if (priceId === SUBSCRIPTION_PLANS.growth.paddleProductId) return 'growth';
    if (priceId === SUBSCRIPTION_PLANS.pro.paddleProductId) return 'pro';
    return 'free';
  }
}
