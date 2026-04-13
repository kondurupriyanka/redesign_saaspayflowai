import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { fetchInvoices } from '@/lib/api/invoices';
import { fetchClients } from '@/lib/api/clients';
import { getSubscription } from '@/lib/api/billing';
import { CreditCard, Shield, TrendingUp, Users, FileText } from 'lucide-react';

export default function Billing() {
  const { user } = useAuth();
  const { plan, limits } = usePlan();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: invoices } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: fetchClients });
  const { data: subscription } = useQuery({ queryKey: ['subscription'], queryFn: getSubscription });

  const currentClientsCount = (clients || []).length;
  const activeInvoicesCount = (invoices || []).filter(inv =>
    ['draft', 'sent', 'overdue'].includes(inv.status.toLowerCase())
  ).length;
  const invoiceHistory = useMemo(() => (invoices || []).slice(0, 6), [invoices]);

  const currentPlan = subscription?.plan || plan;
  const isFreePlan = currentPlan === 'free';
  const nextBillingDate = subscription?.next_billing_date
    ? format(new Date(subscription.next_billing_date), 'dd MMM yyyy')
    : null;

  const usagePct = (used: number, max: number) =>
    max === Infinity ? Math.min(used * 12, 100) : Math.min((used / max) * 100, 100);

  const handleUpgrade = (planId: 'pro' | 'growth') => {
    if (!(window as any).Paddle) {
      toast.info('Paddle checkout will be enabled when your live keys are configured.');
      return;
    }
    (window as any).Paddle.Checkout.open({
      settings: { displayMode: 'overlay', theme: 'dark', allowLogout: false },
      items: [{ priceId: planId === 'pro' ? 'paddle_pro_monthly' : 'paddle_growth_monthly', quantity: 1 }],
      customerEmail: user?.email,
      customData: { user_id: user?.id, plan_name: planId },
    });
  };

  const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Pro', growth: 'Growth' };

  return (
    <DashboardLayout pageTitle="Billing">
      <div className="space-y-6 max-w-4xl">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Billing &amp; Plan</h1>
          <p className="text-white/40 mt-1 text-sm">Manage your subscription, usage, and billing history.</p>
        </div>

        {/* Current plan card */}
        <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 pb-8 border-b border-white/[0.06]">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-[#A3FF3F]" />
                Your plan
              </h2>
              <p className="text-white/40 text-sm">Active subscription details</p>
            </div>
            <div className="inline-flex items-center gap-2 bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 px-4 py-2 rounded-xl">
              <Shield className="w-3.5 h-3.5 text-[#A3FF3F]" />
              <span className="text-[#A3FF3F] font-semibold text-[11px] uppercase tracking-widest">
                {PLAN_LABEL[currentPlan] ?? currentPlan}
              </span>
            </div>
          </div>

          {/* Billing notice — upgrade temporarily disabled */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-3">Online billing</p>
            <h3 className="text-base font-semibold text-white mb-2">Subscription management coming soon</h3>
            <p className="text-sm text-white/50 leading-relaxed max-w-lg">
              Online plan upgrades and billing management are being set up. Your current plan is fully active and all features are available. Please check back soon.
            </p>
          </div>

          {false && isFreePlan ? (
            /* ── Free plan upgrade prompt (hidden until billing is live) ── */
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <p className="text-[10px] text-[#A3FF3F] uppercase tracking-widest font-semibold mb-3">Upgrade path</p>
                <h3 className="text-lg font-bold text-white mb-3">Free plan is active</h3>
                <p className="text-sm text-white/60 leading-relaxed max-w-md">
                  You can manage up to 2 clients on Free. Upgrade to Pro to unlock unlimited invoices, or Growth for the full feature set.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => handleUpgrade('pro')} className="bg-[#A3FF3F] text-[#0A0F0A] font-bold hover:bg-[#b8ff5c]">
                    Upgrade to Pro — $29/mo
                  </Button>
                  <Button onClick={() => handleUpgrade('growth')} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Upgrade to Growth — $49/mo
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-[#0A0F0A] p-6">
                <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-4">Free plan includes</p>
                <ul className="space-y-3 text-sm text-white/60">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />Up to 2 clients</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />Basic invoicing</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />Manual reminders</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />Limited dashboard insights</li>
                </ul>
              </div>
            </div>
          ) : false ? (
            /* ── Paid plan details (hidden until billing is live) ── */
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                {/* Billing stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0A0F0A] p-4">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-2">Next billing</p>
                    <p className="text-sm font-semibold text-white">{nextBillingDate ?? 'Via Paddle'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0A0F0A] p-4">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-2">Amount</p>
                    <p className="text-sm font-semibold text-white">
                      {currentPlan === 'growth' ? '$49' : '$29'} / mo
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0A0F0A] p-4">
                    <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-2">Payment method</p>
                    <p className="text-sm font-semibold text-white">•••• 4242</p>
                  </div>
                </div>

                {/* Usage */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#0A0F0A] p-5">
                  <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-4">Usage</p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                        <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> Clients</span>
                        <span>{currentClientsCount} / {limits.maxClients === Infinity ? '∞' : limits.maxClients}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-[#A3FF3F] rounded-full transition-all" style={{ width: `${usagePct(currentClientsCount, limits.maxClients)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
                        <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Active invoices</span>
                        <span>{activeInvoicesCount} / {limits.maxInvoices === Infinity ? '∞' : limits.maxInvoices}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full bg-[#A3FF3F] rounded-full transition-all" style={{ width: `${usagePct(activeInvoicesCount, limits.maxInvoices)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription actions */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-4">Subscription</p>
                  <div className="flex flex-col gap-3">
                    <a
                      href="#paddle-portal"
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      Manage subscription
                    </a>
                    <button
                      onClick={() => setShowCancelDialog(true)}
                      className="text-sm text-white/35 hover:text-white/70 transition-colors text-left"
                    >
                      Cancel plan
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-[#0A0F0A] p-5">
                  <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold mb-2">Status</p>
                  <p className="text-sm text-white/70 capitalize">{subscription?.status ?? 'active'} · Paddle</p>
                  <p className="mt-1.5 text-xs text-white/30 leading-relaxed">Details update automatically when Paddle webhooks are live.</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Billing history */}
        <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#A3FF3F]" />
              <h2 className="text-sm font-semibold text-white">Billing history</h2>
            </div>
            <p className="text-xs text-white/35 mt-0.5">Invoice date, plan, amount, and status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">Date</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">Plan</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">Amount</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">Status</th>
                  <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-white/30">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoiceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-white/30">
                      No billing history yet. Your invoices will appear here.
                    </td>
                  </tr>
                ) : invoiceHistory.map(inv => (
                  <tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white/50">{format(new Date(inv.created_at ?? Date.now()), 'dd MMM yyyy')}</td>
                    <td className="px-6 py-4 text-sm text-white/70 capitalize">{currentPlan}</td>
                    <td className="px-6 py-4 text-sm text-white/70 font-mono">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'USD', maximumFractionDigits: 0 }).format(Number(inv.amount || 0))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a href={`#download-${inv.id}`} className="text-[#A3FF3F] hover:text-[#b8ff5c] text-sm font-medium transition-colors">
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="border-white/10 bg-[#0F1A12] text-white">
          <DialogHeader>
            <DialogTitle className="text-white font-bold">Cancel subscription?</DialogTitle>
            <DialogDescription className="text-white/50 text-sm">
              Cancelling stops future charges. You keep access until the current billing period ends.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => setShowCancelDialog(false)}>
              Keep plan
            </Button>
            <Button className="bg-red-500 text-white hover:bg-red-600" onClick={() => { setShowCancelDialog(false); toast.info('Cancellation flow will connect to Paddle when live.'); }}>
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
