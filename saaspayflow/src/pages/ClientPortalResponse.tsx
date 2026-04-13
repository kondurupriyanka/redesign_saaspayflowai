import React, { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchInvoiceForPortal, submitInvoiceResponse } from '@/lib/api/reminders';
import { CheckCircle2, Clock, AlertCircle, Calendar, MessageSquare, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ClientPortalResponse() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'delay'; // 'delay' or 'confirmation'
  
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [submitted, setSubmitted] = useState(false);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['portal-invoice', id],
    queryFn: () => fetchInvoiceForPortal(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: submitInvoiceResponse,
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    mutation.mutate({
      invoice_id: id,
      response_type: type as 'delay' | 'confirmation',
      reason: reason || (type === 'confirmation' ? 'Confirming payment soon' : 'Requesting more time'),
      new_due_date: type === 'delay' ? newDate : null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-[#A3FF3F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0F1A12] border border-white/10 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
          <p className="text-white/40 mb-8">The invoice link you followed may be invalid or expired.</p>
          <Link to="/contact" className="text-[#A3FF3F] font-medium hover:underline">Contact Support</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0F1A12] border border-[#A3FF3F]/20 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-[#A3FF3F]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#A3FF3F]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-white/40 mb-2">Your response for <span className="text-white font-medium">{invoice.invoice_number}</span> has been shared with the freelancer.</p>
          <p className="text-xs text-white/20 italic">You match our "Professional Client" criteria. Thanks for the update!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Branding */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#A3FF3F] flex items-center justify-center">
            <span className="text-black font-black">P</span>
          </div>
          <span className="text-xl font-bold tracking-tight">PayFlow <span className="text-[#A3FF3F]/60 font-medium">AI</span></span>
        </div>

        <div className="bg-[#0F1A12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">Invoice Update</p>
                <h1 className="text-2xl font-bold">{invoice.invoice_number}</h1>
                <p className="text-sm text-white/40 mt-1">For {(invoice.client as any)?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#A3FF3F]">
                  {formatINR(Number(invoice.amount), invoice.currency)}
                </p>
                <p className="text-xs text-white/30 mt-1">Due {format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-white/50" />
              </div>
              <div>
                <p className="text-sm font-medium">Payment is Currently Overdue</p>
                <p className="text-xs text-white/40">Please provide a quick update to help us plan better.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {type === 'delay' ? (
              <>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-white/70">What's the status of this payment?</label>
                  <div className="grid grid-cols-1 gap-3">
                    {DELAY_REASONS.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setReason(r.label)}
                        className={cn(
                          "w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group",
                          reason === r.label 
                            ? "bg-[#A3FF3F]/5 border-[#A3FF3F]/30 ring-1 ring-[#A3FF3F]/30" 
                            : "bg-white/4 border-white/5 hover:border-white/20"
                        )}
                      >
                        <span className={cn("text-sm transition-colors", reason === r.label ? "text-[#A3FF3F] font-bold" : "text-white/60")}>
                          {r.label}
                        </span>
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                          reason === r.label ? "bg-[#A3FF3F] border-[#A3FF3F]" : "border-white/10"
                        )}>
                          {reason === r.label && <div className="w-2 h-2 bg-black rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <Calendar className="w-4 h-4 text-[#A3FF3F]" />
                    When can we expect payment?
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#A3FF3F]/50 transition-all font-mono"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-white/70">Confirming payment details</label>
                <textarea
                  placeholder="Drop a quick note about the payment (e.g. 'Paid today via wire')"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-32 bg-white/4 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#A3FF3F]/50 transition-all resize-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || (type === 'delay' && !reason)}
              className="w-full bg-[#A3FF3F] hover:bg-[#b8ff5c] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/40 active:scale-[0.98]"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Response
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center text-white/20 text-[10px] uppercase tracking-widest mt-8">
          Powered by PayFlow AI — Freelance Billing Intelligence
        </p>
      </div>
    </div>
  );
}

const DELAY_REASONS = [
  { id: '1', label: 'Internal processing delay' },
  { id: '2', label: 'Awaiting client approval/sign-off' },
  { id: '3', label: 'Cashflow variance at our end' },
  { id: '4', label: 'Other professional delay' },
];

function formatINR(n: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(n);
}
