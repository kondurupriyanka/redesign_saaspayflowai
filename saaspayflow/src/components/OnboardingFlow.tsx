import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { updateProfileSettings } from '@/lib/api/settings';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  /** When true, show as an edit modal (called from Settings) — skip visibility guard */
  editMode?: boolean;
  onClose?: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ editMode = false, onClose }) => {
  const navigate = useNavigate();
  const { profile, refreshProfile, isLoading: authLoading } = useAuth();
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Visibility guard (only for first-time flow, not edit mode) ──────────
  // Wait for auth to finish loading so we never flash the modal
  if (!editMode) {
    if (authLoading) return null;
    if (!profile) return null;
    if (profile.onboarding_completed === true) return null;
  }

  const validate = () => {
    if (!businessName.trim()) {
      setError('Please enter your business name to continue.');
      return false;
    }
    setError('');
    return true;
  };

  const handleComplete = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await updateProfileSettings({
        businessName: businessName.trim(),
        onboardingCompleted: true,
      });
      await refreshProfile();

      if (!editMode) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#A3FF3F', '#10b981', '#3b82f6'] });
        toast.success("You're all set! Welcome to PayFlow.");
        navigate('/dashboard');
      } else {
        toast.success('Business details updated.');
        onClose?.();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      await updateProfileSettings({ onboardingCompleted: true });
      await refreshProfile();
      toast.success('Setup skipped. You can update your business details in Settings anytime.');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to skip. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0C1610] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* Progress bar — only for first-time flow */}
        {!editMode && (
          <div className="h-1 w-full bg-white/5">
            <div className="h-full bg-[#A3FF3F] w-full transition-all duration-500" />
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#A3FF3F]/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#A3FF3F]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editMode ? 'Edit business details' : "What's your business name?"}
                </h2>
                <p className="text-sm text-white/40 mt-0.5">
                  {editMode
                    ? 'Update your business name used on invoices and reminders.'
                    : "We'll use it on invoices, reminders, and the client portal."}
                </p>
              </div>
            </div>
            {editMode && onClose && (
              <button onClick={onClose} className="p-1.5 hover:bg-white/8 rounded-lg transition-colors shrink-0 mt-0.5">
                <X className="w-4 h-4 text-white/40" />
              </button>
            )}
          </div>

          {/* Business name input */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="businessName" className="text-sm text-white/60">
              Business or freelance name
            </Label>
            <Input
              id="businessName"
              placeholder="e.g. Acme Design Studio"
              value={businessName}
              onChange={(e) => { setBusinessName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleComplete(); }}
              className={`bg-[#0A0F0A] border-white/10 text-white text-base py-6 focus:border-[#A3FF3F]/50 transition-colors ${error ? 'border-red-500/50' : ''}`}
              autoFocus
              disabled={isSaving}
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleComplete}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#A3FF3F] hover:bg-[#b8ff5c] text-[#0A0F0A] font-bold rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:grayscale"
            >
              {isSaving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : editMode
                  ? 'Save changes'
                  : <><span>Continue to dashboard</span><ArrowRight className="w-4 h-4" /></>
              }
            </button>

            {!editMode && (
              <button
                onClick={handleSkip}
                disabled={isSaving}
                className="w-full py-3 text-sm text-white/35 hover:text-white/60 transition-colors"
              >
                Skip setup for now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
