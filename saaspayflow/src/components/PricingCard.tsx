import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  planId: 'free' | 'pro' | 'growth';
  price: string;
  yearlyPrice?: string;
  period: string;
  billingNote?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  isYearly: boolean;
  badge?: string;
  upgradeNote?: string;
  showDiscount?: boolean;
  ctaHref?: string;
  paddlePriceId?: string;
  onCtaClick?: (planId: 'free' | 'pro' | 'growth') => void;
}

const PricingCard = ({
  name,
  planId,
  price,
  yearlyPrice,
  period,
  billingNote,
  description,
  features,
  highlighted,
  cta,
  isYearly,
  badge,
  upgradeNote,
  showDiscount = true,
  ctaHref = '#paddle-checkout',
  paddlePriceId,
  onCtaClick,
}: PricingCardProps) => {
  const displayPrice = isYearly && yearlyPrice ? yearlyPrice : price;

  return (
    <div className={`rounded-2xl p-px h-full group overflow-visible ${highlighted ? 'card-glow-border-highlight' : 'card-glow-border'}`}>
      <div className={`relative rounded-2xl p-8 md:p-10 flex flex-col h-full overflow-visible ${
        highlighted ? 'bg-gradient-to-br from-[#0d1408] to-[#0a0d08]' : 'bg-gradient-to-br from-[#0f1410] to-[#080a08]'
      }`}>
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle 400px at 50% 50%, hsl(84 100% 62% / ${highlighted ? '0.12' : '0.06'}) 0%, transparent 70%)`,
          }}
        />

        {badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide shadow-lg shadow-primary/30 z-20 whitespace-nowrap">
            {badge}
          </div>
        )}

        {/* Plan name + description */}
        <div className="mb-10 relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{name}</h3>
          <p className="text-sm text-white/50 leading-relaxed">{description}</p>
        </div>

        {/* Price */}
        <div className="mb-10 relative z-10">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl font-extrabold tracking-tight leading-none">{displayPrice}</span>
            <span className="text-base text-muted-foreground">/{isYearly ? 'mo' : period}</span>
          </div>
          {billingNote && <p className="text-sm text-white/40 mt-1">{billingNote}</p>}
          {isYearly && yearlyPrice && showDiscount && price !== '$0' && price !== '₹0' && (
            <p className="text-sm text-primary font-semibold mt-1">Save 20% with yearly billing</p>
          )}
        </div>

        {/* CTA Button */}
        <a
          href={ctaHref}
          data-testid={`btn-cta-${planId}`}
          data-paddle-price-id={paddlePriceId}
          onClick={(e) => {
            if (onCtaClick) {
              e.preventDefault();
              onCtaClick(planId);
            }
          }}
          className={`text-center py-4 px-6 rounded-full font-bold text-base mb-10 block transition-all duration-300 relative z-10 ${
            highlighted
              ? 'bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.03] active:scale-[0.98]'
              : 'bg-white/10 border border-white/25 text-white hover:bg-white/15 hover:border-white/40 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {cta}
        </a>

        {/* Feature list */}
        <div className="space-y-4 flex-1 relative z-10">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${
                highlighted ? 'bg-primary/30' : 'bg-white/10'
              }`}>
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[15px] text-white/60 leading-relaxed">{f}</span>
            </div>
          ))}
        </div>

        {upgradeNote && (
          <p className="mt-10 text-sm text-white/40 border-t border-white/10 pt-6 relative z-10">{upgradeNote}</p>
        )}
      </div>
    </div>
  );
};

export default PricingCard;
