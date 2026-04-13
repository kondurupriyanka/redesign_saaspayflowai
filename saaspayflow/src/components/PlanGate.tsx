import React from 'react';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { canAccessFeature } from '@/lib/access';

interface PlanGateProps {
  children: React.ReactNode;
  feature: 'ai_reminders' | 'ai_extraction' | 'analytics_advanced' | 'client_portal_advanced' | 'growth_insights';
  showOverlay?: boolean;
}

export const PlanGate: React.FC<PlanGateProps> = ({ children, feature, showOverlay = true }) => {
  const { plan, isOwner } = usePlan();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isOwner) {
    return <>{children}</>;
  }

  let isLocked = false;

  isLocked = !canAccessFeature(feature, plan, user?.email || '');

  if (!isLocked) {
    return <>{children}</>;
  }

  if (!showOverlay) {
    return null;
  }

  return (
    <div className="relative group/gate overflow-hidden rounded-2xl transition-all duration-300">
      {/* Blurred content */}
      <div className="filter blur-[6px] grayscale pointer-events-none select-none opacity-40 transition-all duration-300 scale-[1.02]">
        {children}
      </div>

      {/* Modern Upgrade Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-[#0F1A12]/95 border border-[#A3FF3F]/30 backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_50px_rgba(163,255,63,0.15)] ring-1 ring-white/10 max-w-[320px] transform transition-transform group-hover/gate:scale-110">
          <div className="w-16 h-16 rounded-2xl bg-[#A3FF3F]/10 flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
            <Lock className="w-8 h-8 text-[#A3FF3F]" />
            <div className="absolute -top-1 -right-1">
               <Star className="w-4 h-4 text-[#A3FF3F] animate-pulse" />
            </div>
          </div>
          
          <h4 className="text-xl font-bold text-white mb-2 leading-tight">Unlock Professional Tools</h4>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">
            This feature is exclusively available on <span className="text-[#A3FF3F]">Pro</span> & <span className="text-[#A3FF3F]">Growth</span> plans. Grow your business with AI.
          </p>
          
          <Button 
            onClick={() => navigate('/settings?tab=billing')}
            className="w-full h-12 bg-[#A3FF3F] hover:bg-[#b8ff5c] text-[#0A0F0A] font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-[#A3FF3F]/20"
          >
            Upgrade Now
          </Button>
          
          <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Start a 14-day free trial today
          </p>
        </div>
      </div>
    </div>
  );
};
