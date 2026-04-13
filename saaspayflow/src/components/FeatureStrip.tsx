import { FileText, Wallet, Receipt } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const items = [
  { icon: FileText, title: "Invoicing", description: "Professional invoices that clients take seriously." },
  { icon: Wallet, title: "Payment Tracking", description: "Know exactly who paid and who's late." },
  { icon: Receipt, title: "Expense Management", description: "Track project costs and maintain profitability." },
];

const FeatureStrip = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-24 md:py-32 px-6 relative overflow-hidden" ref={ref}>
      {/* Background image with dark overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&h=900&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.06,
        }}
      />
      {/* Radial depth glow */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse 55% 60% at 0% 50%, hsl(84 100% 62% / 0.07) 0%, transparent 70%)',
      }} />
      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 z-0" style={{
        background: 'linear-gradient(135deg, rgba(3,10,4,0.7) 0%, rgba(3,10,4,0.5) 50%, rgba(3,10,4,0.8) 100%)',
      }} />

      <div className={`max-w-7xl mx-auto grid md:grid-cols-3 gap-12 relative z-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {items.map((item, i) => (
          <div key={i} className="group flex items-start gap-6 hover:translate-x-1 transition-transform duration-300">
            <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary/25 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
              <item.icon className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">{item.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureStrip;
