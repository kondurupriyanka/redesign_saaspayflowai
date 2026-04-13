import { apiRequest } from './client';

export async function createCheckout(plan: 'pro' | 'growth') {
  return apiRequest<{ transactionId: string; checkoutUrl: string }>('/billing/checkout', 'POST', { plan });
}

export async function getSubscription() {
  return apiRequest<{
    plan: 'free' | 'pro' | 'growth';
    status: string;
    next_billing_date?: string | null;
    provider?: string | null;
    provider_subscription_id?: string | null;
    paddle_customer_id?: string | null;
  }>('/billing/subscription');
}
