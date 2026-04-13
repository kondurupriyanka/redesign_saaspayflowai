import logoImage from '@/assets/logo.png';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
}

const SIZE_MAP: Record<LogoSize, { icon: string; payflow: string; ai: string; gap: string }> = {
  sm: { icon: 'h-9 w-9',                   payflow: 'text-base',        ai: 'text-base',        gap: 'gap-2.5' },
  md: { icon: 'h-11 w-11',                  payflow: 'text-xl',          ai: 'text-xl',          gap: 'gap-3'   },
  lg: { icon: 'h-14 w-14 md:h-16 md:w-16', payflow: 'text-2xl md:text-3xl', ai: 'text-2xl md:text-3xl', gap: 'gap-3.5' },
};

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const styles = SIZE_MAP[size];

  return (
    <div className={cn('inline-flex items-center shrink-0', showText ? styles.gap : '', className)}>
      <div className={cn(
        'inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0',
        'bg-black border border-[#A3FF3F]/30 shadow-[0_0_20px_rgba(163,255,63,0.2)]',
        styles.icon
      )}>
        <img
          src={logoImage}
          alt="PayFlow AI logo"
          className="h-full w-full object-contain p-0.5"
        />
      </div>

      {showText && (
        <div className="flex items-baseline leading-none tracking-tight">
          <span className={cn('font-extrabold text-white', styles.payflow)}>
            PayFlow
          </span>
          <span className={cn('font-extrabold text-[#A3FF3F] ml-1', styles.ai)}>
            AI
          </span>
        </div>
      )}
    </div>
  );
}

export default Logo;
