import { Zap, FileCheck, BarChart3, Users, Repeat2, LineChart } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import FeatureCard from './FeatureCard';

const features = [
  {
    icon: Zap,
    title: "Smart Payment Reminders",
    description: "Adaptive reminders with perfect timing and tone — sent automatically so you never have to follow up.",
  },
  {
    icon: FileCheck,
    title: "Professional Invoicing",
    description: "Create branded invoices in seconds. Auto-fill client details and send with one click.",
  },
  {
    icon: BarChart3,
    title: "Payment Dashboard",
    description: "See all outstanding, overdue, and paid invoices at a glance with real-time status updates.",
  },
  {
    icon: Users,
    title: "Client Portal",
    description: "Clients get their own space to view invoices and pay — reducing back-and-forth for you.",
  },
  {
    icon: Repeat2,
    title: "Recurring Billing",
    description: "Set up retainer invoices once. PayFlow sends them automatically every billing cycle.",
  },
  {
    icon: LineChart,
    title: "Cash Flow Analytics",
    description: "Spot payment patterns, forecast income, and identify your fastest-paying clients.",
  },
];

const FeaturesGrid = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="features" className="scroll-mt-20 relative py-24 md:py-32 px-6 overflow-hidden" ref={ref}>
      {/* Section depth glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 85% 55% at 50% -5%, hsl(84 100% 62% / 0.065) 0%, transparent 75%)',
      }} />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20">
          <p className="caption-lg text-primary mb-4">Features</p>
          <h2 className="display-lg mb-8">
            Everything you need to <span className="text-gradient">get paid</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl">Everything a freelancer needs — from sending the first invoice to getting paid on time, automatically.</p>
        </div>

        <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-10 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
