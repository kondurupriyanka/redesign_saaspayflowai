import { FilePlus, CalendarCheck, BellRing, BadgeDollarSign } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const steps = [
  {
    icon: FilePlus,
    title: "Send invoices in seconds",
    description: "Create a professional invoice and send it to your client instantly.",
  },
  {
    icon: CalendarCheck,
    title: "Set clear payment terms",
    description: "Define due dates and payment expectations upfront — no confusion.",
  },
  {
    icon: BellRing,
    title: "Automatic reminders sent",
    description: "PayFlow AI follows up on your behalf, so you never have to chase.",
  },
  {
    icon: BadgeDollarSign,
    title: "Get paid without chasing",
    description: "Watch payments arrive on time. Zero manual follow-ups needed.",
  },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="how-it-works" className="scroll-mt-20 relative py-28 md:py-36 px-6 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(84 100% 62% / 0.055) 0%, transparent 70%)',
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20">
          <p className="caption-lg text-primary mb-4">How it works</p>
          <h2 className="display-md mb-6">
            Four steps to <span className="text-gradient">effortless payments</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-2xl">
            From invoice to payment — fully automated, no chasing required.
          </p>
        </div>

        <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          {steps.map((step, i) => (
            <div key={i} className="group relative flex flex-col">
              {/* Connector line between cards (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[3.75rem] left-[calc(100%+0px)] w-8 h-px bg-gradient-to-r from-primary/40 to-transparent z-20" />
              )}

              <div className="card-glow-border rounded-2xl p-px h-full">
                <div className="relative h-full rounded-2xl bg-gradient-to-br from-[#0f1a0f] to-[#080d08] p-8 flex flex-col gap-6 overflow-hidden">
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle 200px at 50% 0%, hsl(84 100% 62% / 0.09) 0%, transparent 70%)' }}
                  />

                  {/* Step number badge */}
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shrink-0">
                    <step.icon className="w-7 h-7 text-primary" strokeWidth={1.75} />
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-white leading-snug group-hover:text-primary transition-colors duration-300">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/55 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
