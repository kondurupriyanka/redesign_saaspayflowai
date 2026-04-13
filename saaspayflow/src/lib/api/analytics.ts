import { apiRequest } from './client';

export interface FinancialAnalytics {
  kpis: {
    collectionRate: number;
    avgDaysToPayment: number;
    onTimeRate: number;
    mrr: number;
  };
  charts: {
    revenueTrend: { month: string; paid: number; overdue: number }[];
    paymentBehavior: { name: string; avgDays: number }[];
    statusDistribution: { name: string; value: number; color: string }[];
  };
  tables: {
    topClients: any[];
    worstClients: any[];
    recentActivity: any[];
  };
  insights: {
    bestDayToSend: string;
    clientInsights: { clientId: string; name: string; avgDelay: number; bestReminderDay: string }[];
  };
}

export async function fetchFinancialAnalytics(): Promise<FinancialAnalytics> {
  return apiRequest<FinancialAnalytics>('/financial-analytics');
}
