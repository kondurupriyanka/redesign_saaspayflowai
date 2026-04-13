import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchSettings,
  saveProfileSettings,
  savePaymentSettings,
  saveNotificationSettings,
  saveAvatarUrl,
  uploadAvatar,
  type SettingsRow,
} from '@/lib/api/settings';
import { UserCircle, Upload, Bell, Pencil, Smartphone, Building2, Globe, AlertCircle } from 'lucide-react';
import { OnboardingFlow } from '@/components/OnboardingFlow';

// ── helper: populate form state from a SettingsRow ─────────────────────────
function applyRow(row: SettingsRow, setters: ReturnType<typeof makeSetters>) {
  const pi = row.payment_info || {};
  setters.setBusinessName(row.business_name || '');
  setters.setFullName(row.name || '');
  setters.setPhone(row.phone || '');
  setters.setInvoicePrefix(row.invoice_prefix || 'PF');
  setters.setDefaultCurrency(row.default_currency || 'USD');
  setters.setDefaultTax((row.default_tax ?? 0).toString());
  setters.setNotifyViewed(row.notify_invoice_viewed ?? true);
  setters.setNotifyPayment(row.notify_payment_received ?? true);
  setters.setNotifyDigest(row.notify_daily_digest ?? false);
  setters.setReminderDays((row.reminder_days ?? 3).toString());
  setters.setUpiId(pi.upi_id || '');
  setters.setUpiName(pi.upi_name || '');
  setters.setBankName(pi.bank_name || '');
  setters.setAccountName(pi.account_name || '');
  setters.setAccountNumber(pi.account_number || '');
  setters.setIfsc(pi.ifsc || '');
  setters.setAccountType(pi.account_type || '');
  setters.setPaypalEmail(pi.paypal_email || '');
}

// Tiny helper so we can pass all setters as one object
function makeSetters(args: {
  setBusinessName: React.Dispatch<React.SetStateAction<string>>;
  setFullName: React.Dispatch<React.SetStateAction<string>>;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  setInvoicePrefix: React.Dispatch<React.SetStateAction<string>>;
  setDefaultCurrency: React.Dispatch<React.SetStateAction<string>>;
  setDefaultTax: React.Dispatch<React.SetStateAction<string>>;
  setNotifyViewed: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifyPayment: React.Dispatch<React.SetStateAction<boolean>>;
  setNotifyDigest: React.Dispatch<React.SetStateAction<boolean>>;
  setReminderDays: React.Dispatch<React.SetStateAction<string>>;
  setUpiId: React.Dispatch<React.SetStateAction<string>>;
  setUpiName: React.Dispatch<React.SetStateAction<string>>;
  setBankName: React.Dispatch<React.SetStateAction<string>>;
  setAccountName: React.Dispatch<React.SetStateAction<string>>;
  setAccountNumber: React.Dispatch<React.SetStateAction<string>>;
  setIfsc: React.Dispatch<React.SetStateAction<string>>;
  setAccountType: React.Dispatch<React.SetStateAction<string>>;
  setPaypalEmail: React.Dispatch<React.SetStateAction<string>>;
}) {
  return args;
}

