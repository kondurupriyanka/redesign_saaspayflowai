import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PricingCard from './PricingCard';
import { Shield, CreditCard, BadgeDollarSign } from 'lucide-react';
import { createCheckout } from '@/lib/api/billing';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuthHook';

type Currency = 'usd' | 'inr';
type PlanKey = 'free' | 'pro' | 'growth';

const pricing = {
  usd: {
    free: { monthly: '$0', yearly: '$0', annualBilled: '$0' },
    pro: { monthly: '$29', yearly: '$23', annualBilled: '$276' },
    growth: { monthly: '$49', yearly: '$39', annualBilled: '$469' },
  },
  inr: {
    free: { monthly: '₹0', yearly: '₹0', annualBilled: '₹0' },
    pro: { monthly: '₹1,999', yearly: '₹1,599', annualBilled: '₹19,188' },
    growth: { monthly: '₹3,999', yearly: '₹3,199', annualBilled: '₹38,388' },
  },
} satisfies Record<Currency, Record<PlanKey, { monthly: string; yearly: string; annualBilled: string }>>;

const paddlePriceIds: Record<Currency, Record<PlanKey, { monthly: string; yearly: string }>> = {
  usd: {
    free: { monthly: 'free-usd-monthly', yearly: 'free-usd-yearly' },
    pro: { monthly: 'pro-usd-monthly', yearly: 'pro-usd-yearly' },
    growth: { monthly: 'growth-usd-monthly', yearly: 'growth-usd-yearly' },
  },
  inr: {
    free: { monthly: 'free-inr-monthly', yearly: 'free-inr-yearly' },
    pro: { monthly: 'pro-inr-monthly', yearly: 'pro-inr-yearly' },
    growth: { monthly: 'growth-inr-monthly', yearly: 'growth-inr-yearly' },
  },
};

const PaymentIcons = () => (
  <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
    {['Visa', 'Mastercard', 'PayPal'].map((label) => (
      <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
        <BadgeDollarSign className="h-4 w-4 text-primary" />
        {label}
      </span>
    ))}
  </div>
);

const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [currency, setCurrency] = useState<Currency>('usd');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const { ref, isVisible } = useScrollAnimation();
  const p = pricing[currency];
  const isOwner = profile?.is_owner === true;

  const handleCheckout = async (planId: PlanKey) => {
    if (isOwner) {
      navigate('/dashboard');
      return;
    }
    if (planId === 'free' || !isAuthenticated) {
      navigate('/auth');
      return;
    }
    try {
      setIsCheckingOut(true);
      const checkout = await createCheckout(planId as 'pro' | 'growth');
      if (checkout.checkoutUrl) {
        window.location.href = checkout.checkoutUrl;
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <section id="pricing" className="scroll-mt-24 py-28 md:py-36 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-16 text-center">
          <p className="caption-lg text-primary mb-5">Pricing</p>
          <h2 className="display-lg mb-6">
            Simple pricing, <span className="text-gradient">powerful results</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-3">
            Start free. Scale at your pace.
          </p>
          <p className="text-base text-white/40 font-medium">Cancel anytime. No hidden fees.</p>
        </div>

        {/* Toggle + Currency row */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-14 flex-wrap">
          {/* Monthly / Yearly tab toggle */}
          <div className="relative flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              data-testid="toggle-monthly"
              onClick={() => setIsYearly(false)}
              className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                !isYearly
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              data-testid="toggle-yearly"
              onClick={() => setIsYearly(true)}
              className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                isYearly
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors duration-300 ${
                isYearly ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
              }`}>
                Save 20%
              </span>
            </button>
          </div>

          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger data-testid="select-currency" className="w-32 h-11 rounded-full border-white/20 bg-white/5 text-sm font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD ($)</SelectItem>
              <SelectItem value="inr">INR (₹)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards */}
        <div className={`grid md:grid-cols-3 gap-10 max-w-6xl mx-auto mb-12 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <PricingCard
            planId="free"
            name="Free"
            price={p.free.monthly}
            yearlyPrice={p.free.yearly}
            period="month"
            billingNote={isYearly ? `Billed ${p.free.annualBilled}/yr` : 'Billed monthly'}
            description="Try it out with 2 clients"
            isYearly={isYearly}
            cta="Get started free"
            ctaHref="/auth"
            paddlePriceId={isYearly ? paddlePriceIds[currency].free.yearly : paddlePriceIds[currency].free.monthly}
            upgradeNote="Upgrade to unlock AI reminders"
            showDiscount={false}
            onCtaClick={handleCheckout}
            features={[
              'Up to 2 clients',
              'Basic invoicing',
              'Manual payment reminders',
              'Basic dashboard',
              '1 active invoice at a time',
            ]}
          />
          <PricingCard
            planId="pro"
            name="Pro"
            price={p.pro.monthly}
            yearlyPrice={p.pro.yearly}
            period="month"
            billingNote={isYearly ? `Billed ${p.pro.annualBilled}/yr` : 'Billed monthly'}
            description="For freelancers earning consistently"
            isYearly={isYearly}
            highlighted
            badge="Most Popular"
            cta="Get started"
            ctaHref="#paddle-checkout"
            paddlePriceId={isYearly ? paddlePriceIds[currency].pro.yearly : paddlePriceIds[currency].pro.monthly}
            showDiscount={true}
            onCtaClick={handleCheckout}
            features={[
              'Up to 15 clients',
              'AI-powered payment reminders',
              'Smart follow-ups (auto-send)',
              'Payment tracking dashboard',
              'Client portal access',
              'Recurring invoices',
              'Unlimited invoices',
              'Email notifications',
              'Basic insights (paid vs pending)',
            ]}
          />
          <PricingCard
            planId="growth"
            name="Growth"
            price={p.growth.monthly}
            yearlyPrice={p.growth.yearly}
            period="month"
            billingNote={isYearly ? `Billed ${p.growth.annualBilled}/yr` : 'Billed monthly'}
            description="For managing multiple clients"
            isYearly={isYearly}
            cta="Get started"
            ctaHref="#paddle-checkout"
            paddlePriceId={isYearly ? paddlePriceIds[currency].growth.yearly : paddlePriceIds[currency].growth.monthly}
            showDiscount={true}
            onCtaClick={handleCheckout}
            features={[
              'Everything in Pro',
              'Up to 50 clients',
              'Advanced AI tone adaptation',
              'Smart retry logic',
              'Payment behavior insights',
              'Revenue forecasting',
              'Priority support',
              'Client payment history',
            ]}
          />
        </div>

        <PaymentIcons />

        {isCheckingOut && (
          <p className="text-center text-sm text-muted-foreground mb-8 mt-6">Creating secure checkout...</p>
        )}

        {/* Trust strip */}
        <div className="flex items-center justify-center gap-10 flex-wrap mt-10">
          <span className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Shield className="w-5 h-5 text-primary" /> No credit card required
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <CreditCard className="w-5 h-5 text-primary" /> Cancel anytime
          </span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Shield className="w-5 h-5 text-primary" /> No hidden fees
          </span>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
