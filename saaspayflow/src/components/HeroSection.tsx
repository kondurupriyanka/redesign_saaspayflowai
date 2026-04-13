import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import HeroDashboard from './HeroDashboard';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background image with dark overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&h=900&fit=crop)',
            opacity: 0.10,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
      </div>

      {/* ── Layered radial depth glows with enhanced intensity ── */}

      {/* Large centered hero glow — primary depth (strongest) */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 85% 75% at 50% 42%, hsl(84 100% 62% / 0.15) 0%, hsl(84 100% 62% / 0.05) 50%, transparent 70%)',
          transform: `translateY(${scrollY * 0.25}px)`,
        }}
      />
      
      {/* Bottom-left accent orb — stronger glow */}
      <div
        className="absolute bottom-0 left-0 w-[800px] h-[600px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 75% 65% at -5% 100%, hsl(84 100% 62% / 0.08) 0%, transparent 75%)',
          transform: `translateY(${scrollY * 0.15}px)`,
          filter: 'blur(35px)',
        }}
      />
      
      {/* Top-right accent orb — enhanced */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[500px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 110% 5%, hsl(84 100% 62% / 0.07) 0%, transparent 75%)',
          transform: `translateY(${scrollY * 0.1}px)`,
          filter: 'blur(30px)',
        }}
      />
      
      {/* Subtle mid-center second glow layer */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 50%, hsl(84 100% 62% / 0.08) 0%, transparent 65%)',
          transform: `translateY(${scrollY * 0.2}px)`,
          filter: 'blur(25px)',
        }}
      />

      {/* Top-center accent for extra depth */}
      <div
        className="absolute -top-32 left-1/3 w-[600px] h-[400px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 65% 55% at 50% 0%, hsl(84 100% 62% / 0.06) 0%, transparent 75%)',
          transform: `translateY(${scrollY * 0.18}px)`,
          filter: 'blur(40px)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-36 grid lg:grid-cols-2 gap-16 items-center z-10">
        {/* Left content */}
        <div className="space-y-10">
          <Badge className="bg-[#86EFAC]/10 border border-[#86EFAC]/25 rounded-full px-6 py-2.5 tracking-wide hover:bg-[#86EFAC]/15 transition-all duration-300 hover:shadow-lg hover:shadow-[#86EFAC]/15 text-[#b1ff3de6] font-semibold rounded-tl-[9989px] rounded-tr-[9989px] rounded-br-[9989px] rounded-bl-[9989px] pl-[15px] pr-[15px] text-[16px]">
            <BadgeCheck className="w-4 h-4 mr-2 shrink-0" />
            Built for freelancers to get paid faster
          </Badge>

          <h1 className="display-lg">
            Get paid on time
            <br />
            <span className="text-gradient">without chasing</span>
            <br />
            clients
          </h1>

          <p className="body-lg text-muted-foreground max-w-2xl">
            Intelligent payment reminders with adaptive messaging. From gentle nudges to firm follow-ups—automatically timed for maximum collection rates.
          </p>

          <div className="flex flex-wrap gap-4 pt-8">
            <Link
              to="/auth"
              className="btn-micro inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full heading-sm hover:shadow-lg hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Start free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="btn-micro inline-flex items-center gap-2 border-2 border-white/20 text-foreground px-8 py-3 rounded-full heading-sm hover:bg-white/5 hover:border-primary/60 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
            >
              See how it works
            </button>
          </div>
        </div>

        {/* Right dashboard preview */}
        <div
          className="relative"
          style={{ transform: `translateY(${scrollY * -0.08}px)` }}
        >
          <HeroDashboard />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
