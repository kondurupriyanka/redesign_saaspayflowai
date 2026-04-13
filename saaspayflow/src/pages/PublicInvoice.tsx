import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2, AlertCircle, Loader2, FileText,
  Calendar, Wallet, Copy, Check, Building2, Smartphone,
  MessageSquare, CalendarClock, ChevronDown, ChevronUp, Send,
  Globe,
} from 'lucide-react';
import { fetchPublicInvoice, submitClientPayment, sendClientMessage, submitClientRequest } from '@/lib/api/invoices';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PublicInv {
  id: string;
  invoice_number: string;
  title: string | null;
  description: string | null;
  currency: string;
  amount: number;
  total: number | null;
  amount_paid: number;
  status: string;
  due_date: string;
  sent_at: string | null;
  paid_date: string | null;
  line_items: Array<{ description: string; quantity: number; unit_price?: number; rate?: number }>;
  client_name: string;
  client_email: string;
  client_company: string | null;
  freelancer_name: string;
  freelancer_email: string;
  business_name: string | null;
  payment_info: {
    upi_id?: string;
    upi_name?: string;
    account_name?: string;
    bank_name?: string;
    account_number?: string;
    ifsc?: string;
    account_type?: string;
    paypal_email?: string;
  };
}

interface ThreadMessage {
  id: string;
  sender: 'client' | 'freelancer';
  message: string;
  created_at: string;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
};

