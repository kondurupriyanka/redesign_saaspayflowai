import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchInvoices, deleteInvoice, updateInvoiceStatus, sendInvoice } from '@/lib/api/invoices';
import { createPayment } from '@/lib/api/payments';
import type { Invoice } from '@/lib/api/invoices';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Plus, Search, Eye, Send, Trash2, FileText, AlertCircle, Bell, CheckCircle2, X, Copy, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SendReminderModal } from '@/components/SendReminderModal';
import { useAuth } from '@/hooks/useAuth';
import { usePlan } from '@/hooks/usePlan';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { canAccessFeature } from '@/lib/access';
import { getInvoiceStatus, getStatusColor, statusLabel } from '@/lib/invoiceStatus';


export default function Invoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [confirmPaidInvoice, setConfirmPaidInvoice] = useState<Invoice | null>(null);
  const [shareModal, setShareModal] = useState<{ shareUrl: string; invoiceNumber: string; clientName: string } | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  type ReminderInvoicePayload = {
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
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<ReminderInvoicePayload | null>(null);

  const { user } = useAuth();

  const { data: realInvoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetchInvoices(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const invoices = realInvoices;


  const { plan, limits } = usePlan();

  const activeInvoicesCount = (invoices || []).filter(inv =>
    ['draft', 'sent', 'overdue'].includes(getInvoiceStatus(inv))
  ).length;

  const isLimitReached = !canAccessFeature('invoice_creation', plan, user?.email || '', { activeInvoiceCount: activeInvoicesCount });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, markSent }: { id: string, status: string, markSent?: boolean }) => 
      updateInvoiceStatus(id, status, markSent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      await createPayment({
        invoice_id: invoice.id,
        amount: Number(invoice.amount),
        method: 'manual',
        reference: `Manual payment recorded for ${invoice.invoice_number}`,
        notes: 'Marked paid from invoice list',
      });
      await updateInvoiceStatus(invoice.id, 'paid');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to record payment');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSend = async (invoice: Invoice) => {
    setSendingId(invoice.id);
    try {
      const { shareUrl } = await sendInvoice(invoice.id);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setShareModal({
        shareUrl,
        invoiceNumber: invoice.invoice_number,
        clientName: invoice.client?.name || 'Client',
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send invoice');
    } finally {
      setSendingId(null);
    }
  };

  const copyShareLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenReminder = (invoice: Invoice) => {
    const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
    const remindersCount = invoice.reminders?.length || 0;
    
    let tone: 'friendly' | 'firm' | 'serious' = 'friendly';
    if (remindersCount === 1) tone = 'firm';
    if (remindersCount >= 2) tone = 'serious';

    setSelectedInvoiceForReminder({
      id: invoice.id,
      client_id: invoice.client?.id,
      invoice_number: invoice.invoice_number,
      client_name: invoice.client?.name || 'Unknown',
      amount: Number(invoice.amount),
      currency: invoice.currency,
      days_overdue: daysOverdue,
      reminders_count: remindersCount,
      recommended_tone: tone
    });
  };

  const handleMarkPaid = (invoice: Invoice) => {
    setConfirmPaidInvoice(invoice);
  };

  const confirmMarkPaid = () => {
    if (confirmPaidInvoice) {
      markPaidMutation.mutate(confirmPaidInvoice, {
        onSuccess: () => setConfirmPaidInvoice(null),
        onError: () => setConfirmPaidInvoice(null),
      });
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const tabs = ['All', 'Draft', 'Sent', 'Partial', 'Overdue', 'Paid'];

  const filteredInvoices = (invoices || []).filter(inv => {
    const computed = getInvoiceStatus(inv);
    const matchesTab = activeTab === 'All' || computed === activeTab.toLowerCase();
    const searchString = `${inv.invoice_number} ${inv.client?.name}`.toLowerCase();
    const matchesSearch = searchString.includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <DashboardLayout pageTitle="Invoices">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Invoices</h1>
          <p className="text-[#9CA3AF] mt-1 body-sm">Track, manage, and follow up on your invoices.</p>
        </div>
        {isLimitReached ? (
          <button 
            onClick={() => navigate('/settings?tab=billing')}
            className="inline-flex items-center px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold rounded-lg hover:bg-amber-500/20 transition-all group"
          >
            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
            Upgrade for Unlimited Invoices
          </button>
        ) : (
          <Link 
            to="/invoices/new"
            className="inline-flex items-center px-6 py-3 bg-[#A3FF3F] text-[#0A0F0A] font-bold rounded-xl hover:bg-[#8CE62E] transition-all shadow-[0_0_20px_rgba(163,255,63,0.3)] active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Invoice
          </Link>
        )}
      </div>

      {isLimitReached && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <p className="text-sm text-amber-200/80 font-medium">
            You've reached the <span className="text-amber-500">Free Plan limit</span> of {limits.maxInvoices} active invoice. 
            Upgrade to Pro for unlimited invoices and AI features.
          </p>
        </div>
      )}

      <div className="bg-[#0F1A12] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.01]">
          <div className="flex bg-[#0A0F0A] p-1 border border-white/5 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-[#A3FF3F] text-[#0A0F0A]' 
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]/40 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by ID or entity..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0A0F0A] border border-white/5 rounded-xl pl-11 pr-5 py-2.5 text-sm text-white placeholder-[#9CA3AF]/30 focus:outline-none focus:border-[#A3FF3F]/40 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {error ? (
            <div className="p-12 text-center text-red-400 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
              <p>Failed to load invoices. {error instanceof Error && error.message}</p>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center text-gray-400">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No invoices found</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                {search || activeTab !== 'All' 
                  ? "We couldn't find any invoices matching your filters." 
                  : "You haven't created any invoices yet. Create your first one to start getting paid!"}
              </p>
              {(!search && activeTab === 'All') && (
                isLimitReached ? (
                  <Button 
                    onClick={() => navigate('/settings?tab=billing')}
                    variant="outline"
                    className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  >
                    Upgrade for Unlimited Invoices
                  </Button>
                ) : (
                  <Link 
                    to="/invoices/new"
                    className="px-4 py-2 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Create Invoice
                  </Link>
                )
              )}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-white/[0.02]">
                <tr className="border-b border-white/5 text-[12px] font-medium text-[#9CA3AF]">
                  <th className="px-6 py-4 font-bold">Invoice ID</th>
                  <th className="px-6 py-4 font-bold">Client</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold hidden sm:table-cell">Due Date</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((invoice) => {
                  const computedStatus = getInvoiceStatus(invoice);
                  return (
                  <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{invoice.invoice_number}</div>
                      <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                        Created {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-200">{invoice.client?.name || 'Unknown Client'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{formatCurrency(invoice.amount, invoice.currency)}</div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="text-gray-400">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(computedStatus)}`}>
                        {statusLabel(computedStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          title="View"
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {computedStatus === 'draft' && (
                          <button
                            title="Send invoice"
                            onClick={() => handleSend(invoice)}
                            disabled={sendingId === invoice.id}
                            className="p-2 text-gray-400 hover:text-[#A3FF3F] hover:bg-[#A3FF3F]/10 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {sendingId === invoice.id
                              ? <span className="w-4 h-4 block border-2 border-[#A3FF3F]/50 border-t-[#A3FF3F] rounded-full animate-spin" />
                              : <Send className="w-4 h-4" />
                            }
                          </button>
                        )}
                        {computedStatus === 'overdue' && (
                          <button
                            title="Send Reminder"
                            onClick={() => setSelectedInvoiceForReminder(invoice)}
                            className="p-2 text-gray-400 hover:text-[#A3FF3F] hover:bg-[#A3FF3F]/10 rounded-lg transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                        {computedStatus !== 'paid' && (
                          <button
                            title="Record full payment"
                            onClick={() => handleMarkPaid(invoice)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/70 border border-white/10 bg-white/5 rounded-lg hover:border-[#A3FF3F]/30 hover:text-[#A3FF3F] hover:bg-[#A3FF3F]/8 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark paid
                          </button>
                        )}
                        <button
                          title="Delete"
                          onClick={() => handleDelete(invoice.id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedInvoiceForReminder && (
        <SendReminderModal 
          isOpen={!!selectedInvoiceForReminder}
          onClose={() => setSelectedInvoiceForReminder(null)}
          invoice={selectedInvoiceForReminder}
        />
      )}

      {/* ── Confirm Mark Paid dialog ─────────────────────────────── */}
      {confirmPaidInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmPaidInvoice(null)}
          />
          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0F1A12] p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setConfirmPaidInvoice(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-2xl bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-6 h-6 text-[#A3FF3F]" />
            </div>

            <h2 className="text-lg font-bold text-white mb-1">Record full payment?</h2>
            <p className="text-sm text-white/50 mb-5">
              This will record a payment of{' '}
              <span className="font-semibold text-white">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: confirmPaidInvoice.currency || 'INR',
                  maximumFractionDigits: 0,
                }).format(Number(confirmPaidInvoice.amount))}
              </span>{' '}
              for invoice <span className="font-semibold text-white">{confirmPaidInvoice.invoice_number}</span> (
              {confirmPaidInvoice.client?.name || 'Unknown client'}).
            </p>

            {/* Warning */}
            <div className="flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3.5 mb-6">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                This creates a permanent payment record. If marked in error, you will need to contact your client to recover the amount. Only confirm if you have received this payment.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPaidInvoice(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkPaid}
                disabled={markPaidMutation.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#A3FF3F] text-[#0A0F0A] text-sm font-bold hover:bg-[#b8ff5c] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {markPaidMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#0A0F0A]/30 border-t-[#0A0F0A] rounded-full animate-spin" />
                    Recording…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Yes, mark as paid
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Share link modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#0F1A12] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#A3FF3F]/12 border border-[#A3FF3F]/20 flex items-center justify-center">
                  <Send className="w-5 h-5 text-[#A3FF3F]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Invoice sent!</h2>
                  <p className="text-xs text-white/40">{shareModal.invoiceNumber} · {shareModal.clientName}</p>
                </div>
              </div>
              <button onClick={() => setShareModal(null)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-white/55 mb-4">Share this link with your client so they can view and pay the invoice.</p>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 mb-4 min-w-0">
              <span className="flex-1 text-xs text-white/50 truncate font-mono">{shareModal.shareUrl}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => copyShareLink(shareModal.shareUrl)}
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
