// Owner bypass — unlimited access to all features, no plan restrictions
export const OWNER_EMAILS = new Set([
  'priyankakonduru267@gmail.com',
  'kondurupriyanka2003@gmail.com',
  'kondurupriyanak2003@gmail.com',
  'kondurupriyanka8@gmail.com',
  'kondurupriyanka58@gmail.com',
]);

export const isOwnerAccount = (email: string): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.has(email.trim().toLowerCase());
};

// Plan client limits: Free=2, Pro=20, Growth=50
export const getClientLimit = (plan: string, email: string): number => {
  if (isOwnerAccount(email)) return Infinity;
  if (plan === 'growth') return 50;
  if (plan === 'pro') return 20;
  return 2;
};

export const canAccessFeature = (
  feature: string,
  plan: string,
  email: string,
  context?: { clientCount?: number; activeInvoiceCount?: number }
) => {
  if (isOwnerAccount(email)) return true;

  switch (feature) {
    case 'client_creation':
      return (context?.clientCount ?? 0) < getClientLimit(plan, email);
    case 'invoice_creation':
      if (plan === 'free') {
        return (context?.activeInvoiceCount ?? 0) < 1;
      }
      return true;
    case 'ai_reminders':
    case 'ai_extraction':
    case 'client_portal_advanced':
      return plan === 'pro' || plan === 'growth';
    case 'analytics_advanced':
      return plan !== 'free';
    case 'growth_insights':
      return plan === 'growth';
    case 'invoices_unlimited':
      return plan !== 'free';
    case 'manual_reminders':
      return true;
    default:
      return false;
  }
};
