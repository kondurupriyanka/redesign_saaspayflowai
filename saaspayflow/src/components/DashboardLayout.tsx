import { ReactNode, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  Settings,
  Receipt,
  Menu,
  X,
  Plus,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users,           label: 'Clients',   href: '/clients' },
  { icon: FileText,        label: 'Invoices',  href: '/invoices' },
  { icon: CreditCard,      label: 'Payments',  href: '/payments' },
  { icon: Bell,            label: 'Reminders', href: '/reminders' },
  { icon: Receipt,         label: 'Billing',   href: '/billing' },
  { icon: Settings,        label: 'Settings',  href: '/settings' },
];

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free:   { label: 'Free',   cls: 'bg-white/10 text-white/50' },
  pro:    { label: 'Pro',    cls: 'bg-[#A3FF3F]/15 text-[#A3FF3F]' },
  growth: { label: 'Growth', cls: 'bg-violet-400/15 text-violet-300' },
};

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  unreadCount?: number;
  onNewInvoice?: () => void;
}

export function DashboardLayout({
  children,
  pageTitle = 'Dashboard',
  unreadCount = 0,
  onNewInvoice,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  const plan = (user?.user_metadata?.plan as string) || 'free';
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';
  const avatarInitial = displayName[0]?.toUpperCase() ?? 'U';

  const handleSignOut = async () => {
    await logout();
    navigate('/auth');
  };

  return (
    <div className="flex h-screen bg-[#0A0F0A] text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 flex flex-col',
          'bg-[#0C1610] border-r border-white/[0.07]',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        )}
      >
        {/* ── Brand / Logo ── */}
        <div className="flex items-center h-16 px-5 border-b border-white/[0.07] shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 min-w-0 hover:opacity-90 transition-opacity"
            aria-label="Go to dashboard"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0D1A0D] shrink-0 flex items-center justify-center">
              <img
                src={logoImage}
                alt="PayFlow AI"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[17px] font-bold leading-none tracking-tight text-white whitespace-nowrap">
              PayFlow <span className="text-[#A3FF3F]">AI</span>
            </span>
          </button>

          {/* Mobile close */}
          <button
            className="ml-auto lg:hidden p-1.5 hover:bg-white/8 rounded-lg transition-colors shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all duration-150',
                  active
                    ? 'bg-[#A3FF3F]/10 text-[#A3FF3F]'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.05]',
                )}
              >
                <item.icon
                  className={cn(
                    'w-[17px] h-[17px] shrink-0 transition-colors',
                    active ? 'text-[#A3FF3F]' : 'text-white/40 group-hover:text-white/70',
                  )}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className="truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#A3FF3F] shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── User footer ── */}
        <div className="border-t border-white/[0.07] p-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#A3FF3F]/15 flex items-center justify-center text-[13px] font-bold text-[#A3FF3F] shrink-0">
              {avatarInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white/90 truncate leading-tight">{displayName}</p>
              <span
                className={cn(
                  'inline-block text-[10px] font-semibold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded mt-0.5',
                  planBadge.cls,
                )}
              >
                {planBadge.label}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-white/8 text-white/35 hover:text-white/70 transition-colors shrink-0"
            >
              <LogOut className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Topbar ── */}
        <header className="h-16 shrink-0 flex items-center gap-3 px-5 sm:px-6 border-b border-white/[0.07] bg-[#0A0F0A]/95 backdrop-blur-md">
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/8 transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-white/70" />
          </button>

          {/* Page title */}
          <h1 className="text-[17px] font-semibold text-white tracking-tight truncate">{pageTitle}</h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button
                id="notif-bell"
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 rounded-lg hover:bg-white/8 transition-colors"
              >
                <Bell className="w-[18px] h-[18px] text-white/55" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#A3FF3F] text-[#0A0F0A] text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#0F1A12] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button onClick={() => setNotifOpen(false)}>
                      <X className="w-3.5 h-3.5 text-white/40" />
                    </button>
                  </div>
                  <div className="p-4 text-sm text-white/40 text-center">No new notifications</div>
                </div>
              )}
            </div>

            {/* New Invoice CTA */}
            <button
              id="new-invoice-btn"
              onClick={onNewInvoice ?? (() => navigate('/invoices/new'))}
              className="flex items-center gap-2 px-4 py-2 bg-[#A3FF3F] text-[#0A0F0A] font-semibold text-sm rounded-lg hover:bg-[#b5ff55] active:scale-95 transition-all duration-150 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Invoice</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 py-6 space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
