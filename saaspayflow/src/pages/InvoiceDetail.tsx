import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, differenceInDays } from 'date-fns';
import {
  AlertCircle, ArrowLeft, CheckCircle2, Loader2, Send, CreditCard,
  Bell, Receipt, X, MessageSquare, Clock, CalendarClock, Activity,
  Copy, Check, ExternalLink, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchInvoiceById, updateInvoiceStatus,
  fetchInvoiceMessages, sendFreelancerMessage,
  fetchPendingPayments, confirmInvoicePayment,
  fetchInvoiceRequests, updateRequestStatus,
  fetchInvoiceActivity, sendInvoice,
  type InvoiceMessage, type InvoicePayment, type InvoiceRequest, type ActivityEvent,
} from '@/lib/api/invoices';
import { createPayment, fetchInvoicePayments } from '@/lib/api/payments';
import { SendReminderModal } from '@/components/SendReminderModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getInvoiceStatus, getStatusColor, statusLabel } from '@/lib/invoiceStatus';

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  created:           <Receipt className="w-3.5 h-3.5" />,
  sent:              <Send className="w-3.5 h-3.5" />,
  reminder:          <Bell className="w-3.5 h-3.5" />,
  payment_requested: <Clock className="w-3.5 h-3.5 text-white/50" />,
  payment_confirmed: <CheckCircle2 className="w-3.5 h-3.5 text-[#A3FF3F]" />,
  message:           <MessageSquare className="w-3.5 h-3.5 text-white/50" />,
  request:           <CalendarClock className="w-3.5 h-3.5 text-white/50" />,
};

const ACTIVITY_LABELS: Record<string, string> = {
  created:           'Invoice created',
  sent:              'Invoice sent to client',
  reminder:          'Reminder sent',
  payment_requested: 'Client submitted payment',
  payment_confirmed: 'Payment confirmed',
  message:           'Message received',
  request:           'Client request',
};

