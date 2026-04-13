import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { fetchFinancialAnalytics, FinancialAnalytics } from '@/lib/api/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Lock,
  Download,
  ArrowUpRight,
  User,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Bell,
  Brain,
  ShieldCheck
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const Analytics = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FinancialAnalytics | null>(null);

  const isPro = profile?.plan === 'pro' || profile?.plan === 'growth';

  useEffect(() => {
    if (authLoading) return;

    if (isPro) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isPro, authLoading]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFinancialAnalytics();
      setData(result);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const headers = ['Invoice ID', 'Client', 'Amount', 'Date', 'Method'];
    const rows = (data?.tables?.recentActivity || []).map(p => [
      p.invoices?.invoice_number || 'N/A',
      p.invoices?.clients?.name || p.client || 'Unknown',
      p.amount,
      p.payment_date || p.date,
      p.method
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payflow_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout pageTitle="Analytics">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl bg-[#0F1A12]" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl bg-[#0F1A12]" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-2xl bg-[#0F1A12]" />
            <Skeleton className="h-[400px] rounded-2xl bg-[#0F1A12]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Analytics">
        <div className="relative h-[calc(100vh-120px)] flex flex-col items-center justify-center p-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="z-10 max-w-lg w-full bg-[#0F1A12] border border-red-500/20 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Analytics unavailable</h2>
            <p className="text-slate-400 mb-8 text-lg">{error}</p>
            <Button className="w-full h-14 bg-[#A3FF3F] hover:bg-[#b8ff5c] text-[#0A0F0A] font-bold text-lg rounded-2xl transition-all" onClick={loadData}>
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPro) {
    return (
      <DashboardLayout pageTitle="Analytics">
        <div className="relative h-[calc(100vh-120px)] flex flex-col items-center justify-center p-6 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#A3FF3F]/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="z-10 max-w-lg w-full bg-[#0F1A12] border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-[#A3FF3F]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-[#A3FF3F]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Unlock Professional Analytics</h2>
            <p className="text-slate-400 mb-8 text-lg">
              Get deep insights into client behavior, revenue trends, and payment reliability. Upgrade to Pro to grow your business with data.
            </p>
            
            <div className="space-y-4 mb-10 text-left">
              {[
                'Historical payment behavior per client',
                '12-month revenue trend forecasting',
                'Advanced reliability scores for every client',
                'CSV & PDF data exports'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-[#A3FF3F]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <Button className="w-full h-14 bg-[#A3FF3F] hover:bg-[#b8ff5c] text-[#0A0F0A] font-bold text-lg rounded-2xl transition-all shadow-[0_0_20px_rgba(163,255,63,0.3)]">
              Upgrade Now
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { kpis, charts, tables, insights } = data || {};
  const recentActivity = tables?.recentActivity || [];
  const topClients = tables?.topClients || [];
  const worstClients = tables?.worstClients || [];
  const statusDistribution = charts?.statusDistribution || [];
  const revenueTrend = charts?.revenueTrend || [];
  const atRiskAmount = revenueTrend.reduce((sum, month) => sum + month.overdue, 0);
  const atRiskLabel = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(atRiskAmount || 0);

  return (
    <DashboardLayout pageTitle="Financial Intelligence">
      <div className="space-y-6">
        {/* Smart AI Insights Hero */}
        <div className="bg-gradient-to-br from-[#111A12] to-[#0A0F0A] border border-[#A3FF3F]/10 rounded-3xl p-8 relative overflow-hidden group shadow-[0_0_40px_rgba(163,255,63,0.05)]">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-32 h-32 text-[#A3FF3F]" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#A3FF3F]/10 border border-[#A3FF3F]/20 text-[#A3FF3F] text-xs font-medium mb-6">
              <Brain className="w-3 h-3 mr-2" />
              AI autopilot active
            </div>
            
            <h2 className="heading-xl text-white mb-4">
              Predictive Recovery: <span className="text-[#A3FF3F] font-extrabold italic">{atRiskLabel}</span> at risk
            </h2>
            
            <p className="text-[#9CA3AF] text-sm mb-6 leading-relaxed">
              The current collection rate is <span className="text-white font-medium">{kpis?.collectionRate?.toFixed(1) || '0.0'}%</span>. Send reminders on{' '}
              <span className="text-white font-medium">{insights?.bestDayToSend || 'your best day'}</span> to improve recovery.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => {}}
                className="px-6 py-3 bg-[#A3FF3F] text-[#0A0F0A] font-bold h-auto rounded-xl hover:bg-[#8CE62E] transition-all shadow-[0_0_20px_rgba(163,255,63,0.4)] active:scale-95"
              >
                Boost Reminders
              </Button>
              <Button variant="outline" className="px-6 py-3 bg-white/5 text-white font-semibold h-auto rounded-xl hover:bg-white/10 border-white/5">
                View Forecast
              </Button>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden hover:border-[#A3FF3F]/30 transition-all shadow-[0_0_20px_rgba(163,255,63,0.03)] hover:scale-[1.02] duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#A3FF3F]/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-[#A3FF3F]" />
                </div>
                <div className="flex items-center gap-1 text-[#A3FF3F] text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  +12.4%
                </div>
              </div>
              <p className="caption-md text-[#9CA3AF]">Collection rate</p>
              <h3 className="text-[28px] font-semibold text-white mt-1">{kpis?.collectionRate?.toFixed(1) || '0.0'}%</h3>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden hover:border-[#A3FF3F]/30 transition-all shadow-[0_0_20px_rgba(163,255,63,0.03)] hover:scale-[1.02] duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl">
                  <Clock className="w-6 h-6 text-white/50" />
                </div>
                <div className="text-slate-500 text-xs">Target: 7 days</div>
              </div>
              <p className="caption-md text-[#9CA3AF]">Avg days to pay</p>
              <h3 className="text-[28px] font-semibold text-white mt-1">{Math.round(kpis?.avgDaysToPayment || 0)} days</h3>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden hover:border-[#A3FF3F]/30 transition-all shadow-[0_0_20px_rgba(163,255,63,0.03)] hover:scale-[1.02] duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#A3FF3F]/10 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-[#A3FF3F]" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  +5%
                </div>
              </div>
              <p className="caption-md text-[#9CA3AF]">On-time rate</p>
              <h3 className="text-[28px] font-semibold text-white mt-1">{kpis?.onTimeRate?.toFixed(1) || '0.0'}%</h3>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden hover:border-[#A3FF3F]/30 transition-all shadow-[0_0_20px_rgba(163,255,63,0.03)] hover:scale-[1.02] duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#A3FF3F]/20 rounded-xl">
                  <DollarSign className="w-6 h-6 text-[#A3FF3F]" />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white" onClick={handleExportCSV}>
                   <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="caption-md text-[#9CA3AF]">Revenue (MTD)</p>
              <h3 className="text-[28px] font-semibold text-white mt-1">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(kpis?.mrr || 0)}
              </h3>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="border-b border-white/5 mb-6">
              <CardTitle className="heading-sm text-white">Revenue Intelligence</CardTitle>
              <CardDescription className="text-[#9CA3AF]">Paid vs Overdue volume (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F1A12', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    name="Paid" 
                    stroke="#A3FF3F" 
                    strokeWidth={4} 
                    dot={{ fill: '#A3FF3F', strokeWidth: 0, r: 4 }} 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#A3FF3F', className: 'drop-shadow-[0_0_8px_rgba(163,255,63,0.8)]' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overdue" 
                    name="Overdue" 
                    stroke="#EF4444" 
                    strokeWidth={2} 
                    strokeDasharray="5 5" 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="border-b border-white/5 mb-6">
              <CardTitle className="heading-sm text-white">Invoice Status</CardTitle>
              <CardDescription className="text-[#9CA3AF]">Current portfolio distribution</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F1A12', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-8 w-full px-4 text-[11px] font-medium text-[#9CA3AF]">
                {statusDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="capitalize">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
              <div>
                <CardTitle className="heading-sm text-white">Power Clients</CardTitle>
                <CardDescription className="text-[#9CA3AF]">By total revenue liquified</CardDescription>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#A3FF3F]/10 flex items-center justify-center text-[#A3FF3F]">
                <TrendingUp className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {topClients.map((client, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-bold">
                        {client.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{client.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{client.paidCount} settlements</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#A3FF3F]">${(client.revenue || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-[#9CA3AF]">Verified vol.</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
              <div>
                <CardTitle className="heading-sm text-white">Reliability Report</CardTitle>
                <CardDescription className="text-[#9CA3AF]">Highest latency risk profiles</CardDescription>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertCircle className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {worstClients.map((client, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-400 font-bold">
                        !
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(client.reliabilityScore || 0) > 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                            SCORE: {Math.round(client.reliabilityScore || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-400">+{Math.round(client.avgDelay || 0)} days</p>
                      <p className="text-[10px] text-[#9CA3AF]">Avg delay</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Intelligence Ledger / Table */}
        <Card className="bg-[#0F1A12] border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            <div>
              <CardTitle className="heading-sm text-white">Intelligence ledger</CardTitle>
              <CardDescription className="text-[#9CA3AF]">Recent liquidation events across your portfolio</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <CardContent className="p-0">
             <div className="w-full overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="text-[12px] text-[#9CA3AF] font-medium bg-white/[0.02]">
                      <tr>
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Liquidated Amount</th>
                        <th className="px-6 py-4">Settlement Date</th>
                        <th className="px-6 py-4 text-right">Channel</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {recentActivity.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-white/40">
                            No recent payments yet.
                          </td>
                        </tr>
                      ) : recentActivity.map((p, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-[#A3FF3F]">
                           <td className="px-6 py-4 font-bold text-[#A3FF3F]">{p.invoices?.invoice_number || 'PF-001'}</td>
                           <td className="px-6 py-4 text-white font-medium">{p.invoices?.clients?.name || 'Client'}</td>
                           <td className="px-6 py-4 text-white font-bold">${p.amount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-[#9CA3AF]">{format(parseISO(p.payment_date || p.date || new Date().toISOString()), 'MMM d, yyyy')}</td>
                           <td className="px-6 py-4 text-right">
                              <span className="px-2.5 py-1 rounded-lg bg-white/5 text-[12px] font-medium text-[#9CA3AF] border border-white/5">
                                {p.method}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
