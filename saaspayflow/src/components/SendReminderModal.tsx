import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReminder } from '@/lib/api/reminders';
import { X, Send, Loader2, Mail, MessageSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    client_id?: string;
    invoice_number: string;
    client_name: string;
    amount: number;
    currency: string;
    days_overdue: number;
    reminders_count: number;
    recommended_tone: 'friendly' | 'firm' | 'serious';
  };
}

const TONES = [
  { id: 'friendly', label: 'Friendly', desc: 'Warm nudge for good clients' },
  { id: 'firm',     label: 'Firm',     desc: 'Direct but professional' },
  { id: 'serious',  label: 'Serious',  desc: 'Strong language for late pay' },
];

const CHANNELS = [
  { id: 'email',    label: 'Email',    icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { id: 'sms',      label: 'SMS',      icon: Smartphone },
];

const TEMPLATES: Record<string, string> = {
  friendly: (invoice_number: string, client_name: string, amount: number, currency: string) =>
    `Hi ${client_name},\n\nJust a friendly reminder that invoice #${invoice_number} for ${currency === 'INR' ? '₹' : currency}${amount.toLocaleString()} is outstanding.\n\nIf you have any questions, feel free to reach out. Looking forward to your payment!\n\nThanks`,
  firm: (invoice_number: string, client_name: string, amount: number, currency: string) =>
    `Dear ${client_name},\n\nThis is a reminder that invoice #${invoice_number} for ${currency === 'INR' ? '₹' : currency}${amount.toLocaleString()} is past due.\n\nPlease arrange payment at your earliest convenience to avoid any disruption to our work.\n\nRegards`,
  serious: (invoice_number: string, client_name: string, amount: number, currency: string) =>
    `Dear ${client_name},\n\nInvoice #${invoice_number} for ${currency === 'INR' ? '₹' : currency}${amount.toLocaleString()} remains unpaid and is now significantly overdue.\n\nImmediate payment is required. Failure to settle this may result in further action.\n\nRegards`,
} as unknown as Record<string, string>;

function getTemplate(tone: string, invoice: SendReminderModalProps['invoice']): string {
  const fn = (TEMPLATES as unknown as Record<string, Function>)[tone];
  return fn ? fn(invoice.invoice_number, invoice.client_name, invoice.amount, invoice.currency) : '';
}

export function SendReminderModal({ isOpen, onClose, invoice }: SendReminderModalProps) {
  const queryClient = useQueryClient();
  const [tone, setTone] = useState<'friendly' | 'firm' | 'serious'>(invoice.recommended_tone);
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'sms'>('email');
  const [message, setMessage] = useState(() => getTemplate(invoice.recommended_tone, invoice));

  const sendMutation = useMutation({
    mutationFn: () => createReminder({
      invoice_id: invoice.id,
      client_id: invoice.client_id || undefined,
      channel,
      tone,
      message,
      status: 'sent',
      sent_at: new Date().toISOString(),
      scheduled_for: new Date().toISOString(),
      metadata: { sent_count: invoice.reminders_count + 1 },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-engine'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0F1A12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A3FF3F]/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-[#A3FF3F]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Send Reminder</h3>
              <p className="text-xs text-white/40">Invoice #{invoice.invoice_number} · {invoice.days_overdue} days overdue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Tone selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">Tone</label>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTone(t.id as 'friendly' | 'firm' | 'serious');
                    setMessage(getTemplate(t.id, invoice));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tone === t.id
                      ? 'bg-[#A3FF3F]/10 border-[#A3FF3F]/40 ring-1 ring-[#A3FF3F]/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/8'
                  }`}
                >
                  <p className={`text-sm font-bold ${tone === t.id ? 'text-[#A3FF3F]' : 'text-white'}`}>{t.label}</p>
                  <p className="text-[10px] text-white/40 mt-1 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your reminder message…"
              rows={7}
              className="w-full bg-[#0A0F0A] border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#A3FF3F]/40 resize-none transition-all"
            />
          </div>

          {/* Channel selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">Send via</label>
            <div className="flex flex-wrap gap-3">
              {CHANNELS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setChannel(c.id as 'email' | 'whatsapp' | 'sms')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    channel === c.id
                      ? 'bg-[#A3FF3F]/10 border-[#A3FF3F]/40 text-[#A3FF3F]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <c.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0A0F0A]/50 border-t border-white/8 flex items-center justify-between">
          <div className="text-xs text-white/30">
            {invoice.reminders_count > 0 && (
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#A3FF3F]" />
                {invoice.reminders_count} previous reminder{invoice.reminders_count !== 1 ? 's' : ''} sent
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={sendMutation.isPending || !message.trim()}
              onClick={() => sendMutation.mutate()}
              className="flex items-center gap-2 px-6 py-2 bg-[#A3FF3F] hover:bg-[#b8ff5c] text-[#0A0F0A] font-bold rounded-xl transition-all disabled:opacity-50 disabled:grayscale"
            >
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send reminder
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
