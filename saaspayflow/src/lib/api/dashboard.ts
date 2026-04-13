import { apiRequest } from './client';

export interface StatCard {
  totalBilled: number;
  totalRevenue: number;
  outstandingAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  remindersSent: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  overdue: number;
}

export interface ActivityEvent {
  id: string;
  type: 'invoice_created' | 'payment_received' | 'reminder_sent' | 'invoice_overdue';
  description: string;
  amount?: number;
  timeAgo: string;
  createdAt: string;
}

export interface DashboardData {
  stats: StatCard;
  revenueChart: RevenueDataPoint[];
  activityFeed: ActivityEvent[];
  recentInvoices: Array<{
    id: string;
    invoice_number: string;
    amount: number;
    status: string;
    due_date: string;
    client_name?: string;
  }>;
}

/**
 * Fetch dashboard data from our backend REST API.
 * Data lives in Replit PostgreSQL — never query Supabase tables directly.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  return apiRequest<DashboardData>('/dashboard');
}

/** Kept for backwards compatibility */
export async function fetchDashboardSummary() {
  const data = await fetchDashboardData();
  return {
    invoiceStats: {
      totalInvoiced: data.stats.totalBilled,
      totalPaid: data.stats.totalRevenue,
      totalPending: data.stats.pendingAmount,
      totalOverdue: data.stats.overdueAmount,
      invoiceCount: data.recentInvoices.length,
    },
    paymentStats: {
      totalReceived: data.stats.totalRevenue,
      paymentCount: 0,
      recentPayments: [],
    },
    recentInvoices: data.recentInvoices,
  };
}
