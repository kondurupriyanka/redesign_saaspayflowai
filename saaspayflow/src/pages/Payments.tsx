import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { CreditCard, TrendingUp, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  payment_date: string;
  reference: string | null;
  invoice_id: string;
  invoice_number?: string;
  client_name?: string;
}

interface PendingClientPayment {
  id: string;
  invoice_id: string;
  amount: number;
  method: string;
  reference: string | null;
  status: 'pending' | 'confirmed';
  created_at: string;
  invoice_number?: string;
  client_name?: string;
}

const METHOD_LABEL: Record<string, string> = {
  manual: 'Manual',
  bank: 'Bank transfer',
  bank_transfer: 'Bank transfer',
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
  cheque: 'Cheque',
  portal: 'Client portal',
  other: 'Other',
};

const STATUS_CLS: Record<string, string> = {
  completed: 'bg-[#A3FF3F]/10 text-[#A3FF3F]',
  pending:   'bg-amber-500/10 text-amber-400',
  confirmed: 'bg-[#A3FF3F]/10 text-[#A3FF3F]',
  failed:    'bg-red-500/10 text-red-400',
  cancelled: 'bg-white/5 text-white/30',
};

function fmt(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function apiReq<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error || `Request failed (${res.status})`);
  return body as T;
}

export default function Payments() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['all-payments'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load payments');
      const data = await res.json();
      return (data || []).map((p: any) => ({
        ...p,
        amount: Number(p.amount),
        invoice_number: p.invoices?.invoice_number ?? p.invoice_number,
        client_name: p.invoices?.clients?.name ?? p.client_name ?? '—',
      }));
    },
    enabled: !!user,
  });

  const { data: pendingPayments = [], isLoading: pendingLoading } = useQuery<PendingClientPayment[]>({
    queryKey: ['pending-client-payments'],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) return [];
      const res = await fetch('/api/payments/pending-client', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data || []).map((p: any) => ({ ...p, amount: Number(p.amount) }));
    },
    enabled: !!user,
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) => {
      return apiReq(`/invoices/${invoiceId}/pending-payments/${paymentId}/confirm`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success('Payment confirmed');
      qc.invalidateQueries({ queryKey: ['pending-client-payments'] });
      qc.invalidateQueries({ queryKey: ['all-payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
    onError: () => toast.error('Failed to confirm payment'),
  });

  const confirmedPayments = payments.filter(p => p.status === 'completed' || p.status === 'confirmed');
  const totalReceived = confirmedPayments.reduce((s, p) => s + Number(p.amount), 0);
  const pendingCount = pendingPayments.filter(p => p.status === 'pending').length;

  return (
    <DashboardLayout pageTitle="Payments">
      <div className="space-y-6">

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#A3FF3F]/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-[#A3FF3F]" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-0.5">Total received</p>
              <p className="text-2xl font-black text-white tracking-tight">{fmt(totalReceived)}</p>
            </div>
          </div>
          <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-0.5">Transactions</p>
              <p className="text-2xl font-black text-white">{confirmedPayments.length}</p>
            </div>
          </div>
          <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-white/40" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-0.5">Awaiting review</p>
              <p className="text-2xl font-black text-white">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Pending client payments */}
        {(pendingPayments.filter(p => p.status === 'pending').length > 0 || pendingLoading) && (
          <div className="bg-[#0C1610] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.07] flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/50" />
              <h2 className="text-sm font-semibold text-white">Pending confirmations from clients</h2>
              <span className="ml-auto text-xs text-white/30">Review and confirm each payment</span>
            </div>
            {pendingLoading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white/40" />
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {pendingPayments.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-white">{fmt(p.amount)}</span>
                        <span className="text-xs text-white/30">·</span>
                        <span className="text-xs text-white/50 capitalize">{METHOD_LABEL[p.method] ?? p.method}</span>
                      </div>
                      <p className="text-xs text-white/40">
                        {p.client_name && <><span className="text-white/60">{p.client_name}</span> · </>}
                        {p.invoice_number && <span className="font-mono">{p.invoice_number}</span>}
                        {p.reference && <span> · Ref: {p.reference}</span>}
                      </p>
                      <p className="text-xs text-white/25 mt-0.5">{format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <button
                      onClick={() => confirmMutation.mutate({ invoiceId: p.invoice_id, paymentId: p.id })}
                      disabled={confirmMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A3FF3F] text-[#0A0F0A] text-xs font-bold hover:bg-[#b8ff5c] disabled:opacity-50 transition-all shrink-0"
                    >
                      {confirmMutation.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <CheckCircle2 className="w-3.5 h-3.5" />}
                      Confirm
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment history */}
        <div className="bg-[#0C1610] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07]">
            <h2 className="text-sm font-semibold text-white">Payment history</h2>
          </div>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : !confirmedPayments.length ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-white/60 font-medium">No payments yet</p>
                <p className="text-white/30 text-sm mt-1">Confirmed payments will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Date</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Client</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Invoice</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Method</th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-white/30">Status</th>
                    <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-white/30">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedPayments.map(p => (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-sm text-white/50 whitespace-nowrap">
                        {p.payment_date ? format(new Date(p.payment_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/80 font-medium">{p.client_name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-white/50 font-mono">{p.invoice_number ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-white/50">{METHOD_LABEL[p.method] ?? p.method}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${STATUS_CLS[p.status] ?? 'bg-white/5 text-white/30'}`}>
                          {p.status === 'completed' ? 'Completed' : p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white text-right">{fmt(Number(p.amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
