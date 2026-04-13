import { Star } from 'lucide-react';

interface TestimonialCardProps {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  delay?: number;
}

const TestimonialCard = ({ name, role, avatar, quote, delay = 0 }: TestimonialCardProps) => (
  <div
    className="rounded-[16px] border border-border bg-card p-5 hover:glow-green transition-all duration-300 hover:-translate-y-1"
    style={{ animationDelay: `${delay}s` }}
  >
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
      ))}
    </div>
    <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{quote}"</p>
    <div className="flex items-center gap-3">
      <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover" />
      <div>
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
);

export default TestimonialCard;
