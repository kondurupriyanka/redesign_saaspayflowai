import { TrendingUp, AlertTriangle, Bell } from 'lucide-react';

const HeroDashboard = () => (
  <div 
    className="rounded-[20px] border border-border/50 bg-card/80 backdrop-blur-sm p-5 glow-green space-y-4 will-change-transform"
    style={{ animation: 'float 4s ease-in-out infinite' }}
  >
    {/* Top stats */}
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl bg-secondary/60 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Revenue</p>
        <p className="text-lg font-bold text-foreground">₹3.2L</p>
        <span className="text-xs text-success flex items-center gap-1"><TrendingUp className="w-3 h-3" />+12%</span>
      </div>
      <div className="rounded-xl bg-secondary/60 p-3 space-y-1">
        <p className="text-xs text-muted-foreground">Pending</p>
        <p className="text-lg font-bold text-warning">₹1.23L</p>
        <span className="text-xs text-muted-foreground">5 invoices</span>
      </div>
      <div className="rounded-xl bg-gradient-to-br from-overdue/20 to-overdue/5 border border-overdue/20 p-3 space-y-1 relative">
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-overdue" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <p className="text-xs text-overdue/80">Overdue</p>
        <p className="text-lg font-bold text-overdue">₹45,000</p>
        <span className="text-xs text-overdue/70">2 clients</span>
      </div>
    </div>

    {/* Mini chart */}
    <div className="rounded-xl bg-secondary/60 p-3">
      <p className="text-xs text-muted-foreground mb-2">Monthly Revenue</p>
      <div className="flex items-end gap-1.5 h-16">
        {[65, 45, 80, 55, 90, 70, 40, 85, 60, 75, 30, 50].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm will-change-transform ${i === 10 || i === 6 ? 'bg-overdue/60' : 'bg-primary/50'}`}
            style={{ height: `${h}%`, transformOrigin: 'bottom', animation: `bar-grow 0.8s ease-out ${i * 0.05}s both` }}
          />
        ))}
      </div>
    </div>

    {/* Activity */}
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Recent Activity</p>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="text-foreground">Payment received — Arjun — <span className="text-success font-medium">₹15,000</span></span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
        <span className="text-muted-foreground">Reminder sent to Priya — 2 hrs ago</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-overdue" />
        <span className="text-muted-foreground">Final notice — Rahul — overdue 7 days</span>
      </div>
    </div>
  </div>
);

export default HeroDashboard;