function fmt(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 2,
  }).format(n);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-2 p-1 rounded text-white/30 hover:text-[#7CFF5B] transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#7CFF5B]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-sm text-white/40">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-white">{value}</span>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

type PaymentMethod = 'upi' | 'bank' | 'cash' | 'paypal' | 'other';

async function fetchPublicMessages(token: string): Promise<ThreadMessage[]> {
  const res = await fetch(`/api/invoices/public/${token}/messages`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function PublicInvoice() {
  const { token } = useParams<{ token: string }>();
  const [inv, setInv] = useState<PublicInv | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion state
  const [showLines, setShowLines] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showExtension, setShowExtension] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // Pay form
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payDone, setPayDone] = useState(false);

  // Extension form
  const [extReason, setExtReason] = useState('');
  const [extMessage, setExtMessage] = useState('');
  const [extLoading, setExtLoading] = useState(false);
  const [extDone, setExtDone] = useState(false);

  // Message thread
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [msgText, setMsgText] = useState('');
  const [msgLoading, setMsgLoading] = useState(false);
  const threadBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) { setError('Invalid link'); setLoading(false); return; }
    fetchPublicInvoice(token)
      .then(data => { setInv(data); setLoading(false); })
      .catch(e => { setError(e.message || 'Invoice not found'); setLoading(false); });
  }, [token]);

  // Poll messages every 8 seconds once invoice loaded
  useEffect(() => {
    if (!token) return;
    const load = () => fetchPublicMessages(token).then(setThread);
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [token]);

  // Scroll to bottom of thread when new messages arrive
  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  useEffect(() => {
    if (inv) {
      const remaining = Math.max(0, (inv.total ?? inv.amount) - inv.amount_paid);
      setPayAmount(remaining > 0 ? String(remaining) : '');
      // Set default method based on what's configured
      const pi = inv.payment_info ?? {};
      if (pi.upi_id) setPayMethod('upi');
      else if (pi.account_number && pi.ifsc) setPayMethod('bank');
      else if (pi.paypal_email) setPayMethod('paypal');
      else setPayMethod('cash');
    }
  }, [inv]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D07] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#A3FF3F]" />
      </div>
    );
  }

  if (error || !inv) {
    return (
      <div className="min-h-screen bg-[#060D07] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invoice not found</h1>
          <p className="text-white/40 text-sm">{error || 'This link may have expired.'}</p>
        </div>
      </div>
    );
  }

  const invoiceTotal = inv.total ?? inv.amount;
  const remaining   = Math.max(0, invoiceTotal - inv.amount_paid);
  const isFullyPaid = remaining <= 0;
  const pct         = invoiceTotal > 0 ? Math.min(100, Math.round((inv.amount_paid / invoiceTotal) * 100)) : 0;
  const dueDate     = new Date(inv.due_date);
  const isOverdue   = !isFullyPaid && new Date() > dueDate;

  const pi = inv.payment_info ?? {};
  const hasUpi     = !!pi.upi_id;
  const hasBank    = !!(pi.account_number && pi.ifsc);
  const hasPaypal  = !!pi.paypal_email;

  const upiLink = hasUpi
    ? `upi://pay?pa=${pi.upi_id}&pn=${encodeURIComponent(pi.upi_name || inv.business_name || '')}&am=${remaining}&cu=${inv.currency}`
    : '';
  const qrUrl = hasUpi
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiLink)}&size=200x200&margin=10&bgcolor=111714&color=A3FF3F`
    : '';

  const handlePay = async () => {
    if (!token || !payAmount || isNaN(Number(payAmount))) return;
    setPayLoading(true);
    try {
      await submitClientPayment(token, {
        amount: Number(payAmount),
        method: payMethod,
        reference: payRef.trim() || undefined,
      });
      setPayDone(true);
    } catch (e: any) {
      alert(e.message || 'Failed to submit payment');
    } finally {
      setPayLoading(false);
    }
  };

  const handleExtension = async () => {
    if (!token || !extReason) return;
    setExtLoading(true);
    try {
      await submitClientRequest(token, { type: 'extension', reason: extReason, message: extMessage.trim() || undefined });
      setExtDone(true);
    } catch (e: any) {
      alert(e.message || 'Failed to submit request');
    } finally {
      setExtLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!token || !msgText.trim()) return;
    setMsgLoading(true);
    try {
      await sendClientMessage(token, { message: msgText.trim() });
      setMsgText('');
      // Immediately reload thread after sending
      fetchPublicMessages(token).then(setThread);
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    } finally {
      setMsgLoading(false);
    }
  };

  const selectClass = "bg-[#111714] border border-[#A3FF3F]/20 text-white rounded-xl h-12 focus:border-[#A3FF3F]/50 data-[placeholder]:text-white/30";
  const contentClass = "bg-[#111714] border border-[#A3FF3F]/20 text-white rounded-xl";
  const itemClass = "text-white/80 hover:bg-[#A3FF3F]/10 hover:text-[#7CFF5B] focus:bg-[#A3FF3F]/10 focus:text-[#7CFF5B] cursor-pointer rounded-lg";

  return (
    <div className="min-h-screen bg-[#060D07] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.05] bg-[#0A0F0A]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#A3FF3F] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#0A0F0A]" />
            </div>
            <span className="text-sm font-bold text-white">{inv.business_name || inv.freelancer_name || 'PayFlow'}</span>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
            isFullyPaid ? 'bg-[#A3FF3F]/10 border-[#A3FF3F]/30 text-[#A3FF3F]' :
            isOverdue ? 'bg-red-500/10 border-red-500/30 text-red-400' :
            'bg-white/5 border-white/10 text-white/50'
          }`}>
            {isFullyPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Sent'}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Invoice card */}
        <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Invoice</p>
              <h1 className="text-2xl font-black text-white">{inv.invoice_number}</h1>
              {(inv.title || inv.description) && (
                <p className="text-sm text-white/50 mt-1">{inv.title || inv.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40 mb-1">Billed to</p>
              <p className="text-sm font-semibold text-white">{inv.client_name}</p>
              {inv.client_company && <p className="text-xs text-white/40">{inv.client_company}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-black/20 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Total</p>
              <p className="text-2xl font-black text-white">{fmt(invoiceTotal, inv.currency)}</p>
            </div>
            <div className={`bg-black/20 rounded-xl p-4 border ${isOverdue ? 'border-red-500/20' : 'border-white/[0.04]'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className={`w-3 h-3 ${isOverdue ? 'text-red-400' : 'text-white/30'}`} />
                <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>Due date</p>
              </div>
              <p className={`text-lg font-bold ${isOverdue ? 'text-red-300' : 'text-white'}`}>
                {format(dueDate, 'dd MMM yyyy')}
              </p>
              {isOverdue && <p className="text-xs text-red-400 mt-0.5">Overdue</p>}
            </div>
          </div>

          {/* Payment progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Payment progress</span>
              <span className="text-white/60">{pct}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFullyPaid ? 'bg-[#A3FF3F]' : 'bg-[#A3FF3F]/60'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Paid: <span className="text-[#A3FF3F] font-medium">{fmt(inv.amount_paid, inv.currency)}</span></span>
              {!isFullyPaid && <span className="text-white/40">Remaining: <span className="text-red-400 font-medium">{fmt(remaining, inv.currency)}</span></span>}
            </div>
          </div>

          {isFullyPaid && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-[#A3FF3F]/10 border border-[#A3FF3F]/20">
              <CheckCircle2 className="w-5 h-5 text-[#A3FF3F] shrink-0" />
              <p className="text-sm font-medium text-[#A3FF3F]">This invoice has been fully paid. Thank you!</p>
            </div>
          )}
        </div>

        {/* Line items accordion */}
        <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowLines(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#A3FF3F]" />
              <span className="text-sm font-semibold text-white">Line items</span>
            </div>
            {showLines ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>
          {showLines && (
            <div className="px-6 pb-5 space-y-2 border-t border-white/[0.05]">
              {inv.line_items.length === 0 ? (
                <p className="text-sm text-white/30 py-3">No line items</p>
              ) : (
                <>
                  {inv.line_items.map((li, i) => {
                    const rate = li.unit_price ?? li.rate ?? 0;
                    const lineTotal = Number(li.quantity) * Number(rate);
                    return (
                      <div key={i} className="flex justify-between items-start py-2.5 border-b border-white/[0.05] last:border-0">
                        <div>
                          <p className="text-sm text-white font-medium">{li.description}</p>
                          <p className="text-xs text-white/40 mt-0.5">{li.quantity} × {fmt(Number(rate), inv.currency)}</p>
                        </div>
                        <p className="text-sm font-bold text-white">{fmt(lineTotal, inv.currency)}</p>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-2">
                    <span className="text-sm font-bold text-white/60">Total</span>
                    <span className="text-sm font-black text-white">{fmt(invoiceTotal, inv.currency)}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pay Now accordion */}
        {!isFullyPaid && (
          <div className="bg-[#0F1A12] border border-[#A3FF3F]/20 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowPay(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-[#A3FF3F]" />
                <span className="text-sm font-semibold text-white">Pay now</span>
                <span className="text-xs text-[#A3FF3F] bg-[#A3FF3F]/10 px-2 py-0.5 rounded-full">
                  {fmt(remaining, inv.currency)} due
                </span>
              </div>
              {showPay ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </button>

            {showPay && (
              <div className="border-t border-white/[0.05] px-6 pb-6 pt-5 space-y-5">
                {payDone ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-[#A3FF3F]" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Payment submitted!</h3>
                    <p className="text-sm text-white/50">The freelancer has been notified and will confirm your payment shortly.</p>
                  </div>
                ) : (
                  <>
                    {/* No payment methods configured */}
                    {!hasUpi && !hasBank && !hasPaypal && (
                      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-white/60">No payment details set up</p>
                          <p className="text-xs text-white/30 mt-0.5">The freelancer has not added UPI, bank, or PayPal details yet. You can still record a cash or other payment below.</p>
                        </div>
                      </div>
                    )}

                    {/* Method selector */}
                    <div>
                      <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">Payment method</label>
                      <Select value={payMethod} onValueChange={(v) => setPayMethod(v as PaymentMethod)}>
                        <SelectTrigger className={selectClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={contentClass}>
                          {hasUpi    && <SelectItem value="upi"    className={itemClass}><div className="flex items-center gap-2"><Smartphone className="w-3.5 h-3.5" /> UPI / QR Code</div></SelectItem>}
                          {hasBank   && <SelectItem value="bank"   className={itemClass}><div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Bank Transfer</div></SelectItem>}
                          {hasPaypal && <SelectItem value="paypal" className={itemClass}><div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> PayPal</div></SelectItem>}
                          <SelectItem value="cash"  className={itemClass}>Cash</SelectItem>
                          <SelectItem value="other" className={itemClass}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Method-specific instructions */}
                    {payMethod === 'upi' && hasUpi && (
                      <div className="bg-[#111714] border border-[#A3FF3F]/15 rounded-xl p-5">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Scan QR or pay via UPI ID</p>
                        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                          <img
                            src={qrUrl}
                            alt="UPI QR"
                            className="w-[130px] h-[130px] rounded-xl border border-white/10"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="space-y-3 flex-1">
                            <div className="bg-black/30 rounded-xl p-3">
                              <p className="text-xs text-white/40 mb-1">UPI ID</p>
                              <div className="flex items-center gap-1">
                                <p className="text-base font-bold text-[#A3FF3F]">{pi.upi_id}</p>
                                <CopyButton text={pi.upi_id!} />
                              </div>
                            </div>
                            {pi.upi_name && (
                              <div className="bg-black/30 rounded-xl p-3">
                                <p className="text-xs text-white/40 mb-1">Payee name</p>
                                <p className="text-sm font-medium text-white">{pi.upi_name}</p>
                              </div>
                            )}
                            <p className="text-xs text-white/30">Open any UPI app (GPay, PhonePe, Paytm) → Scan QR or enter UPI ID</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {payMethod === 'upi' && !hasUpi && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                        The freelancer hasn't set up UPI details yet. Please choose another payment method.
                      </div>
                    )}

                    {payMethod === 'bank' && hasBank && (
                      <div className="bg-[#111714] border border-[#A3FF3F]/15 rounded-xl p-5 space-y-1">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Bank transfer details</p>
                        {pi.account_name   && <InfoRow label="Account name"   value={pi.account_name} />}
                        {pi.bank_name      && <InfoRow label="Bank"           value={pi.bank_name} />}
                        {pi.account_number && <InfoRow label="Account number" value={pi.account_number} />}
                        {pi.ifsc           && <InfoRow label="IFSC / SWIFT"   value={pi.ifsc} />}
                        {pi.account_type   && <InfoRow label="Account type"   value={pi.account_type} />}
                      </div>
                    )}

                    {payMethod === 'bank' && !hasBank && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                        Bank details not available. Please choose another method or contact the freelancer.
                      </div>
                    )}

                    {payMethod === 'paypal' && hasPaypal && (
                      <div className="bg-[#111714] border border-[#A3FF3F]/15 rounded-xl p-5">
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Send payment via PayPal</p>
                        <div className="bg-black/30 rounded-xl p-3">
                          <p className="text-xs text-white/40 mb-1">PayPal email</p>
                          <div className="flex items-center gap-1">
                            <p className="text-base font-bold text-[#A3FF3F]">{pi.paypal_email}</p>
                            <CopyButton text={pi.paypal_email!} />
                          </div>
                        </div>
                        <p className="text-xs text-white/30 mt-3">Open PayPal → Send & Request → enter the email above and the amount.</p>
                      </div>
                    )}

                    {payMethod === 'paypal' && !hasPaypal && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                        PayPal details not available. Please choose another payment method.
                      </div>
                    )}

                    {payMethod === 'cash' && (
                      <div className="bg-[#111714] border border-white/[0.06] rounded-xl p-5">
                        <p className="text-sm font-semibold text-white mb-2">Pay in cash</p>
                        <p className="text-sm text-white/50">
                          Arrange a cash payment directly with <strong className="text-white">{inv.freelancer_name || inv.business_name}</strong>.
                          Once paid, enter the amount below and submit to notify them.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3">
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">
                            Amount you paid ({CURRENCY_SYMBOL[inv.currency] ?? inv.currency})
                          </label>
                          <input
                            type="number"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full h-12 bg-[#111714] border border-white/[0.08] rounded-xl px-4 text-white placeholder-white/20 focus:outline-none focus:border-[#A3FF3F]/40 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">
                            Transaction ID / Reference (optional)
                          </label>
                          <input
                            type="text"
                            value={payRef}
                            onChange={e => setPayRef(e.target.value)}
                            placeholder="UTR, cheque no., etc."
                            className="w-full h-12 bg-[#111714] border border-white/[0.08] rounded-xl px-4 text-white placeholder-white/20 focus:outline-none focus:border-[#A3FF3F]/40 text-sm"
                          />
                        </div>
                        <button
                          onClick={handlePay}
                          disabled={payLoading || !payAmount}
                          className="w-full h-12 rounded-xl bg-[#A3FF3F] text-[#0A0F0A] font-bold text-sm hover:bg-[#b8ff5c] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {payLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {payLoading ? 'Submitting…' : 'I have paid — notify the freelancer'}
                        </button>
                      </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Request extension accordion */}
        <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowExtension(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <CalendarClock className="w-4 h-4 text-[#A3FF3F]" />
              <span className="text-sm font-semibold text-white">Request an extension</span>
            </div>
            {showExtension ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>
          {showExtension && (
            <div className="border-t border-white/[0.05] px-6 pb-6 pt-5 space-y-4">
              {extDone ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#A3FF3F]" />
                  <p className="text-sm font-medium text-white">Extension request submitted!</p>
                  <p className="text-xs text-white/40">The freelancer will review your request.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Reason for extension</label>
                    <Select value={extReason} onValueChange={setExtReason}>
                      <SelectTrigger className={selectClass}>
                        <SelectValue placeholder="Select a reason…" />
                      </SelectTrigger>
                      <SelectContent className={contentClass}>
                        <SelectItem value="cash_flow"           className={itemClass}>Cash flow issues</SelectItem>
                        <SelectItem value="processing_delay"    className={itemClass}>Payment processing delay</SelectItem>
                        <SelectItem value="approval_pending"    className={itemClass}>Waiting for internal approval</SelectItem>
                        <SelectItem value="dispute"             className={itemClass}>Dispute / query on invoice</SelectItem>
                        <SelectItem value="other"               className={itemClass}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 uppercase tracking-wider mb-1.5 block">Additional message (optional)</label>
                    <textarea
                      value={extMessage}
                      onChange={e => setExtMessage(e.target.value)}
                      placeholder="Explain your situation…"
                      rows={3}
                      className="w-full bg-[#111714] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#A3FF3F]/40 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleExtension}
                    disabled={extLoading || !extReason}
                    className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {extLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                    {extLoading ? 'Submitting…' : 'Submit request'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Message thread accordion */}
        <div className="bg-[#0F1A12] border border-white/[0.07] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowMessage(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-[#A3FF3F]" />
              <span className="text-sm font-semibold text-white">Message the freelancer</span>
              {thread.length > 0 && (
                <span className="text-xs bg-[#A3FF3F]/10 text-[#A3FF3F] px-2 py-0.5 rounded-full">{thread.length}</span>
              )}
            </div>
            {showMessage ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </button>
          {showMessage && (
            <div className="border-t border-white/[0.05] px-6 pb-6 pt-5 space-y-4">
              {/* Message thread */}
              {thread.length > 0 && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {thread.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                        msg.sender === 'client'
                          ? 'bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 text-white'
                          : 'bg-white/5 border border-white/[0.07] text-white'
                      }`}>
                        <p className={`text-xs font-semibold mb-1 ${msg.sender === 'client' ? 'text-[#A3FF3F]' : 'text-white/50'}`}>
                          {msg.sender === 'client' ? 'You' : inv.freelancer_name || 'Freelancer'}
                        </p>
                        <p className="text-sm text-white/80 leading-snug">{msg.message}</p>
                        <p className="text-[10px] text-white/25 mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={threadBottomRef} />
                </div>
              )}

              {/* Compose */}
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder={`Write a message to ${inv.freelancer_name || 'the freelancer'}…`}
                rows={3}
                className="w-full bg-[#111714] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#A3FF3F]/40 resize-none"
              />
              <button
                onClick={handleMessage}
                disabled={msgLoading || !msgText.trim()}
                className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {msgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {msgLoading ? 'Sending…' : 'Send message'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 pb-4">
          Powered by <span className="text-white/40 font-semibold">PayFlow AI</span>
        </p>
      </div>
    </div>
  );
}
