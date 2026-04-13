import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin,
  FileText, TrendingUp, Wallet, AlertCircle, CheckCircle2,
  Link2, Loader2, Plus, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ClientSlideOver } from '@/components/ClientSlideOver';
import { fetchClientDetail, generatePortalLink, updateClient, type Client } from '@/lib/api/clients';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── formatters ───────────────────────────────
function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

// ─── Status badge ─────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, string> = {
    paid:      'bg-[#A3FF3F]/10 text-[#A3FF3F]',
    pending:   'bg-white/5 text-white/50',
    overdue:   'bg-red-500/10 text-red-400',
    sent:      'bg-white/5 text-white/50',
    cancelled: 'bg-white/5 text-white/30',
  };
  return (
    <span className={cn('inline-block text-[11px] font-medium px-2 py-0.5 rounded-md', MAP[status] ?? 'bg-white/5 text-white/30')}>
      {status}
    </span>
  );
}

// ─── MAIN PAGE ────────────────────────────────
export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailForm, setDetailForm] = useState({
    phone: '', whatsapp: '', company_name: '', address: '', notes: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClientDetail(id!),
    enabled: !!id && !!user,
    staleTime: 30_000,
  });

  const detail = data;
  const client = detail?.client;
  const outstanding = (detail?.totalBilled ?? 0) - (detail?.totalPaid ?? 0);

  useEffect(() => {
    if (client) {
      setDetailForm({
        phone: client.phone ?? '',
        whatsapp: client.whatsapp ?? '',
        company_name: client.company_name ?? '',
        address: client.address ?? '',
        notes: client.notes ?? '',
      });
    }
  }, [client]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Client>) => updateClient(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      toast.success('Client updated');
      setIsEditingDetails(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handlePortalLink = async () => {
    try {
      setGeneratingPortal(true);
      const link = await generatePortalLink(id!);
      await navigator.clipboard.writeText(link);
      toast.success('Portal link copied to clipboard');
    } catch (e: any) {
      toast.error('Failed to generate link', { description: e.message });
    } finally {
      setGeneratingPortal(false);
    }
  };

  if (isLoading) return (
    <DashboardLayout pageTitle="Client">
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border-2 border-[#A3FF3F] border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (error || !client) return (
    <DashboardLayout pageTitle="Client">
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-white/50 text-sm">Client not found</p>
        <button onClick={() => navigate('/clients')} className="text-xs text-[#A3FF3F] hover:underline">
          Back to clients
        </button>
      </div>
    </DashboardLayout>
  );

  const inputCls = 'w-full bg-[#0A0F0A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#A3FF3F]/30 transition-colors';

  return (
    <DashboardLayout pageTitle={client.name}>
      <div className="space-y-5">

        {/* Nav + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to clients
          </button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate(`/invoices/new?client_id=${client.id}`)}
              className="h-9 px-3.5 bg-[#A3FF3F] text-[#0A0F0A] text-sm font-semibold rounded-xl hover:bg-[#8CE62E]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create invoice
            </Button>
            <Button
              onClick={handlePortalLink}
              disabled={generatingPortal}
              variant="outline"
              className="h-9 px-3.5 border-white/10 bg-white/5 text-white text-sm font-medium rounded-xl hover:bg-white/8"
            >
              {generatingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 mr-1.5" />}
              Copy portal link
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

          {/* ── LEFT PANEL ── */}
          <div className="xl:col-span-1 space-y-4">

            {/* Identity card */}
            <div className="bg-[#0F1A12] border border-white/5 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#A3FF3F]/10 flex items-center justify-center text-xl font-bold text-[#A3FF3F] shrink-0">
                  {client.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">{client.name}</h2>
                  {client.company_name && (
                    <p className="text-xs text-white/40 truncate">{client.company_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 mb-4">
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-white/30" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-white/30" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start gap-2 text-sm text-white/50">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-white/30 mt-0.5" />
                    <span className="leading-snug">{client.address}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setEditOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/8 text-xs font-medium text-white/50 hover:text-white hover:border-white/15 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit client
              </button>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="bg-[#0F1A12] border border-white/5 rounded-xl p-4">
                <p className="text-[11px] font-medium text-white/35 mb-2">Notes</p>
                <p className="text-sm text-white/60 leading-relaxed">{client.notes}</p>
              </div>
            )}

            {/* Optional details edit */}
            <div className="bg-[#0F1A12] border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => setIsEditingDetails(!isEditingDetails)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs text-white/40 hover:text-white/60 transition-colors border-b border-white/5"
              >
                <span className="font-medium">Additional details</span>
                <span>{isEditingDetails ? 'Cancel' : 'Edit'}</span>
              </button>

              {isEditingDetails ? (
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-white/35 block mb-1">Phone</label>
                    <input
                      className={inputCls}
                      value={detailForm.phone}
                      onChange={e => setDetailForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91…"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/35 block mb-1">Company name</label>
                    <input
                      className={inputCls}
                      value={detailForm.company_name}
                      onChange={e => setDetailForm(f => ({ ...f, company_name: e.target.value }))}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/35 block mb-1">Address</label>
                    <textarea
                      className={cn(inputCls, 'resize-none h-16')}
                      value={detailForm.address}
                      onChange={e => setDetailForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Street, city…"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-white/35 block mb-1">Notes</label>
                    <textarea
                      className={cn(inputCls, 'resize-none h-16')}
                      value={detailForm.notes}
                      onChange={e => setDetailForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Private notes…"
                    />
                  </div>
                  <Button
                    onClick={() => updateMutation.mutate(detailForm)}
                    disabled={updateMutation.isPending}
                    className="w-full h-9 bg-[#A3FF3F] text-[#0A0F0A] text-sm font-semibold hover:bg-[#8CE62E]"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
                  </Button>
                </div>
              ) : (
                <p className="px-4 py-3 text-xs text-white/25">Phone, address, notes</p>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="xl:col-span-3 space-y-5">

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0F1A12] border border-white/5 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-white/40 mb-1">Total billed</p>
                  <p className="text-2xl font-semibold text-white tabular-nums">{fmt(detail?.totalBilled ?? 0)}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-white/30" />
                </div>
              </div>

              <div className="bg-[#0F1A12] border border-[#A3FF3F]/15 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-white/40 mb-1">Total paid</p>
                  <p className="text-2xl font-semibold text-[#A3FF3F] tabular-nums">{fmt(detail?.totalPaid ?? 0)}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-[#A3FF3F]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#A3FF3F]" />
                </div>
              </div>

              <div className={cn(
                'bg-[#0F1A12] rounded-xl p-5 flex items-center justify-between',
                outstanding > 0 ? 'border border-red-500/20' : 'border border-white/5',
              )}>
                <div>
                  <p className="text-[11px] font-medium text-white/40 mb-1">Outstanding</p>
                  <p className={cn(
                    'text-2xl font-semibold tabular-nums',
                    outstanding > 0 ? 'text-red-400' : 'text-white/30',
                  )}>
                    {fmt(outstanding)}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white/30" />
                </div>
              </div>
            </div>

            {/* Invoice history */}
            <div className="bg-[#0F1A12] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white/30" />
                  <h3 className="text-sm font-semibold text-white">Invoice history</h3>
                  <span className="text-[11px] text-white/30">{detail?.invoices.length} invoices</span>
                </div>
                <button
                  onClick={() => navigate(`/invoices/new?client_id=${client.id}`)}
                  className="text-[11px] text-[#A3FF3F] hover:text-[#b8ff5c] font-medium transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> New invoice
                </button>
              </div>

              {!detail?.invoices.length ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white/20" />
                  </div>
                  <p className="text-sm text-white/35">No invoices yet</p>
                  <button
                    onClick={() => navigate(`/invoices/new?client_id=${client.id}`)}
                    className="text-xs text-[#A3FF3F] hover:text-[#b8ff5c] transition-colors"
                  >
                    Create first invoice
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Invoice', 'Amount', 'Due date', 'Status', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-white/35">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {detail.invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-white/[0.015] transition-colors group cursor-pointer"
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                        >
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-medium text-white group-hover:text-[#A3FF3F] transition-colors">
                              {inv.invoice_number}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-semibold text-white tabular-nums">{fmt(inv.amount)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] text-white/50 tabular-nums">{inv.due_date}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                            {['pending', 'overdue', 'sent'].includes(inv.status) && (
                              <button
                                onClick={() => navigate('/reminders')}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-white/30 hover:text-white/70 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Bell className="w-3 h-3" /> Send reminder
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-white/5 bg-white/[0.01]">
                      <tr>
                        <td className="px-5 py-3 text-[11px] text-white/30">Total</td>
                        <td className="px-5 py-3">
                          <span className="text-[13px] font-semibold text-white tabular-nums">{fmt(detail.totalBilled)}</span>
                          <span className="text-[11px] text-[#A3FF3F] ml-2">{fmt(detail.totalPaid)} paid</span>
                        </td>
                        <td colSpan={3} className="px-5 py-3">
                          {outstanding > 0 && (
                            <span className="text-[11px] text-red-400 tabular-nums">{fmt(outstanding)} outstanding</span>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {client && (
        <ClientSlideOver
          open={editOpen}
          onClose={() => setEditOpen(false)}
          existing={client}
        />
      )}
    </DashboardLayout>
  );
}
