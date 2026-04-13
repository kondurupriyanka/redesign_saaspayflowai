import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, UserPlus, ChevronRight, Trash2, Pencil,
  Users, MoreHorizontal, AlertCircle, AlertTriangle, X, CreditCard, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ClientSlideOver } from '@/components/ClientSlideOver';
import { fetchClients, deleteClient, type Client, type ClientWithStats } from '@/lib/api/clients';
import { cn } from '@/lib/utils';
import { usePlan } from '@/hooks/usePlan';
import { Button } from '@/components/ui/button';
import { canAccessFeature, getClientLimit, isOwnerAccount } from '@/lib/access';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, currency = '₹') {
  if (n >= 1_00_000) return `${currency}${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)    return `${currency}${(n / 1_000).toFixed(1)}K`;
  return `${currency}${n.toFixed(0)}`;
}

type ClientStatus = 'overdue' | 'pending' | 'paid' | 'no_activity';

function clientStatus(c: ClientWithStats): ClientStatus {
  if (c.invoiceCount === 0) return 'no_activity';
  if (c.overdueAmount > 0) return 'overdue';
  if (c.totalBilled - c.totalPaid > 0.01) return 'pending';
  return 'paid';
}

function StatusBadge({ status }: { status: ClientStatus }) {
  const MAP: Record<ClientStatus, string> = {
    overdue:     'bg-red-500/10 text-red-400 border-red-500/15',
    pending:     'bg-white/5 text-white/50 border-white/10',
    paid:        'bg-[#A3FF3F]/10 text-[#A3FF3F] border-[#A3FF3F]/15',
    no_activity: 'bg-white/5 text-white/30 border-white/8',
  };
  const LABEL: Record<ClientStatus, string> = {
    overdue:     'Overdue',
    pending:     'Pending',
    paid:        'Paid',
    no_activity: 'No activity',
  };
  return (
    <span className={cn(
      'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border',
      MAP[status]
    )}>
      {LABEL[status]}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.04] animate-pulse">
      {[32, 36, 18, 18, 18, 14].map((w, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 bg-white/[0.06] rounded" style={{ width: `${w}%` }} />
        </td>
      ))}
      <td className="px-5 py-4"><div className="h-7 w-7 bg-white/[0.06] rounded-lg" /></td>
    </tr>
  );
}

// Plan limits for upgrade messaging
const PLAN_LIMITS_DISPLAY: Record<string, { label: string; next: string; nextMax: number }> = {
  free:   { label: 'Free (2 clients)',    next: 'Pro',    nextMax: 20 },
  pro:    { label: 'Pro (20 clients)',     next: 'Growth', nextMax: 50 },
  growth: { label: 'Growth (50 clients)', next: '',       nextMax: Infinity },
};

// ─── component ────────────────────────────────────────────────────────────────

export function Clients() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isOwner: authIsOwner } = useAuth();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [slideOpen, setSlideOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: clientList = [], isLoading, error } = useQuery<ClientWithStats[]>({
    queryKey: ['clients'],
    queryFn: () => fetchClients(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { plan, isOwner: planIsOwner } = usePlan();
  // Combine all owner checks: useAuth (uses Supabase user.email directly) + usePlan + email check
  const isOwner = authIsOwner || planIsOwner || isOwnerAccount(user?.email || '');
  const clientLimit = isOwner ? Infinity : getClientLimit(plan, user?.email || '');
  const canAdd = isOwner || canAccessFeature('client_creation', plan, user?.email || '', { clientCount: clientList.length });
  const isLimitReached = !canAdd;

  const planDisplay = PLAN_LIMITS_DISPLAY[plan] ?? PLAN_LIMITS_DISPLAY.free;

  // Filtered + sorted list
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return clientList
      .filter(c =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.company_name ?? '').toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const order: Record<ClientStatus, number> = { overdue: 0, pending: 1, paid: 2, no_activity: 3 };
        const as = clientStatus(a), bs = clientStatus(b);
        if (order[as] !== order[bs]) return order[as] - order[bs];
        return (b.totalBilled - b.totalPaid) - (a.totalBilled - a.totalPaid);
      });
  }, [clientList, search]);

  const totalOutstanding = clientList.reduce(
    (s, c) => s + Math.max(0, c.totalBilled - c.totalPaid), 0
  );

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setOpenMenu(null);
    deleteMutation.mutate(id);
  };

  const handleEdit = (c: Client) => {
    setEditClient(c);
    setSlideOpen(true);
    setOpenMenu(null);
  };

  const openAdd = () => {
    if (isLimitReached) { setShowUpgradeModal(true); return; }
    setEditClient(null);
    setSlideOpen(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0F0A]">
        <div className="w-6 h-6 border-2 border-[#A3FF3F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout pageTitle="Clients">
      <div className="space-y-5">

        {/* ── Header bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F1A12] border border-white/5 rounded-xl text-sm placeholder:text-white/25 text-white focus:outline-none focus:border-[#A3FF3F]/30 focus:ring-1 focus:ring-[#A3FF3F]/10 transition-all"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="sm:ml-auto flex items-center gap-3">
            {/* Owner Mode badge */}
            {isOwner && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#A3FF3F]/8 border border-[#A3FF3F]/15 text-[11px] font-semibold text-[#A3FF3F] tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                Owner Mode
              </span>
            )}

            {/* Usage counter (non-owners only) */}
            {!isOwner && (
              <span className="text-xs text-white/35 hidden sm:block">
                <span className={cn(
                  'font-semibold',
                  isLimitReached ? 'text-red-400' : clientList.length >= clientLimit * 0.8 ? 'text-amber-400' : 'text-white/60'
                )}>
                  {clientList.length}
                </span>
                {' / '}
                {clientLimit === Infinity ? '∞' : clientLimit} clients
              </span>
            )}

            {isLimitReached ? (
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="h-9 px-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium text-sm rounded-xl hover:bg-amber-500/15 transition-all"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Upgrade plan
              </Button>
            ) : (
              <Button
                onClick={openAdd}
                className="h-9 flex items-center gap-2 px-4 bg-[#A3FF3F] text-[#0A0F0A] font-semibold text-sm rounded-xl hover:bg-[#b8ff5c] transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add client
              </Button>
            )}
          </div>
        </div>

        {/* ── Limit banner ── */}
        {isLimitReached && (
          <div className="bg-amber-500/8 border border-amber-500/15 rounded-xl p-3.5 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200/70 leading-relaxed">
              You've reached the{' '}
              <span className="text-amber-400 font-medium">{clientLimit}-client limit</span>{' '}
              on the {planDisplay.label} plan.{' '}
              {planDisplay.next && (
                <>
                  <button
                    onClick={() => navigate('/settings?tab=billing')}
                    className="text-white underline hover:text-amber-200 transition-colors"
                  >
                    Upgrade to {planDisplay.next}
                  </button>{' '}
                  for up to {planDisplay.nextMax} clients.
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Error state ── */}
        {error && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-300">{(error as Error).message}</p>
          </div>
        )}

        {/* ── Table card ── */}
        <div className="bg-[#0F1A12] border border-white/5 rounded-xl overflow-hidden">

          {/* Summary row */}
          <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm bg-white/[0.01]">
            <div className="flex items-center gap-2 text-white/50">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium text-white">{filtered.length}</span>
              <span>client{filtered.length !== 1 ? 's' : ''}</span>
              {search && clientList.length !== filtered.length && (
                <span className="text-white/25">(of {clientList.length})</span>
              )}
            </div>
            {totalOutstanding > 0 && !search && (
              <>
                <span className="text-white/10">·</span>
                <span className="text-white/50">
                  Outstanding:{' '}
                  <span className="font-medium text-red-400">{fmt(totalOutstanding)}</span>
                </span>
              </>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Client', 'Email', 'Total Billed', 'Total Paid', 'Outstanding', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-medium text-white/30 whitespace-nowrap tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {isLoading
                  ? Array(5).fill(0).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white/20" />
                          </div>
                          <p className="text-white/35 text-sm">
                            {search ? `No clients matching "${search}"` : 'No clients yet'}
                          </p>
                          {!search && !isLimitReached && (
                            <button
                              onClick={openAdd}
                              className="text-[#A3FF3F] text-xs hover:text-[#b8ff5c] transition-colors"
                            >
                              Add your first client →
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  : filtered.map(client => {
                    const outstanding = Math.max(0, client.totalBilled - client.totalPaid);
                    const status = clientStatus(client);

                    return (
                      <tr
                        key={client.id}
                        className="group hover:bg-white/[0.015] transition-colors cursor-pointer"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        {/* Name */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#A3FF3F]/10 border border-[#A3FF3F]/10 flex items-center justify-center text-[13px] font-semibold text-[#A3FF3F] shrink-0">
                              {client.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-white leading-snug">{client.name}</p>
                              {client.company_name && (
                                <p className="text-[11px] text-white/35 leading-snug">{client.company_name}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] text-white/45">
                            {client.email || <span className="text-white/20">—</span>}
                          </span>
                        </td>

                        {/* Total Billed */}
                        <td className="px-5 py-3.5">
                          <span className="text-[13px] font-medium text-white tabular-nums">
                            {client.totalBilled > 0 ? fmt(client.totalBilled) : <span className="text-white/20">—</span>}
                          </span>
                        </td>

                        {/* Total Paid */}
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'text-[13px] tabular-nums',
                            client.totalPaid > 0 ? 'text-[#A3FF3F]' : 'text-white/20'
                          )}>
                            {client.totalPaid > 0 ? fmt(client.totalPaid) : '—'}
                          </span>
                        </td>

                        {/* Outstanding */}
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            'text-[13px] font-medium tabular-nums',
                            outstanding > 0
                              ? status === 'overdue' ? 'text-red-400' : 'text-white/60'
                              : 'text-white/20',
                          )}>
                            {outstanding > 0 ? fmt(outstanding) : '—'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <StatusBadge status={status} />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="relative flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/clients/${client.id}`)}
                              className="p-1.5 rounded-lg hover:bg-white/8 text-white/25 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                              title="View details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)}
                              className="p-1.5 rounded-lg hover:bg-white/8 text-white/25 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                              title="More options"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenu === client.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-[#0F1A12] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-20">
                                <button
                                  onClick={() => handleEdit(client)}
                                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full hover:bg-white/5 text-white/70 hover:text-white"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(client.id, client.name)}
                                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] w-full hover:bg-red-500/10 text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {openMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenu(null)}
        />
      )}

      {/* ── Add/Edit slide-over ── */}
      <ClientSlideOver
        open={slideOpen}
        onClose={() => { setSlideOpen(false); setEditClient(null); }}
        existing={editClient}
      />

      {/* ── Upgrade modal ── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/8 bg-[#0F1A12] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-400" />
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/8 text-white/30 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-[15px] font-semibold text-white mb-1.5">
              Client limit reached
            </h3>
            <p className="text-sm text-white/50 leading-relaxed mb-5">
              You're on the <span className="text-white/70 font-medium">{planDisplay.label}</span> plan
              ({clientList.length}/{clientLimit === Infinity ? '∞' : clientLimit} clients used).
              {planDisplay.next && (
                <> Upgrade to <span className="text-white/70 font-medium">{planDisplay.next}</span> for
                up to <span className="text-[#A3FF3F] font-medium">{planDisplay.nextMax} clients</span>.</>
              )}
            </p>

            <div className="space-y-2">
              {planDisplay.next && (
                <Button
                  onClick={() => navigate('/settings?tab=billing')}
                  className="w-full bg-[#A3FF3F] text-[#0A0F0A] hover:bg-[#b8ff5c] font-semibold"
                >
                  Upgrade to {planDisplay.next}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full border-white/10 bg-white/5 text-white/60 hover:bg-white/8 hover:text-white"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