function fmt(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-[#A3FF3F] transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-[#A3FF3F]" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0F1A12] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#A3FF3F]/10 flex items-center justify-center text-[#A3FF3F] shrink-0">
          {icon}
        </div>
        <span className="text-sm font-bold text-white flex-1 text-left">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-medium">{count}</span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
      </button>
      {open && <div className="border-t border-white/[0.05] px-5 pb-5 pt-4 space-y-3">{children}</div>}
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const { data: invoice, isLoading, error, refetch } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => fetchInvoiceById(id || ''),
    enabled: !!user && !!id,
    retry: 1,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', 'invoice', id],
    queryFn: () => fetchInvoicePayments(id || ''),
    enabled: !!user && !!id,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery<InvoiceMessage[]>({
    queryKey: ['invoice-messages', id],
    queryFn: () => fetchInvoiceMessages(id || ''),
    enabled: !!user && !!id,
    refetchInterval: 30000,
  });

  const { data: pendingPayments = [], refetch: refetchPending } = useQuery<InvoicePayment[]>({
    queryKey: ['pending-payments', id],
    queryFn: () => fetchPendingPayments(id || ''),
    enabled: !!user && !!id,
  });

  const { data: requests = [], refetch: refetchRequests } = useQuery<InvoiceRequest[]>({
    queryKey: ['invoice-requests', id],
    queryFn: () => fetchInvoiceRequests(id || ''),
    enabled: !!user && !!id,
  });

  const { data: activity = [] } = useQuery<ActivityEvent[]>({
    queryKey: ['invoice-activity', id],
    queryFn: () => fetchInvoiceActivity(id || ''),
    enabled: !!user && !!id,
    refetchInterval: 60000,
  });

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = invoice ? Math.max(0, Number(invoice.amount) - totalPaid) : 0;

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error('Invoice not loaded');
      if (remaining <= 0) throw new Error('Invoice is already fully paid');
      await createPayment({
        invoice_id: invoice.id,
        amount: remaining,
        method: 'manual',
        reference: `Manual payment for ${invoice.invoice_number}`,
        notes: 'Marked paid from invoice detail',
      });
      await updateInvoiceStatus(invoice.id, 'paid');
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['invoice', id] });
      await qc.invalidateQueries({ queryKey: ['invoices'] });
      await qc.invalidateQueries({ queryKey: ['payments', 'invoice', id] });
      await qc.invalidateQueries({ queryKey: ['dashboard-data'] });
      await refetch();
      toast.success('Payment recorded successfully');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to record payment'),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!id) throw new Error('No invoice id');
      await confirmInvoicePayment(id, paymentId);
    },
    onSuccess: async () => {
      toast.success('Payment confirmed');
      await qc.invalidateQueries({ queryKey: ['invoice', id] });
      await qc.invalidateQueries({ queryKey: ['payments', 'invoice', id] });
      await qc.invalidateQueries({ queryKey: ['pending-payments', id] });
      await qc.invalidateQueries({ queryKey: ['invoice-activity', id] });
      await qc.invalidateQueries({ queryKey: ['invoices'] });
      await qc.invalidateQueries({ queryKey: ['dashboard-data'] });
      refetchPending();
    },
    onError: () => toast.error('Failed to confirm payment'),
  });

  const requestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'approved' | 'rejected' }) => {
      if (!id) throw new Error('No invoice id');
      await updateRequestStatus(id, requestId, status);
    },
    onSuccess: () => {
      toast.success('Request updated');
      refetchRequests();
      qc.invalidateQueries({ queryKey: ['invoice-activity', id] });
    },
    onError: () => toast.error('Failed to update request'),
  });

  const sendReplyMutation = useMutation({
    mutationFn: async () => {
      if (!id || !replyText.trim()) throw new Error('Empty message');
      await sendFreelancerMessage(id, replyText.trim());
    },
    onSuccess: () => {
      setReplyText('');
      toast.success('Message sent');
      refetchMessages();
      qc.invalidateQueries({ queryKey: ['invoice-activity', id] });
    },
    onError: () => toast.error('Failed to send message'),
  });

  const handleSendInvoice = async () => {
    if (!invoice) return;
    setSending(true);
    try {
      const result = await sendInvoice(invoice.id);
      setShareUrl(result.shareUrl);
      await qc.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Invoice link generated!');
    } catch {
      toast.error('Failed to generate link');
    } finally {
      setSending(false);
    }
  };

  const reminderPayload = useMemo(() => {
    if (!invoice) return null;
    const due = new Date(invoice.due_date);
    const daysOverdue = differenceInDays(new Date(), due);
    const remindersCount = invoice.reminders?.length || 0;
    let tone: 'friendly' | 'firm' | 'serious' = 'friendly';
    if (remindersCount === 1) tone = 'firm';
    if (remindersCount >= 2) tone = 'serious';
    return {
      id: invoice.id,
      client_id: invoice.client?.id,
      invoice_number: invoice.invoice_number,
      client_name: invoice.client?.name || 'Unknown',
      amount: Number(invoice.amount),
      currency: invoice.currency,
      days_overdue: Math.max(daysOverdue, 0),
      reminders_count: remindersCount,
      recommended_tone: tone,
    };
  }, [invoice]);

  if (authLoading || isLoading) {
    return (
      <DashboardLayout pageTitle="Invoice detail">
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A3FF3F]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !invoice || !id) {
    return (
      <DashboardLayout pageTitle="Invoice detail">
        <div className="max-w-2xl mx-auto py-16 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-white">Invoice unavailable</h1>
          <p className="mt-2 text-white/45">{error instanceof Error ? error.message : 'We could not load this invoice.'}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={() => navigate('/invoices')} variant="outline" className="border-white/10 bg-white/5 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to invoices
            </Button>
            <Button onClick={() => refetch()} className="bg-[#A3FF3F] text-[#0A0F0A]">Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const computedStatus = getInvoiceStatus(invoice, totalPaid);
  const isFullyPaid = computedStatus === 'paid';
  const reminderCount = invoice.reminders?.length || 0;
  const existingShareUrl = (invoice as any).share_token
    ? `${window.location.origin}/invoice/${(invoice as any).share_token}`
    : null;
  const activeShareUrl = shareUrl || existingShareUrl;

  const pendingCount = pendingPayments.filter(p => p.status === 'pending').length;
  const pendingRequestCount = requests.filter(r => r.status === 'pending').length;

  return (
    <DashboardLayout pageTitle={invoice.invoice_number}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Link to="/invoices" className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back to invoices
          </Link>
          <div className="flex flex-wrap gap-2">
            {activeShareUrl && (
              <div className="flex items-center gap-1.5 bg-[#0F1A12] border border-white/[0.07] rounded-xl px-3 py-2">
                <span className="text-xs text-white/40 truncate max-w-[160px]">{activeShareUrl}</span>
                <CopyBtn text={activeShareUrl} />
                <a href={activeShareUrl} target="_blank" rel="noreferrer" className="text-white/30 hover:text-[#A3FF3F]">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
            {!activeShareUrl && (
              <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={handleSendInvoice} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Get share link
              </Button>
            )}
            <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={() => setReminderOpen(true)}>
              <Bell className="w-4 h-4 mr-2" />
              Remind
            </Button>
            <Button
              className="bg-[#A3FF3F] text-[#0A0F0A] hover:bg-[#b8ff5c]"
              onClick={() => !isFullyPaid && setConfirmPaid(true)}
              disabled={isFullyPaid}
            >
              {isFullyPaid ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {isFullyPaid ? 'Paid' : 'Mark paid'}
            </Button>
          </div>
        </div>

        {/* Share link banner if freshly generated */}
        {shareUrl && (
          <div className="flex items-center gap-3 bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-[#A3FF3F] shrink-0" />
            <p className="text-sm text-white/70 flex-1 truncate">Link ready: <span className="text-white font-mono text-xs">{shareUrl}</span></p>
            <CopyBtn text={shareUrl} />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Left: Invoice info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0F1A12] p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Invoice</p>
                  <h1 className="text-3xl font-black text-white">{invoice.invoice_number}</h1>
                  <p className="mt-1 text-sm text-white/45">{invoice.description || 'No description provided'}</p>
                </div>
                <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold shrink-0 ${getStatusColor(computedStatus)}`}>
                  {statusLabel(computedStatus)}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                  <p className="text-xs text-white/40 mb-1.5">Total amount</p>
                  <p className="text-xl font-black text-white">{fmt(Number(invoice.amount), invoice.currency)}</p>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                  <p className="text-xs text-white/40 mb-1.5">Paid</p>
                  <p className={`text-xl font-black ${totalPaid > 0 ? 'text-[#A3FF3F]' : 'text-white/30'}`}>
                    {fmt(totalPaid, invoice.currency)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                  <p className="text-xs text-white/40 mb-1.5">Remaining</p>
                  <p className={`text-xl font-black ${remaining > 0 ? 'text-red-400' : 'text-white/30'}`}>
                    {fmt(remaining, invoice.currency)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                  <p className="text-xs text-white/40 mb-1.5">Due date</p>
                  <p className="text-base font-bold text-white">{format(new Date(invoice.due_date), 'dd MMM yyyy')}</p>
                </div>
                <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                  <p className="text-xs text-white/40 mb-1.5">Reminders sent</p>
                  <p className="text-base font-bold text-white">{reminderCount}</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4">
                <p className="text-xs text-white/40 mb-2">Client</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-bold text-white">{invoice.client?.name || 'Unknown client'}</p>
                    <p className="text-sm text-white/45">{invoice.client?.email || 'No email saved'}</p>
                  </div>
                  {invoice.client?.id && (
                    <Link to={`/clients/${invoice.client.id}`} className="text-sm font-bold text-[#A3FF3F] hover:text-[#b8ff5c] shrink-0">
                      Open client
                    </Link>
                  )}
                </div>
              </div>

              {/* Line items */}
              {invoice.line_items && invoice.line_items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase tracking-widest">Line items</p>
                  {invoice.line_items.map((li: any, i: number) => {
                    const rate = li.unit_price ?? li.rate ?? 0;
                    return (
                      <div key={i} className="flex justify-between items-start rounded-xl bg-black/20 border border-white/[0.04] px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{li.description}</p>
                          <p className="text-xs text-white/40 mt-0.5">{li.quantity} × {fmt(Number(rate), invoice.currency)}</p>
                        </div>
                        <p className="text-sm font-bold text-white">{fmt(Number(li.quantity) * Number(rate), invoice.currency)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pending client payments */}
            {pendingCount > 0 && (
              <Section title="Client payment submissions" icon={<Clock className="w-4 h-4" />} count={pendingCount}>
                {pendingPayments.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{fmt(p.amount, invoice.currency)}</p>
                      <p className="text-xs text-white/40 capitalize">{p.method}{p.reference && ` · ${p.reference}`}</p>
                      <p className="text-xs text-white/25">{format(new Date(p.created_at), 'dd MMM, HH:mm')}</p>
                    </div>
                    <button
                      onClick={() => confirmPaymentMutation.mutate(p.id)}
                      disabled={confirmPaymentMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#A3FF3F] text-[#0A0F0A] text-xs font-bold hover:bg-[#b8ff5c] disabled:opacity-50 transition-all shrink-0"
                    >
                      {confirmPaymentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Confirm
                    </button>
                  </div>
                ))}
                {pendingPayments.filter(p => p.status === 'confirmed').map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-black/20 border border-white/[0.05] rounded-xl px-4 py-3 opacity-60">
                    <CheckCircle2 className="w-4 h-4 text-[#A3FF3F] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white">{fmt(p.amount, invoice.currency)} · <span className="capitalize">{p.method}</span></p>
                      <p className="text-xs text-white/30">Confirmed</p>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Messages */}
            <Section title="Messages" icon={<MessageSquare className="w-4 h-4" />}>
              {messages.length === 0 ? (
                <p className="text-sm text-white/30 py-2">No messages yet. Clients can send messages from the invoice link.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`rounded-xl px-4 py-3 ${
                        m.sender === 'client'
                          ? 'bg-white/5 border border-white/[0.07] ml-0 mr-8'
                          : 'bg-[#A3FF3F]/8 border border-[#A3FF3F]/15 ml-8 mr-0'
                      }`}
                    >
                      <p className="text-xs text-white/40 mb-1 capitalize">{m.sender === 'client' ? invoice.client?.name || 'Client' : 'You'}</p>
                      <p className="text-sm text-white/80">{m.message}</p>
                      <p className="text-xs text-white/25 mt-1">{format(new Date(m.created_at), 'dd MMM, HH:mm')}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReplyMutation.mutate()}
                  placeholder="Reply to client…"
                  className="flex-1 h-10 bg-black/30 border border-white/[0.07] rounded-xl px-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#A3FF3F]/30"
                />
                <button
                  onClick={() => sendReplyMutation.mutate()}
                  disabled={sendReplyMutation.isPending || !replyText.trim()}
                  className="h-10 px-3 rounded-xl bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 text-[#A3FF3F] hover:bg-[#A3FF3F]/20 disabled:opacity-40 transition-all"
                >
                  {sendReplyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </Section>

            {/* Extension/dispute requests */}
            {requests.length > 0 && (
              <Section title="Client requests" icon={<CalendarClock className="w-4 h-4" />} count={pendingRequestCount}>
                {requests.map(r => (
                  <div key={r.id} className="rounded-xl bg-black/20 border border-white/[0.05] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            r.type === 'extension' ? 'bg-white/5 text-white/60' : 'bg-red-500/15 text-red-300'
                          }`}>
                            {r.type === 'extension' ? 'Extension' : 'Dispute'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            r.status === 'pending' ? 'bg-amber-500/15 text-amber-300' :
                            r.status === 'approved' ? 'bg-[#A3FF3F]/15 text-[#A3FF3F]' :
                            'bg-red-500/15 text-red-300'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-sm text-white/80 capitalize">{r.reason.replace(/_/g, ' ')}</p>
                        {r.message && <p className="text-xs text-white/40 mt-1">{r.message}</p>}
                        <p className="text-xs text-white/25 mt-1">{format(new Date(r.created_at), 'dd MMM, HH:mm')}</p>
                      </div>
                      {r.status === 'pending' && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => requestMutation.mutate({ requestId: r.id, status: 'approved' })}
                            disabled={requestMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#A3FF3F]/10 text-[#A3FF3F] text-xs font-semibold hover:bg-[#A3FF3F]/20 disabled:opacity-50"
                          >
                            <ThumbsUp className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => requestMutation.mutate({ requestId: r.id, status: 'rejected' })}
                            disabled={requestMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <ThumbsDown className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </div>

          {/* Right: Payment history + Activity */}
          <div className="space-y-4">
            {/* Payment history */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0F1A12] p-5 space-y-3">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#A3FF3F]/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-[#A3FF3F]" />
                </div>
                <p className="text-sm font-bold text-white">Payment history</p>
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-white/30 rounded-xl bg-black/20 p-3">No payments recorded yet.</p>
              ) : (
                payments.map(pay => (
                  <div key={pay.id} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#A3FF3F]">{fmt(Number(pay.amount), invoice.currency)}</span>
                      <span className="text-xs text-white/30">{format(new Date(pay.payment_date), 'dd MMM yyyy')}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40 capitalize">{pay.method}</p>
                    {pay.reference && <p className="text-xs text-white/25">{pay.reference}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Activity timeline */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#0F1A12] p-5 space-y-3">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-lg bg-[#A3FF3F]/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#A3FF3F]" />
                </div>
                <p className="text-sm font-bold text-white">Activity</p>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-white/30 rounded-xl bg-black/20 p-3">No activity yet.</p>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />
                  {activity.map((evt, i) => (
                    <div key={evt.id || i} className="relative pl-5 pb-4 last:pb-0">
                      <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-[#0F1A12] border border-white/10 flex items-center justify-center text-white/40">
                        {ACTIVITY_ICONS[evt.type] ?? <div className="w-1.5 h-1.5 rounded-full bg-white/30" />}
                      </div>
                      <p className="text-xs font-medium text-white/70">
                        {ACTIVITY_LABELS[evt.type] ?? evt.type.replace(/_/g, ' ')}
                      </p>
                      {evt.data && Object.keys(evt.data).length > 0 && (
                        <p className="text-xs text-white/30 mt-0.5">
                          {evt.type === 'payment_requested' || evt.type === 'payment_confirmed'
                            ? `${fmt(evt.data.amount ?? 0, invoice.currency)} · ${evt.data.method ?? ''}`
                            : evt.data.sender ? `From ${evt.data.sender}` : evt.data.type ?? ''}
                        </p>
                      )}
                      <p className="text-xs text-white/20 mt-0.5">{format(new Date(evt.created_at), 'dd MMM, HH:mm')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminder timeline */}
            {(invoice.reminders || []).length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#0F1A12] p-5 space-y-3">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-[#A3FF3F]/10 flex items-center justify-center">
                    <Send className="w-4 h-4 text-[#A3FF3F]" />
                  </div>
                  <p className="text-sm font-bold text-white">Reminders</p>
                </div>
                {invoice.reminders?.map((rem) => (
                  <div key={rem.id} className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-white/40 capitalize">{rem.status}</span>
                      <span className="text-xs text-white/25">{format(new Date(rem.created_at), 'dd MMM, HH:mm')}</span>
                    </div>
                    {rem.message && <p className="mt-1.5 text-xs text-white/55">{rem.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reminderPayload && (
        <SendReminderModal
          isOpen={reminderOpen}
          onClose={() => setReminderOpen(false)}
          invoice={reminderPayload}
        />
      )}

      {/* ── Confirm Mark Paid dialog ── */}
      {confirmPaid && invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !markPaidMutation.isPending && setConfirmPaid(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0F1A12] p-6 shadow-2xl">
            <button
              onClick={() => setConfirmPaid(false)}
              disabled={markPaidMutation.isPending}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all disabled:opacity-0"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 flex items-center justify-center mb-5">
              <CreditCard className="w-6 h-6 text-[#A3FF3F]" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Record full payment?</h2>
            <p className="text-sm text-white/50 mb-5">
              This will record a payment of{' '}
              <span className="font-semibold text-white">{fmt(remaining, invoice.currency)}</span>{' '}
              for <span className="font-semibold text-white">{invoice.invoice_number}</span>.
            </p>
            <div className="flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3.5 mb-6">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300/80 leading-relaxed">Only confirm if you have actually received this payment.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPaid(false)}
                disabled={markPaidMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={() => markPaidMutation.mutate(undefined, {
                  onSuccess: () => setConfirmPaid(false),
                  onError: () => setConfirmPaid(false),
                })}
                disabled={markPaidMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#A3FF3F] text-[#0A0F0A] text-sm font-bold hover:bg-[#b8ff5c] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {markPaidMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Yes, mark as paid</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
