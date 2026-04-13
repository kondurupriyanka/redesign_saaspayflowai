import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTASection = () => (
  <section className="py-24 md:py-32 px-6 relative overflow-hidden">
    {/* ── Flowing neon radial sweep background (BuildAI-inspired) ── */}
    <div className="absolute inset-0 pointer-events-none bg-cta-neon" />

    {/* Animated pulsing orbs for depth */}
    <div
      className="absolute top-16 right-12 w-80 h-80 rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, hsl(84 100% 62% / 0.12) 0%, hsl(84 100% 62% / 0.04) 40%, transparent 70%)',
        filter: 'blur(50px)',
        animation: 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
    <div
      className="absolute bottom-8 left-8 w-[420px] h-[420px] rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, hsl(84 100% 62% / 0.11) 0%, hsl(84 100% 62% / 0.03) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'pulse 7s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s',
      }}
    />
    
    {/* Additional accent orbs for depth */}
    <div
      className="absolute top-1/2 -left-32 w-72 h-72 rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, hsl(84 100% 62% / 0.08) 0%, transparent 70%)',
        filter: 'blur(45px)',
        animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s',
      }}
    />

    {/* Gradient border container card */}
    <div className="relative max-w-4xl mx-auto z-10 group">
      <div className="rounded-3xl p-px"
        style={{
          background: 'linear-gradient(160deg, hsl(84 100% 62% / 0.30) 0%, hsl(84 100% 62% / 0.08) 50%, transparent 100%)',
        }}>
        <div className="rounded-3xl bg-gradient-to-br from-[#080d08] to-[#050a05] backdrop-blur-md px-10 py-16 md:px-16 md:py-20 text-center space-y-12 relative overflow-hidden">
          {/* Subtle inner glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 600px 400px at 50% 50%, hsl(84 100% 62% / 0.1) 0%, transparent 60%)',
            }}
          />
          <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/15 border border-primary/30 text-primary caption-md hover:bg-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 relative z-20">
            <TrendingUp className="w-4 h-4" />
            Join 5,000+ successful professionals
          </div>

          <h2 className="display-lg relative z-20">
            Stop chasing payments.
            <br />
            <span className="text-gradient">Automate collections.</span>
          </h2>

          <p className="body-lg text-muted-foreground max-w-3xl mx-auto relative z-20">
            Intelligent payment collection powered by adaptive reminders. Faster cash flow. Better client relationships. Zero manual follow-ups.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8 relative z-20">
            <Link
              to="/auth"
              className="btn-micro inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-3 rounded-full heading-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95"
            >
              Start free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn-micro inline-flex items-center gap-2 border-2 border-white/20 text-foreground px-10 py-3 rounded-full heading-sm transition-all duration-300 hover:border-primary/60 hover:bg-white/5 hover:text-primary hover:shadow-lg hover:shadow-primary/10"
            >
              See how it works
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
