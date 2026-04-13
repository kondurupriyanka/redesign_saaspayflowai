import { cn } from "@/lib/utils";

interface GlowWrapperProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'green' | 'overdue';
}

const GlowWrapper = ({ children, className, variant = 'green' }: GlowWrapperProps) => (
  <div className={cn(
    "relative rounded-[20px] p-px",
    variant === 'green' && "bg-gradient-to-b from-primary/30 to-primary/5",
    variant === 'overdue' && "bg-gradient-to-b from-overdue/30 to-overdue/5",
    className
  )}>
    <div className="rounded-[19px] bg-card h-full">
      {children}
    </div>
  </div>
);

export default GlowWrapper;
