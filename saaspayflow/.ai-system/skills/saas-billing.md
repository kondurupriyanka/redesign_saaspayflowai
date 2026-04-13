---
name: saas-billing
description: Paddle integration and subscription billing patterns
---

# SaaS Billing with Paddle

Integrate Paddle for payments, subscriptions, and billing in PayFlow.

## Paddle Setup

**Never store card data** — Paddle handles everything.

```typescript
// ✅ Initialize Paddle SDK
import Paddle from '@paddle/paddle-js';

const paddle = Paddle.initialize({
  token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  environment: 'production',
});
```

## Pricing Models

For PayFlow, consider:

1. **Freemium**: Free tier (5 invoices/month) + Pro ($29/mo, unlimited)
2. **Usage-based**: Base plan + per-invoice charge after limit
3. **Flat tier**: Free / Pro / Enterprise with feature gates

```typescript
// ✅ Define pricing tiers
const PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    invoices_per_month: 5,
    features: ['Basic invoicing', 'Email templates'],
  },
  pro: {
    name: 'Pro',
    price: 2900, // cents
    invoices_per_month: null, // unlimited
    features: [
      'Unlimited invoices',
      'Client portal',
      'Payment reminders',
      'Analytics',
      'API access',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: null, // custom
    invoices_per_month: null,
    features: ['Everything in Pro', 'Priority support', 'Custom integrations'],
  },
};
```

## Customer Creation

```typescript
// ✅ Create customer in Paddle when user signs up
async function createPaddleCustomer(user: User) {
  const response = await fetch('https://api.paddle.com/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      custom_data: {
        user_id: user.id, // Link back to our system
      },
    }),
  });

  const customer = await response.json();
  
  // Store Paddle customer ID
  await db.users.update(user.id, {
    paddle_customer_id: customer.data.id,
  });

  return customer.data;
}
```

## Subscription Endpoint

```typescript
// ✅ Create checkout for subscription
async function createCheckout(userId: string, tier: 'pro' | 'enterprise') {
  const user = await db.users.findById(userId);
  
  const checkout = await paddle.Checkout.create({
    items: [
      {
        priceId: process.env[`PADDLE_PRICE_ID_${tier.toUpperCase()}`],
      },
    ],
    customer: {
      email: user.email,
      id: user.paddle_customer_id, // Link to customer
    },
    customData: {
      user_id: userId,
    },
  });

  return checkout;
}
```

## Webhooks (Revenue Events)

```typescript
// ✅ Listen for Paddle webhooks
async function handlePaddleWebhook(req: Request) {
  const event = req.body;

  switch (event.type) {
    case 'subscription.created':
      await handleSubscriptionCreated(event);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(event);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(event);
      break;
    case 'transaction.completed':
      await handlePaymentCompleted(event);
      break;
    case 'transaction.failed':
      await handlePaymentFailed(event);
      break;
  }

  return { success: true };
}

async function handleSubscriptionCreated(event: PaddleEvent) {
  const { custom_data, id } = event.data;
  
  await db.users.update(custom_data.user_id, {
    paddle_subscription_id: id,
    subscription_tier: 'pro',
    subscription_status: 'active',
  });

  // Send welcome email
  await emailService.send({
    to: user.email,
    template: 'subscription_welcome',
  });
}
```

## Feature Gates

```typescript
// ✅ Check subscription tier to enable features
async function canSendReminder(userId: string): Promise<boolean> {
  const user = await db.users.findById(userId);
  
  // Free tier: 1 reminder/month
  // Pro tier: unlimited
  if (user.subscription_tier !== 'pro') {
    const count = await db.activityLogs.count({
      where: {
        user_id: userId,
        action: 'invoice_reminder_sent',
        created_at: { gte: startOfMonth(new Date()) },
      },
    });
    return count < 1;
  }

  return true;
}

// ✅ Middleware to enforce limits
const checkFeatureAccess = async (req, res, next) => {
  const canAccess = await canSendReminder(req.user.id);
  if (!canAccess) {
    return res.status(429).json({
      error: 'Upgrade to Pro to send unlimited reminders',
    });
  }
  next();
};

router.post('/api/invoices/:id/reminder', checkFeatureAccess, (req, res) => {
  // Send reminder
});
```

## Beta Pricing / Coupons

```typescript
// ✅ Apply coupon/discount
async function applyPromoCode(userId: string, code: string) {
  const promo = await db.promos.findOne({ code, active: true });
  if (!promo) throw new BadRequestError('Invalid code');
  if (promo.max_uses && promo.uses >= promo.max_uses) {
    throw new BadRequestError('Code expired');
  }

  await db.users.update(userId, {
    promo_code: code,
    discount_pct: promo.discount_pct,
  });
}
```

## Billing Portal

```typescript
// ✅ Link to Paddle billing portal
async function getBillingPortalUrl(userId: string) {
  const user = await db.users.findById(userId);
  
  const portal = await paddle.Customer.createBillingPortalSession(
    user.paddle_customer_id
  );

  return portal.urls.general;
}
```
