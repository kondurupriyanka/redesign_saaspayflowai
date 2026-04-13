// ============= PADDLE BILLING CONFIGURATION =============

export const PADDLE_CONFIG = {
  API_KEY: process.env.PADDLE_API_KEY,
  WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
  ENV: (process.env.PADDLE_ENV || 'sandbox') as 'sandbox' | 'live',
};

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    paddleProductId: null, // No Paddle product for free plan
    features: {
      maxClients: 2,
      aiReminders: false,
      recurringInvoices: false,
      clientPortal: false,
      emailNotifications: false,
      advancedAnalytics: false,
      whatsappSupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    currency: 'USD',
    paddleProductId: process.env.PADDLE_PRO_PRODUCT_ID, // Set in .env
    features: {
      maxClients: 15,
      aiReminders: true,
      recurringInvoices: true,
      clientPortal: true,
      emailNotifications: true,
      advancedAnalytics: false,
      whatsappSupport: false,
    },
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 49,
    currency: 'USD',
    paddleProductId: process.env.PADDLE_GROWTH_PRODUCT_ID, // Set in .env
    features: {
      maxClients: 50,
      aiReminders: true,
      recurringInvoices: true,
      clientPortal: true,
      emailNotifications: true,
      advancedAnalytics: true,
      whatsappSupport: true,
    },
  },
};

// Trial duration (days)
export const TRIAL_DURATION_DAYS = 7;

// Owner bypass — these accounts have unlimited access to all features
export const OWNER_EMAILS = new Set([
  'priyankakonduru267@gmail.com',
  'kondurupriyanka2003@gmail.com',
  'kondurupriyanak2003@gmail.com',
  'kondurupriyanka8@gmail.com',
  'kondurupriyanka58@gmail.com',
]);
export const isOwner = (email: string) => OWNER_EMAILS.has(email.trim().toLowerCase());
