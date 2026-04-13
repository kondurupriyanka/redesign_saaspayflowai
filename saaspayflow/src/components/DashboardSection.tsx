import { TrendingUp, AlertTriangle, Bell, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const activityItems = [
  { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', text: 'Payment received from Arjun', amount: '₹15,000', time: '1 hr ago' },
  { icon: Send, color: 'text-warning', bg: 'bg-warning/10', text: 'Reminder sent to Priya Sharma', amount: '₹28,000', time: '2 hrs ago' },
  { icon: XCircle, color: 'text-overdue', bg: 'bg-overdue/10', text: 'Final notice — Rahul Verma', amount: '₹45,000', time: 'Overdue 7 days' },
  { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', text: 'Payment received from Meera', amount: '₹12,500', time: '5 hrs ago' },
  { icon: Bell, color: 'text-primary', bg: 'bg-primary/10', text: 'Auto-reminder scheduled for Kiran', amount: '₹35,000', time: 'Tomorrow' },
];

const monthlyData = [
  { month: 'Jan', paid: 75, overdue: 10 },
  { month: 'Feb', paid: 60, overdue: 20 },
  { month: 'Mar', paid: 85, overdue: 5 },
  { month: 'Apr', paid: 50, overdue: 25 },
  { month: 'May', paid: 90, overdue: 8 },
  { month: 'Jun', paid: 70, overdue: 15 },
];

const DashboardSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden" ref={ref}>
      {/* Section radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 30% 50%, hsl(84 100% 62% / 0.05) 0%, transparent 70%)',
      }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20">
          <p className="caption-lg text-primary mb-4">Your dashboard</p>
          <h2 className="display-md mb-8">
            See who owes you — <span className="text-gradient">instantly</span>
          </h2>
          <p className="body-lg text-muted-foreground max-w-3xl">Complete visibility into your payment pipeline. Real-time tracking of outstanding invoices, automated reminders, and actionable insights.</p>
        </div>

        {/* Gradient-border outer container */}
        <div className={`rounded-2xl p-px ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
          }}>
          <div className="rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm p-8 md:p-12">
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="stat-card rounded-xl bg-gradient-to-br from-primary/12 to-primary/4 p-8 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle 200px at 50% 50%, hsl(84 100% 62% / 0.06) 0%, transparent 70%)' }} />
                <p className="caption-md text-muted-foreground mb-3 font-medium relative z-10">Total revenue</p>
                <p className="text-3xl font-bold mb-2 relative z-10">₹3,24,000</p>
                <span className="text-xs text-success flex items-center gap-1 relative z-10"><TrendingUp className="w-4 h-4" />+12% this month</span>
              </div>
              <div className="stat-card rounded-xl bg-gradient-to-br from-warning/12 to-warning/4 p-8 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle 200px at 50% 50%, hsl(38 92% 50% / 0.06) 0%, transparent 70%)' }} />
                <p className="caption-md text-muted-foreground mb-3 font-medium relative z-10">Pending</p>
                <p className="text-3xl font-bold text-warning mb-2 relative z-10">₹1,23,000</p>
                <span className="text-xs text-muted-foreground relative z-10">5 invoices</span>
              </div>
              <div className="stat-card rounded-xl bg-gradient-to-br from-overdue/12 to-overdue/4 p-8 relative group overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle 200px at 50% 50%, hsl(0 84% 60% / 0.06) 0%, transparent 70%)' }} />
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-overdue z-20" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                <p className="caption-md text-muted-foreground mb-3 font-medium relative z-10">Overdue</p>
                <p className="text-3xl font-bold text-overdue mb-2 relative z-10">₹45,000</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1 relative z-10"><AlertTriangle className="w-4 h-4" />2 clients overdue</span>
              </div>
              <div className="stat-card rounded-xl bg-gradient-to-br from-primary/12 to-primary/4 p-8 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle 200px at 50% 50%, hsl(84 100% 62% / 0.06) 0%, transparent 70%)' }} />
                <p className="caption-md text-muted-foreground mb-3 font-medium relative z-10">Reminders sent</p>
                <p className="text-3xl font-bold text-primary mb-2 relative z-10">24</p>
                <span className="text-xs text-muted-foreground flex items-center gap-1 relative z-10"><Bell className="w-4 h-4" />This month</span>
              </div>
            </div>

            {/* Chart + Activity */}
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Revenue chart */}
              <div className="lg:col-span-3 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 p-8 hover:border-primary/30 hover:bg-white/[0.08] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle 300px at 50% 50%, hsl(84 100% 62% / 0.08) 0%, transparent 70%)' }} />
                <p className="text-base font-semibold mb-8 relative z-10">Revenue Overview</p>
                <div className="flex items-end gap-3 h-48 relative z-10">
                  {monthlyData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col gap-0.5 items-center h-40 justify-end">
                        <div
                          className="w-full rounded bg-primary/60 hover:bg-primary/80 transition-colors"
                          style={{ height: `${d.paid}%`, transformOrigin: 'bottom', animation: `bar-grow 0.8s ease-out ${i * 0.1}s both` }}
                        />
                        {d.overdue > 0 && (
                          <div
                            className="w-full rounded bg-overdue/60 hover:bg-overdue/80 transition-colors"
                            style={{ height: `${d.overdue}%`, transformOrigin: 'bottom', animation: `bar-grow 0.8s ease-out ${i * 0.1 + 0.3}s both` }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{d.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-6 mt-8 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-primary/60" /> Paid</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-overdue/60" /> Overdue</span>
                </div>
              </div>

              {/* Activity feed */}
              <div className="lg:col-span-2 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/10 p-8 hover:border-primary/30 hover:bg-white/[0.08] transition-all duration-300 group relative overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle 300px at 50% 50%, hsl(84 100% 62% / 0.08) 0%, transparent 70%)' }} />
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <p className="text-base font-semibold">Activity Feed</p>
                  <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-overdue/30 text-xs text-overdue font-bold">
                    3
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-overdue" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  </span>
                </div>
                <div className="space-y-4 relative z-10">
                   {activityItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 pb-4 last:pb-0 border-b border-white/5 last:border-0 hover:opacity-80 transition-opacity">
                      <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium truncate">{item.text}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-sm font-semibold ${item.color}`}>{item.amount}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
