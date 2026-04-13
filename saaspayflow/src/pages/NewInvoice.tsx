import React, { useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClients } from '@/lib/api/clients';
import { createInvoice, sendInvoice, type InvoiceFormData } from '@/lib/api/invoices';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Loader2, Send, ArrowLeft,
  AlertCircle, UserPlus, ChevronDown, Copy, ExternalLink, X,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ─── constants ───────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function symFor(code: string) {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

function fmt(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── local line-item type (rate stored as string for clean empty state) ───────

interface LocalLine {
  description: string;
  quantity: number;
  rate: string;
}

function lineTotal(l: LocalLine) {
  const r = parseFloat(l.rate);
  return isNaN(r) ? 0 : l.quantity * r;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-medium text-white/40 mb-2">
      {children}
      {required && <span className="text-[#A3FF3F] ml-0.5">*</span>}
    </p>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {msg}
    </p>
  );
}

const baseInput =
  'w-full bg-[#0A0F0A] border border-white/8 rounded-xl px-4 py-4 text-sm text-white ' +
  'placeholder:text-white/25 focus:outline-none focus:border-[#A3FF3F]/40 focus:ring-1 ' +
  'focus:ring-[#A3FF3F]/10 transition-all';

const errorInput = 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10';

// ─── main component ──────────────────────────────────────────────────────────

interface Errors {
  clientId?: string;
  title?: string;
  dueDate?: string;
  lines?: string[];
  total?: string;
}

export default function NewInvoice() {
  const navigate     = useNavigate();
  const qc           = useQueryClient();
  const { user }     = useAuth();

  // ── form state ─────────────────────────────────────────────────────────────
  const [clientId, setClientId] = useState('');
  const [title,    setTitle]    = useState('');
  const [dueDate,  setDueDate]  = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [currency, setCurrency] = useState('INR');
  const [tax,      setTax]      = useState<string>('0');
  const [lines, setLines]       = useState<LocalLine[]>([{ description: '', quantity: 1, rate: '' }]);
  const [errors,   setErrors]   = useState<Errors>({});
  const [apiErr,   setApiErr]   = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ shareUrl: string; invoiceNumber: string; clientName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const sym = symFor(currency);

  // ── clients ────────────────────────────────────────────────────────────────
  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn:  () => fetchClients(),
    enabled:  !!user,
    staleTime: 60_000,
  });

  // ── totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal  = lines.reduce((s, l) => s + lineTotal(l), 0);
    const taxRate   = Math.min(100, Math.max(0, parseFloat(tax) || 0));
    const taxAmount = subtotal * (taxRate / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount, taxRate };
  }, [lines, tax]);

  // ── line item helpers ──────────────────────────────────────────────────────
  const updateLine = useCallback((i: number, patch: Partial<LocalLine>) => {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
    setErrors(e => {
      if (!e.lines) return e;
      const next = [...(e.lines ?? [])];
      next[i] = '';
      return { ...e, lines: next };
    });
  }, []);

  const removeLine = useCallback((i: number) => {
    setLines(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const addLine = () =>
    setLines(prev => [...prev, { description: '', quantity: 1, rate: '' }]);

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Errors = {};
    if (!clientId)      e.clientId = 'Select a client';
    if (!title.trim())  e.title    = 'Invoice title is required';
    if (!dueDate)       e.dueDate  = 'Due date is required';

    const lineErrs = lines.map(l => {
      if (!l.description.trim())    return 'Description required';
      const qty = l.quantity;
      if (!qty || qty < 1)          return 'Quantity must be ≥ 1';
      const r = parseFloat(l.rate);
      if (isNaN(r) || r < 1)       return 'Rate must be ≥ 1';
      return '';
    });
    if (lineErrs.some(Boolean)) e.lines = lineErrs;

    if (totals.total <= 0) e.total = 'Total must be greater than 0';
    setErrors(e);
    return !e.clientId && !e.title && !e.dueDate && !e.lines && !e.total;
  };

  // ── mutation ───────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async ({ method }: { method: 'draft' | 'send' }) => {
      setApiErr(null);
      const selectedClient = clients.find(c => c.id === clientId);
      const payload: InvoiceFormData = {
        client_id:      clientId,
        invoice_number: '',
        title,
        description:    title,
        currency,
        status:         'draft',
        due_date:       dueDate,
        amount:         totals.total,
        subtotal:       totals.subtotal,
        tax:            totals.taxAmount,
        tax_percent:    totals.taxRate,
        total:          totals.total,
        line_items:     lines.map(l => ({
          description: l.description,
          quantity:    l.quantity,
          unit_price:  parseFloat(l.rate) || 0,
        })),
        paid_date: null,
        sent_at:   null,
        reminders: [],
      };
      const invoice = await createInvoice(payload, 'draft');
      if (method === 'send') {
        const { shareUrl } = await sendInvoice(invoice.id);
        return { method, shareUrl, invoiceNumber: invoice.invoice_number, clientName: selectedClient?.name || 'Client' };
      }
      return { method, shareUrl: null, invoiceNumber: invoice.invoice_number, clientName: '' };
    },
    onSuccess: ({ method, shareUrl, invoiceNumber, clientName }) => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      if (method === 'send' && shareUrl) {
        setShareModal({ shareUrl, invoiceNumber, clientName });
      } else {
        navigate('/invoices');
      }
    },
    onError: (err: Error) => {
      setApiErr(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const submit = (method: 'draft' | 'send') => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    mutation.mutate({ method });
  };

  const busy = mutation.isPending;

  // ── no clients state ───────────────────────────────────────────────────────
  if (!loadingClients && clients.length === 0) {
    return (
      <DashboardLayout pageTitle="New Invoice">
        <div className="max-w-md mx-auto mt-24 text-center px-4">
          <div className="w-16 h-16 rounded-3xl bg-[#A3FF3F]/8 border border-[#A3FF3F]/12 flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-[#A3FF3F]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Add a client first</h2>
          <p className="text-sm text-white/40 leading-relaxed mb-8">
            Every invoice needs a client to bill. Create your first client, then come back to make your invoice.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate('/clients')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A3FF3F] text-[#080D08] text-sm font-bold rounded-xl hover:bg-[#b8ff5c] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add client
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 border border-white/10 text-white/40 text-sm rounded-xl hover:bg-white/5 hover:text-white transition-all"
            >
              Go back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="New Invoice">
      <div className="max-w-5xl mx-auto">

        {/* Page title */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-white/30 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">New Invoice</h1>
            <p className="text-xs text-white/30 mt-0.5">Create and send in seconds</p>
          </div>
        </div>

        {/* API error */}
        {apiErr && (
          <div className="mb-6 flex items-start gap-3 bg-red-500/8 border border-red-500/15 rounded-2xl px-5 py-4">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300">{apiErr}</p>
          </div>
        )}

        {/* Two-column layout: form left, summary right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ─── LEFT COLUMN ─────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* ── Section 1: Invoice info ─────────────────────────────────── */}
            <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-7">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">Invoice details</p>

              <div className="space-y-5">

                {/* Client */}
                <div>
                  <FieldLabel required>Bill to</FieldLabel>
                  <div className="relative">
                    <select
                      value={clientId}
                      onChange={e => { setClientId(e.target.value); setErrors(p => ({ ...p, clientId: undefined })); }}
                      disabled={loadingClients}
                      className={cn(baseInput, 'appearance-none pr-10', errors.clientId && errorInput)}
                    >
                      <option value="" disabled>Choose a client…</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}{c.company_name ? ` · ${c.company_name}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                  </div>
                  <FieldError msg={errors.clientId} />
                </div>

                {/* Title */}
                <div>
                  <FieldLabel required>Project / title</FieldLabel>
                  <input
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
                    placeholder="e.g. Website redesign — June 2026"
                    className={cn(baseInput, errors.title && errorInput)}
                  />
                  <FieldError msg={errors.title} />
                </div>

                {/* Due date + Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Due date</FieldLabel>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => { setDueDate(e.target.value); setErrors(p => ({ ...p, dueDate: undefined })); }}
                      className={cn(baseInput, errors.dueDate && errorInput)}
                    />
                    <FieldError msg={errors.dueDate} />
                  </div>
                  <div>
                    <FieldLabel>Currency</FieldLabel>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className={cn(baseInput, 'appearance-none pr-10')}
                      >
                        {CURRENCIES.map(c => (
                          <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Section 2: Line items ───────────────────────────────────── */}
            <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-7">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Line items</p>
                <span className="text-xs text-white/25">{lines.length} item{lines.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Line item cards */}
              <div className="space-y-4">
                {lines.map((line, idx) => {
                  const amount = lineTotal(line);
                  const lineErr = errors.lines?.[idx];
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-2xl border p-5 space-y-4 transition-all',
                        lineErr
                          ? 'bg-red-500/5 border-red-500/20'
                          : 'bg-[#0A0F0A] border-white/8 hover:border-white/12',
                      )}
                    >
                      {/* Description — full-width editable input, no label (placeholder is descriptive) */}
                      <input
                        type="text"
                        value={line.description}
                        onChange={e => updateLine(idx, { description: e.target.value })}
                        placeholder="What did you work on? e.g. Logo design, consulting, dev work…"
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none border-b border-white/10 hover:border-white/20 focus:border-[#A3FF3F]/50 pb-3 transition-colors cursor-text"
                      />

                      {/* Qty · Rate · Amount · Delete */}
                      <div className="flex items-end gap-3 pt-1">

                        {/* Qty */}
                        <div className="w-24 shrink-0">
                          <p className="text-[10px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Qty</p>
                          <input
                            type="number"
                            value={line.quantity}
                            min={1}
                            step={1}
                            onChange={e => updateLine(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            className="w-full bg-[#080D08] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-[#A3FF3F]/40 tabular-nums transition-colors"
                          />
                        </div>

                        {/* Rate */}
                        <div className="flex-1">
                          <p className="text-[10px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Rate</p>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-white/40 select-none pointer-events-none">
                              {sym}
                            </span>
                            <input
                              type="number"
                              value={line.rate}
                              min={0}
                              step="0.01"
                              onChange={e => updateLine(idx, { rate: e.target.value })}
                              placeholder="0.00"
                              className="w-full bg-[#080D08] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#A3FF3F]/40 tabular-nums transition-colors"
                            />
                          </div>
                        </div>

                        {/* Amount (auto-calc, read-only display) */}
                        <div className="flex-1">
                          <p className="text-[10px] font-medium text-white/35 mb-1.5 uppercase tracking-wider">Amount</p>
                          <div className={cn(
                            'rounded-xl px-4 py-2.5 text-sm tabular-nums text-right font-semibold',
                            amount > 0
                              ? 'text-white bg-[#A3FF3F]/8 border border-[#A3FF3F]/15'
                              : 'text-white/25 bg-[#080D08] border border-white/5',
                          )}>
                            {sym}{fmt(amount)}
                          </div>
                        </div>

                        {/* Delete */}
                        <div className="flex-none">
                          <button
                            onClick={() => removeLine(idx)}
                            disabled={lines.length === 1}
                            className="p-2.5 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-0 mb-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>

                      {/* Line error */}
                      {lineErr && (
                        <p className="flex items-center gap-1.5 text-xs text-red-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          {lineErr}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add line item */}
              <button
                onClick={addLine}
                className="mt-4 w-full py-4 border-2 border-dashed border-white/8 rounded-xl flex items-center justify-center gap-2 text-sm text-white/30 hover:text-[#A3FF3F] hover:border-[#A3FF3F]/20 hover:bg-[#A3FF3F]/3 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add line item
              </button>

            </div>
          </div>

          {/* ─── RIGHT COLUMN: Summary + Actions (sticky) ────────────────── */}
          <div className="lg:sticky lg:top-6 space-y-4">

            {/* Summary */}
            <div className="bg-[#0F1A12] border border-white/5 rounded-2xl p-6">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-6">Summary</p>

              <div className="space-y-4">

                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Subtotal</span>
                  <span className="text-sm text-white tabular-nums font-medium">{sym}{fmt(totals.subtotal)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Tax</span>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-[#0A0F0A] border border-white/8 rounded-lg px-3 py-2">
                      <input
                        type="number"
                        value={tax}
                        min={0}
                        max={100}
                        onChange={e => setTax(e.target.value)}
                        className="w-16 bg-transparent text-sm text-white text-right focus:outline-none tabular-nums"
                      />
                      <span className="text-xs text-white/30">%</span>
                    </div>
                    <span className="text-sm text-white/60 tabular-nums min-w-[72px] text-right">{sym}{fmt(totals.taxAmount)}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/8 pt-5 mt-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-0.5">Total due</p>
                      <p className="text-xs text-white/25">{currency}</p>
                    </div>
                    <div className={cn(
                      'text-right tabular-nums font-bold tracking-tight transition-opacity',
                      totals.total > 0 ? 'opacity-100' : 'opacity-25',
                    )}>
                      <span className="text-base text-[#A3FF3F] mr-0.5">{sym}</span>
                      <span className="text-2xl text-white">{fmt(totals.total)}</span>
                    </div>
                  </div>

                  {errors.total && (
                    <p className="mt-3 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {errors.total}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => submit('send')}
                disabled={busy}
                className="w-full py-4 bg-[#A3FF3F] text-[#080D08] font-bold text-sm rounded-2xl hover:bg-[#b8ff5c] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2.5 shadow-[0_8px_24px_rgba(163,255,63,0.20)]"
              >
                {busy
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
                Send invoice
              </button>

              <button
                onClick={() => submit('draft')}
                disabled={busy}
                className="w-full py-3.5 border border-white/8 text-white/50 text-sm font-medium rounded-2xl hover:bg-white/5 hover:text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save as draft
              </button>
            </div>

            {/* Footnote */}
            <p className="text-[11px] text-white/20 text-center leading-relaxed px-2">
              Sending marks the invoice as sent and logs the time. Drafts are saved privately.
            </p>

          </div>

        </div>
      </div>
      {/* Share link modal — shown after "Send invoice" */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F1A12] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A3FF3F]/12 border border-[#A3FF3F]/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#A3FF3F]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Invoice ready!</h2>
                  <p className="text-xs text-white/40">{shareModal.invoiceNumber} · {shareModal.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => { setShareModal(null); navigate('/invoices'); }}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-white/55 mb-4">Share this link with your client so they can view and pay the invoice.</p>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 mb-4 min-w-0">
              <span className="flex-1 text-xs text-white/50 truncate font-mono">{shareModal.shareUrl}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareModal.shareUrl).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy link'}
              </button>
              <a
                href={shareModal.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A3FF3F] text-[#0A0F0A] text-sm font-bold hover:bg-[#b8ff5c] transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open invoice
              </a>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
