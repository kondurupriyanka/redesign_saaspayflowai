import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Bell,
  FileText,
  CreditCard,
  AlertCircle,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/DashboardLayout';
import { fetchDashboardData, type ActivityEvent } from '@/lib/api/dashboard';
import { cn } from '@/lib/utils';
import { useReminderEngine } from '@/hooks/useReminderEngine';
import type { OverdueReport } from '@/hooks/useReminderEngine';
import { SendReminderModal } from '@/components/SendReminderModal';
import { Button } from '@/components/ui/button';

// ───────────── helpers ─────────────
function formatINR(n: number) {
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

// ───────────── Skeleton ─────────────
function SkeletonCard() {
  return (
    <div className="bg-[#0F1A12] border border-white/5 rounded-xl p-5 animate-pulse space-y-3">
      <div className="h-3 w-24 bg-white/8 rounded" />
      <div className="h-7 w-32 bg-white/10 rounded" />
      <div className="h-2.5 w-16 bg-white/5 rounded" />
    </div>
  );
}

// ───────────── Stat Card ─────────────
interface StatProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconCls: string;
  accent?: boolean;
}

function StatCard({ title, value, sub, icon: Icon, iconCls, accent }: StatProps) {
  return (
    <div className={cn(
      'bg-[#0F1A12] border rounded-xl p-5 transition-colors',
      accent ? 'border-red-500/20' : 'border-white/5 hover:border-white/10',
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[12px] font-medium text-white/40">{title}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconCls)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={cn('text-[28px] font-semibold tracking-tight', accent ? 'text-red-400' : 'text-white')}>{value}</p>
      {sub && <p className="mt-1 text-[12px] text-white/35">{sub}</p>}
    </div>
  );
}

// ───────────── Activity icon map ─────────────
const ACTIVITY_META: Record<
  ActivityEvent['type'],
  { icon: React.ElementType; iconCls: string; prefix: string }
> = {
  invoice_created:  { icon: FileText,   iconCls: 'bg-white/5 text-white/40',         prefix: '' },
  payment_received: { icon: CreditCard, iconCls: 'bg-[#A3FF3F]/10 text-[#A3FF3F]',  prefix: '+' },
  reminder_sent:    { icon: Bell,       iconCls: 'bg-white/5 text-white/40',          prefix: '' },
  invoice_overdue:  { icon: AlertCircle,iconCls: 'bg-red-500/10 text-red-400',        prefix: '' },
};

// ───────────── Custom Tooltip ─────────────
type ChartTooltipEntry = { name?: string; value?: number; color?: string };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: ChartTooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111A12] border border-white/10 rounded-lg px-3 py-2.5 text-sm shadow-xl">
      <p className="text-white/50 mb-1.5 text-xs">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-5">
          <span className="text-xs">{entry.name}</span>
          <span className="font-semibold text-xs">{formatINR(entry.value ?? 0)}</span>
        </p>
      ))}
    </div>
  );
}

// ───────────── Status badge ─────────────
function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, string> = {
    paid:    'bg-[#A3FF3F]/10 text-[#A3FF3F]',
    pending: 'bg-white/5 text-white/50',
    sent:    'bg-white/5 text-white/50',
    overdue: 'bg-red-500/10 text-red-400',
    draft:   'bg-white/5 text-white/35',
  };
  return (
    <span className={cn(
      'inline-block text-[11px] font-medium px-2 py-0.5 rounded-md',
      MAP[status] ?? 'bg-white/5 text-white/35',
    )}>
      {status}
    </span>
  );
}

// ───────────── Empty state ─────────────
function EmptyState({ message, action, onAction }: { message: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
        <FileText className="w-5 h-5 text-white/20" />
      </div>
      <p className="text-white/35 text-sm">{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="text-xs text-[#A3FF3F] hover:text-[#b8ff5c] font-medium transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          {action}
        </button>
      )}
    </div>
  );
}

