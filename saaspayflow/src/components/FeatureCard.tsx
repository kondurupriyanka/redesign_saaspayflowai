import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => (
  /* Gradient-border wrapper with enhanced glow system */
  <div className="card-glow-border rounded-2xl p-px group h-full">
    <div className="rounded-2xl bg-gradient-to-br from-[#0f1a0f] to-[#080d08] backdrop-blur-sm p-8 md:p-10 h-full flex flex-col relative overflow-hidden">
      {/* Subtle background glow that activates on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'radial-gradient(circle 300px at 50% 50%, hsl(84 100% 62% / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Icon wrapper with enhanced gradient background */}
      <div className="feature-icon-bg w-16 h-16 rounded-xl border border-primary/25 flex items-center justify-center mb-8 group-hover:scale-120 transition-all duration-400 relative z-10">
        <Icon className="w-8 h-8 text-primary group-hover:text-primary transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors duration-300 leading-snug">{title}</h3>
        <p className="text-sm text-white/55 leading-relaxed flex-1">{description}</p>
      </div>

      {/* Accent line on hover */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 w-full" />
    </div>
  </div>
);

export default FeatureCard;