export const Settings = () => {
  const { profile, refreshProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditBusiness, setShowEditBusiness] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Local avatar preview (shows immediately after file pick)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  // avatar_url from DB (persisted)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // ── Profile fields ──────────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('PF');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [defaultTax, setDefaultTax] = useState('0');

  // ── Payment info fields ─────────────────────────────────────────────────────
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [accountType, setAccountType] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // ── Notification fields ─────────────────────────────────────────────────────
  const [notifyViewed, setNotifyViewed] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [reminderDays, setReminderDays] = useState('3');

  // ── Inline validation errors ────────────────────────────────────────────────
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // email shown in disabled field — from auth context (not re-fetched)
  const userEmail = profile?.email || '';

  const setters = makeSetters({
    setBusinessName, setFullName, setPhone, setInvoicePrefix,
    setDefaultCurrency, setDefaultTax, setNotifyViewed, setNotifyPayment,
    setNotifyDigest, setReminderDays, setUpiId, setUpiName, setBankName,
    setAccountName, setAccountNumber, setIfsc, setAccountType, setPaypalEmail,
  });

  // ── On mount: fetch settings from DB — single source of truth ──────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchSettings();
        if (cancelled) return;
        applyRow(row, setters);
        setAvatarUrl(row.avatar_url || null);
      } catch (err: any) {
        console.error('[Settings] Failed to load settings from DB:', err.message);
        // Fallback to auth context profile if API fails
        if (profile) {
          applyRow({
            ...profile,
            invoice_prefix: profile.invoice_prefix ?? null,
            default_currency: profile.default_currency ?? null,
            default_tax: profile.default_tax ?? null,
            notify_invoice_viewed: profile.notify_invoice_viewed ?? null,
            notify_payment_received: profile.notify_payment_received ?? null,
            notify_daily_digest: profile.notify_daily_digest ?? null,
            reminder_days: profile.reminder_days ?? null,
            payment_info: (profile as any).payment_info ?? null,
          } as SettingsRow, setters);
          setAvatarUrl(profile.avatar_url || null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — fetch once on mount only

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    const errs: Record<string, string> = {};
    if (phone.trim()) {
      const digits = phone.replace(/[\s\-\+\(\)]/g, '');
      if (!/^\d{10,15}$/.test(digits)) {
        errs.phone = 'Phone must be 10–15 digits (numbers only)';
      }
    }
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }
    setProfileErrors({});
    setIsSaving(true);
    try {
      const saved = await saveProfileSettings({
        business_name: businessName,
        full_name: fullName,
        phone,
        invoice_prefix: invoicePrefix,
        default_currency: defaultCurrency,
        default_tax: parseFloat(defaultTax) || 0,
      });
      // Update local state from the returned DB row — no refreshProfile needed
      setBusinessName(saved.business_name || '');
      setFullName(saved.name || '');
      setPhone(saved.phone || '');
      setInvoicePrefix(saved.invoice_prefix || 'PF');
      setDefaultCurrency(saved.default_currency || 'USD');
      setDefaultTax((saved.default_tax ?? 0).toString());
      // Sync auth context in background so nav/header shows updated name
      refreshProfile().catch(() => {});
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save payment info ───────────────────────────────────────────────────────
  const handleSavePaymentInfo = async () => {
    const errors: Record<string, string> = {};

    if (upiId.trim() && !upiId.includes('@')) {
      errors.upiId = 'UPI ID must be in the format yourname@bank';
    }
    const bankFilled = [accountName, bankName, accountNumber, ifsc].map(v => v.trim()).filter(Boolean);
    if (bankFilled.length > 0 && bankFilled.length < 4) {
      if (!accountName.trim()) errors.accountName = 'Account holder name is required';
      if (!bankName.trim())    errors.bankName    = 'Bank name is required';
      if (!accountNumber.trim()) errors.accountNumber = 'Account number is required';
      if (!ifsc.trim())        errors.ifsc        = 'IFSC / SWIFT code is required';
    }
    if (paypalEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail.trim())) {
      errors.paypalEmail = 'Enter a valid PayPal email address';
    }
    if (ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc.trim())) {
      errors.ifsc = 'IFSC must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g. HDFC0001234)';
    }
    if (Object.keys(errors).length > 0) {
      setPayErrors(errors);
      return;
    }

    setPayErrors({});
    setIsSaving(true);
    try {
      const pi = {
        upi_id: upiId.trim(),
        upi_name: upiName.trim(),
        bank_name: bankName.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        account_type: accountType.trim(),
        paypal_email: paypalEmail.trim(),
      };
      const saved = await savePaymentSettings(pi);
      // Update local state from DB response — no refreshProfile needed
      const savedPi = saved.payment_info || {};
      setUpiId(savedPi.upi_id || '');
      setUpiName(savedPi.upi_name || '');
      setBankName(savedPi.bank_name || '');
      setAccountName(savedPi.account_name || '');
      setAccountNumber(savedPi.account_number || '');
      setIfsc(savedPi.ifsc || '');
      setAccountType(savedPi.account_type || '');
      setPaypalEmail(savedPi.paypal_email || '');
      toast.success('Payment info saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save payment info');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save notifications ──────────────────────────────────────────────────────
  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      const saved = await saveNotificationSettings({
        notify_invoice_viewed: notifyViewed,
        notify_payment_received: notifyPayment,
        notify_daily_digest: notifyDigest,
        reminder_days: parseInt(reminderDays) || 3,
      });
      // Update local state from DB response — no refreshProfile needed
      setNotifyViewed(saved.notify_invoice_viewed ?? true);
      setNotifyPayment(saved.notify_payment_received ?? true);
      setNotifyDigest(saved.notify_daily_digest ?? false);
      setReminderDays((saved.reminder_days ?? 3).toString());
      toast.success('Notification preferences saved');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save notifications');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Avatar upload ───────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show a local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);

    try {
      setIsSaving(true);
      const url = await uploadAvatar(file, profile?.id ?? '');
      const saved = await saveAvatarUrl(url);
      // Persist the real URL in local state
      setAvatarUrl(saved.avatar_url || url);
      setAvatarPreview(null);
      // Sync auth context so header avatar updates
      refreshProfile().catch(() => {});
      toast.success('Avatar updated');
    } catch (err: any) {
      setAvatarPreview(null);
      toast.error(err?.message || 'Failed to upload avatar');
    } finally {
      setIsSaving(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const displayAvatarUrl = avatarPreview || avatarUrl;

  return (
    <DashboardLayout pageTitle="Settings">
      {showEditBusiness && (
        <OnboardingFlow editMode onClose={() => setShowEditBusiness(false)} />
      )}

      <div className="flex flex-col mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-white/40 mt-1 text-sm">Manage your profile and notification preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="flex bg-[#0A0F0A] border border-white/5 h-12 rounded-xl p-1 gap-1 mb-10 w-full md:w-[480px]">
          <TabsTrigger
            value="profile"
            className="flex-1 rounded-lg data-[state=active]:bg-[#A3FF3F] data-[state=active]:text-[#0A0F0A] text-[#9CA3AF] font-medium text-xs transition-all"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="flex-1 rounded-lg data-[state=active]:bg-[#A3FF3F] data-[state=active]:text-[#0A0F0A] text-[#9CA3AF] font-medium text-xs transition-all"
          >
            Payment info
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex-1 rounded-lg data-[state=active]:bg-[#A3FF3F] data-[state=active]:text-[#0A0F0A] text-[#9CA3AF] font-medium text-xs transition-all"
          >
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* ── Payment info tab ── */}
        <TabsContent value="payment" className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center mb-2">
              <Smartphone className="w-4 h-4 mr-2.5 text-[#A3FF3F]" />
              UPI details
            </h2>
            <p className="text-xs text-white/40 mb-6">Your clients will see a QR code and UPI ID on the invoice page.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">UPI ID</Label>
                <Input
                  value={upiId}
                  onChange={e => { setUpiId(e.target.value); setPayErrors(p => ({ ...p, upiId: '' })); }}
                  placeholder="yourname@upi"
                  className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl ${payErrors.upiId ? 'border-red-500/50' : ''}`}
                />
                {payErrors.upiId && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{payErrors.upiId}</p>
                )}
              </div>
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">Display name (on QR)</Label>
                <Input value={upiName} onChange={e => setUpiName(e.target.value)} placeholder="Your Name / Business" className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center mb-2">
              <Building2 className="w-4 h-4 mr-2.5 text-[#A3FF3F]" />
              Bank details
            </h2>
            <p className="text-xs text-white/40 mb-6">For clients who prefer bank transfer. Leave blank if not applicable.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">Account holder name</Label>
                <Input
                  value={accountName}
                  onChange={e => { setAccountName(e.target.value); setPayErrors(p => ({ ...p, accountName: '' })); }}
                  placeholder="Full name"
                  className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl ${payErrors.accountName ? 'border-red-500/50' : ''}`}
                />
                {payErrors.accountName && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{payErrors.accountName}</p>}
              </div>
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">Bank name</Label>
                <Input
                  value={bankName}
                  onChange={e => { setBankName(e.target.value); setPayErrors(p => ({ ...p, bankName: '' })); }}
                  placeholder="HDFC, SBI, etc."
                  className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl ${payErrors.bankName ? 'border-red-500/50' : ''}`}
                />
                {payErrors.bankName && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{payErrors.bankName}</p>}
              </div>
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">Account number</Label>
                <Input
                  value={accountNumber}
                  onChange={e => { setAccountNumber(e.target.value); setPayErrors(p => ({ ...p, accountNumber: '' })); }}
                  placeholder="123456789012"
                  className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl ${payErrors.accountNumber ? 'border-red-500/50' : ''}`}
                />
                {payErrors.accountNumber && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{payErrors.accountNumber}</p>}
              </div>
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">IFSC / SWIFT code</Label>
                <Input
                  value={ifsc}
                  onChange={e => { setIfsc(e.target.value); setPayErrors(p => ({ ...p, ifsc: '' })); }}
                  placeholder="HDFC0001234"
                  className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl ${payErrors.ifsc ? 'border-red-500/50' : ''}`}
                />
                {payErrors.ifsc && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{payErrors.ifsc}</p>}
              </div>
              <div>
                <Label className="text-xs text-white/50 mb-1.5 block">Account type</Label>
                <Input value={accountType} onChange={e => setAccountType(e.target.value)} placeholder="Savings / Current" className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center mb-2">
              <Globe className="w-4 h-4 mr-2.5 text-[#A3FF3F]" />
              PayPal
            </h2>
            <p className="text-xs text-white/40 mb-6">Clients worldwide can pay via PayPal using your email address.</p>
            <div>
              <Label className="text-xs text-white/50 mb-1.5 block">PayPal email address</Label>
              <Input
                value={paypalEmail}
                onChange={e => { setPaypalEmail(e.target.value); setPayErrors(p => ({ ...p, paypalEmail: '' })); }}
                placeholder="you@paypal.com"
                type="email"
                className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl ${payErrors.paypalEmail ? 'border-red-500/50' : ''}`}
              />
              {payErrors.paypalEmail && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{payErrors.paypalEmail}</p>}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSavePaymentInfo}
              disabled={isSaving || isLoading}
              className="px-8 py-6 bg-[#A3FF3F] text-[#0A0F0A] font-bold rounded-xl hover:bg-[#8CE62E] active:scale-95 transition-all shadow-[0_0_20px_rgba(163,255,63,0.3)]"
            >
              {isSaving ? 'Saving…' : 'Save payment info'}
            </Button>
          </div>
        </TabsContent>

        {/* ── Profile tab ── */}
        <TabsContent value="profile" className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center mb-8">
              <UserCircle className="w-4 h-4 mr-2.5 text-[#A3FF3F]" />
              Profile
            </h2>

            {/* Business details shortcut */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div>
                <h3 className="text-sm font-medium text-white">Business details</h3>
                <p className="text-xs text-white/40 mt-0.5">
                  {businessName || 'No business name set yet'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-[#0A0F0A] border-white/10 hover:border-[#A3FF3F]/40 text-white/60 hover:text-white"
                onClick={() => setShowEditBusiness(true)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit business details
              </Button>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-[#0A0F0A] flex items-center justify-center border-2 border-white/10 overflow-hidden relative group cursor-pointer"
              >
                {displayAvatarUrl ? (
                  <img src={displayAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-10 h-10 text-white/20" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Profile photo</h3>
                <p className="text-sm text-white/40 mb-3">Recommended: 400×400 px. JPG, PNG, or GIF. Max 2 MB.</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#0A0F0A] border-white/10 hover:border-[#A3FF3F]/40"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  Upload avatar
                </Button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Business name</Label>
                <Input value={businessName} onChange={e => setBusinessName(e.target.value)} className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl focus:border-[#A3FF3F]/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Full name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl focus:border-[#A3FF3F]/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Email</Label>
                <Input value={userEmail} disabled className="bg-[#0A0F0A]/50 border-white/5 text-white/30 h-12 rounded-xl italic" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Phone number</Label>
                <Input
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setProfileErrors(p => ({ ...p, phone: '' })); }}
                  placeholder="+91 9876543210"
                  className={`bg-[#0A0F0A] border-white/5 h-12 rounded-xl placeholder-white/10 ${profileErrors.phone ? 'border-red-500/50' : ''}`}
                />
                {profileErrors.phone && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{profileErrors.phone}</p>
                )}
              </div>
            </div>

            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-5 pt-6 border-t border-white/5">Invoice defaults</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Invoice prefix</Label>
                <Input value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Default currency</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F1A12] border-white/5 text-white">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-white/50">Default tax (%)</Label>
                <Input value={defaultTax} onChange={e => setDefaultTax(e.target.value)} type="number" className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl" />
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || isLoading}
                className="px-8 py-6 bg-[#A3FF3F] text-[#0A0F0A] font-bold rounded-xl hover:bg-[#8CE62E] active:scale-95 transition-all shadow-[0_0_20px_rgba(163,255,63,0.3)]"
              >
                {isSaving ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ── Notifications tab ── */}
        <TabsContent value="notifications" className="space-y-8 animate-in fade-in duration-500">
          <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl">
            <h2 className="text-base font-semibold text-white flex items-center mb-8">
              <Bell className="w-4 h-4 mr-2.5 text-[#A3FF3F]" />
              Notifications
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-medium text-sm">Invoice viewed</h3>
                  <p className="text-sm text-white/40">Email me when a client opens an invoice link.</p>
                </div>
                <Switch checked={notifyViewed} onCheckedChange={setNotifyViewed} />
              </div>
              <hr className="border-white/5" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-medium text-sm">Payment received</h3>
                  <p className="text-sm text-white/40">Email me when an invoice is fully paid.</p>
                </div>
                <Switch checked={notifyPayment} onCheckedChange={setNotifyPayment} />
              </div>
              <hr className="border-white/5" />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-white font-medium text-sm">Daily digest</h3>
                  <p className="text-sm text-white/40">Get a morning summary of overdue items.</p>
                </div>
                <Switch checked={notifyDigest} onCheckedChange={setNotifyDigest} />
              </div>
              <hr className="border-white/5" />

              <div>
                <h3 className="text-white font-semibold text-sm mb-1">Auto-reminders</h3>
                <p className="text-sm text-white/40 mb-5">Send reminders automatically after the due date.</p>
                <div className="flex items-center gap-4 w-64">
                  <Input
                    value={reminderDays}
                    onChange={e => setReminderDays(e.target.value)}
                    type="number"
                    className="bg-[#0A0F0A] border-white/5 h-12 rounded-xl text-center font-bold"
                  />
                  <span className="text-sm text-white/40 shrink-0">days after due date</span>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <Button
                onClick={handleSaveNotifications}
                disabled={isSaving || isLoading}
                className="px-8 py-6 bg-[#A3FF3F] text-[#0A0F0A] font-bold rounded-xl hover:bg-[#8CE62E] active:scale-95 transition-all shadow-[0_0_20px_rgba(163,255,63,0.3)]"
              >
                {isSaving ? 'Saving…' : 'Save notifications'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};