// ───────────── Main Dashboard ─────────────
export function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { report: overdueReport, needsAttentionCount } = useReminderEngine();
  const [selectedOverdue, setSelectedOverdue] = useState<OverdueReport | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: fetchDashboardData,
    enabled: !!user,
    staleTime: 30_000,
    gcTime: 300_000,
    retry: 1,
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0F0A]">
        <div className="w-6 h-6 border-2 border-[#A3FF3F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayData = data;
  const loading = isLoading;
  const moneyAtRisk = (overdueReport ?? []).reduce((sum, invoice) => sum + invoice.amount, 0);
  const nextUrgentInvoice = overdueReport?.[0];
  const hasData = (displayData?.stats.totalRevenue ?? 0) > 0 || (displayData?.recentInvoices.length ?? 0) > 0;

  return (
    <DashboardLayout pageTitle="Dashboard" unreadCount={0}>

      {/* ── HERO ── */}
      <div className="mb-6 rounded-2xl border border-white/5 bg-[#0F1A12] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* Left: headline + actions */}
          <div className="space-y-5">
            {needsAttentionCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/8 px-3 py-1 text-[11px] font-medium text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {needsAttentionCount} {needsAttentionCount === 1 ? 'invoice needs' : 'invoices need'} attention
              </div>
            )}

            <div>
              <h1 className="text-[32px] font-bold tracking-tight text-white leading-tight">
                {hasData ? 'Your payment pipeline' : 'Get your first invoice out'}
              </h1>
              <p className="mt-2 text-sm text-white/50 leading-relaxed max-w-md">
                {hasData
                  ? 'Track overdue invoices, send reminders, and collect faster.'
                  : 'Add a client, create an invoice, and send your first reminder.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate('/invoices/new')}
                className="h-10 rounded-xl bg-[#A3FF3F] px-4 text-sm font-semibold text-[#0A0F0A] hover:bg-[#b8ff5c]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New invoice
              </Button>
              <Button
                onClick={() => navigate('/clients')}
                variant="outline"
                className="h-10 rounded-xl border-white/10 bg-white/5 px-4 text-sm font-medium text-white hover:bg-white/8"
              >
                Add client
              </Button>
              <Button
                onClick={() => navigate('/invoices')}
                variant="outline"
                className="h-10 rounded-xl border-white/10 bg-white/5 px-4 text-sm font-medium text-white hover:bg-white/8"
              >
                View invoices
              </Button>
            </div>
          </div>

          {/* Right: money at risk + next action */}
          <div className="grid gap-3 content-start">
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-[11px] font-medium text-white/40">Money at risk</p>
              <p className={cn(
                'mt-2 text-[28px] font-semibold tracking-tight',
                moneyAtRisk > 0 ? 'text-red-400' : 'text-white',
              )}>
                {formatINR(moneyAtRisk)}
              </p>
              <p className="mt-1 text-[12px] text-white/35">
                {needsAttentionCount > 0 ? `${needsAttentionCount} overdue invoice${needsAttentionCount !== 1 ? 's' : ''}` : 'All clear'}
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <p className="text-[11px] font-medium text-white/40">Next action</p>
              <p className="mt-2 text-sm font-medium text-white leading-snug">
                {nextUrgentInvoice
                  ? `Send a ${nextUrgentInvoice.recommended_tone} reminder for ${nextUrgentInvoice.invoice_number}`
                  : 'No urgent reminders right now'}
              </p>
              {nextUrgentInvoice && (
                <button
                  onClick={() => setSelectedOverdue(nextUrgentInvoice)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-[#A3FF3F] hover:text-[#b8ff5c] transition-colors"
                >
                  Send reminder <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div className="col-span-4 bg-red-500/8 border border-red-500/15 rounded-xl p-5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-300">Failed to load data</p>
              <p className="text-xs text-red-400/60 mt-0.5">{(error as Error).message}</p>
            </div>
          </div>
        ) : (
          <>
            <StatCard
              title="Total billed"
              value={formatINR(displayData?.stats.totalBilled ?? 0)}
              sub="Sum of all invoices"
              icon={FileText}
              iconCls="bg-white/5 text-white/40"
            />
            <StatCard
              title="Paid"
              value={formatINR(displayData?.stats.totalRevenue ?? 0)}
              sub="Confirmed payments received"
              icon={TrendingUp}
              iconCls="bg-[#A3FF3F]/10 text-[#A3FF3F]"
            />
            <StatCard
              title="Outstanding (unpaid)"
              value={formatINR(displayData?.stats.outstandingAmount ?? 0)}
              sub="Pending + overdue invoices"
              icon={AlertTriangle}
              iconCls="bg-red-500/10 text-red-400"
              accent={(displayData?.stats.outstandingAmount ?? 0) > 0}
            />
            <StatCard
              title="Reminders sent"
              value={String(displayData?.stats.remindersSent ?? 0)}
              sub="Total auto-reminders"
              icon={Bell}
              iconCls="bg-white/5 text-white/40"
            />
          </>
        )}
      </div>

      {/* ── CHART + ACTIVITY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">

        {/* Revenue chart */}
        <div className="lg:col-span-3 bg-[#0F1A12] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Revenue overview</h3>
              <p className="text-[11px] text-white/35 mt-0.5">Last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#A3FF3F]/80 inline-block" /> Collected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500/70 inline-block" /> Overdue
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-48 bg-white/5 rounded-lg animate-pulse" />
          ) : displayData?.revenueChart.every(d => d.revenue === 0 && d.overdue === 0) ? (
            <EmptyState
              message="No revenue data yet."
              action="Create your first invoice"
              onAction={() => navigate('/invoices/new')}
            />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={displayData?.revenueChart}
                barCategoryGap="35%"
                barGap={3}
                margin={{ top: 0, right: 0, left: -22, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={v => formatINR(v)}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11 }}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="revenue" name="Collected" fill="#A3FF3F" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                <Bar dataKey="overdue" name="Overdue" fill="#ef4444" fillOpacity={0.65} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 bg-[#0F1A12] border border-white/5 rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Recent activity</h3>

          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-white/8 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-36 bg-white/8 rounded" />
                    <div className="h-2.5 w-16 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !displayData?.activityFeed.length ? (
            <EmptyState message="No activity yet." />
          ) : (
            <div className="space-y-0.5 flex-1 overflow-y-auto">
              {displayData.activityFeed.map(event => {
                const meta = ACTIVITY_META[event.type];
                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/3 transition-colors"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.iconCls)}>
                      <meta.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white/80 truncate">{event.description}</p>
                      {event.amount !== undefined && (
                        <p className={cn('text-[11px] font-semibold', event.type === 'payment_received' ? 'text-[#A3FF3F]' : 'text-white/35')}>
                          {meta.prefix}{formatINR(event.amount)}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-white/25 shrink-0 tabular-nums">{event.timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RECENT INVOICES ── */}
      <div className="bg-[#0F1A12] border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Recent invoices</h3>
          <button
            onClick={() => navigate('/invoices')}
            className="text-[11px] text-[#A3FF3F] hover:text-[#b8ff5c] font-medium transition-colors flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-11 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !displayData?.recentInvoices.length ? (
          <EmptyState
            message="No invoices yet."
            action="Create your first invoice"
            onAction={() => navigate('/invoices/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-white/35">Invoice</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-white/35">Client</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-white/35">Due date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-white/35">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium text-white/35">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium text-white/35" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {displayData.recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/[0.015] transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-medium text-white">{inv.invoice_number}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-white/50">{(inv as any).client_name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] text-white/50 tabular-nums">{inv.due_date}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-semibold text-white">{formatINR(inv.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="text-[11px] text-white/25 hover:text-[#A3FF3F] transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-auto"
                      >
                        Open <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOverdue && (
        <SendReminderModal
          isOpen={!!selectedOverdue}
          onClose={() => setSelectedOverdue(null)}
          invoice={selectedOverdue}
        />
      )}
    </DashboardLayout>
  );
}
