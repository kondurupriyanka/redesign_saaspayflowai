import { useQuery } from '@tanstack/react-query';
import { differenceInDays } from 'date-fns';
import { apiRequest } from '@/lib/api/client';

export interface OverdueReport {
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  client_id: string;
  amount: number;
  currency: string;
  days_overdue: number;
  reminders_count: number;
  recommended_tone: 'friendly' | 'firm' | 'serious';
}

interface OverdueInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  client_id: string;
  reminders_count?: number;
  client?: { name?: string; email?: string; whatsapp?: string };
}

export function useReminderEngine() {
  const { data: report, isLoading, error } = useQuery({
    queryKey: ['reminder-engine'],
    queryFn: async (): Promise<OverdueReport[]> => {
      const data = await apiRequest<OverdueInvoice[]>('/invoices/list/overdue');
      const now = new Date();

      return (data || []).map(inv => {
        const remindersCount = inv.reminders_count ?? 0;
        const daysOverdue = differenceInDays(now, new Date(inv.due_date));

        let tone: 'friendly' | 'firm' | 'serious' = 'friendly';
        if (remindersCount === 1) tone = 'firm';
        if (remindersCount >= 2) tone = 'serious';

        return {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          client_name: inv.client?.name || 'Unknown',
          client_id: inv.client_id,
          amount: Number(inv.amount),
          currency: inv.currency,
          days_overdue: daysOverdue,
          reminders_count: remindersCount,
          recommended_tone: tone,
        };
      });
    },
    staleTime: 60 * 1000,
  });

  return {
    report,
    isLoading,
    error,
    needsAttentionCount: report?.length || 0,
  };
}
