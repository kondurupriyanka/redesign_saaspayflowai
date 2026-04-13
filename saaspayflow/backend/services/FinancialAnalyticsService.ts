import { query } from '../database/db.js';
import { format, startOfMonth, subMonths, isWithinInterval, differenceInDays, parseISO, getDay } from 'date-fns';

export class FinancialAnalyticsService {
  static async getFinancialAnalytics(userId: string) {
    const invResult = await query(
      `SELECT i.*, c.name AS client_name
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE i.user_id = $1`,
      [userId]
    );
    const invoices = invResult.rows.map((r: any) => ({
      ...r,
      clients: r.client_name ? { name: r.client_name } : null,
    }));

    const payResult = await query(
      `SELECT p.*, i.invoice_number, i.amount AS inv_amount, i.due_date, i.paid_date,
              c.name AS client_name
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE p.user_id = $1`,
      [userId]
    );
    const payments = payResult.rows;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);

    let totalBilled = 0;
    let totalPaid = 0;
    let paidThisMonth = 0;
    let onTimePayments = 0;
    let paidCount = 0;
    let totalPaymentDays = 0;

    invoices.forEach((inv: any) => {
      totalBilled += Number(inv.amount);
      if (inv.status === 'paid' && inv.paid_date) {
        paidCount++;
        totalPaid += Number(inv.amount);
        const paidDate = parseISO(inv.paid_date);
        const createdDate = parseISO(inv.created_at);
        const dueDate = parseISO(inv.due_date);
        totalPaymentDays += differenceInDays(paidDate, createdDate);
        if (paidDate <= dueDate) onTimePayments++;
        if (paidDate >= currentMonthStart) paidThisMonth += Number(inv.amount);
      }
    });

    const collectionRate = totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0;
    const avgDaysToPayment = paidCount > 0 ? totalPaymentDays / paidCount : 0;
    const onTimeRate = paidCount > 0 ? (onTimePayments / paidCount) * 100 : 0;

    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const monthLabel = format(monthDate, 'MMM yyyy');
      let monthPaid = 0;
      let monthOverdue = 0;

      invoices.forEach((inv: any) => {
        const createdDate = parseISO(inv.created_at);
        if (isWithinInterval(createdDate, { start: monthStart, end: monthEnd })) {
          if (inv.status === 'paid') monthPaid += Number(inv.amount);
          if (inv.status === 'overdue') monthOverdue += Number(inv.amount);
        }
      });

      monthlyTrend.push({ month: monthLabel, paid: monthPaid, overdue: monthOverdue });
    }

    const clientStats: Record<string, any> = {};
    invoices.forEach((inv: any) => {
      const clientId = inv.client_id;
      if (!clientStats[clientId]) {
        clientStats[clientId] = {
          id: clientId,
          name: inv.clients?.name || 'Unknown',
          revenue: 0,
          delays: [],
          paidCount: 0,
          totalInvoices: 0,
          onTimeCount: 0,
        };
      }
      const stats = clientStats[clientId];
      stats.totalInvoices++;
      if (inv.status === 'paid' && inv.paid_date) {
        stats.revenue += Number(inv.amount);
        stats.paidCount++;
        const paidDate = parseISO(inv.paid_date);
        const dueDate = parseISO(inv.due_date);
        const delay = differenceInDays(paidDate, dueDate);
        stats.delays.push(delay > 0 ? delay : 0);
        if (paidDate <= dueDate) stats.onTimeCount++;
      }
    });

    const clientData = Object.values(clientStats).map((stats: any) => {
      const avgDelay = stats.delays.length > 0
        ? stats.delays.reduce((a: number, b: number) => a + b, 0) / stats.delays.length
        : 0;
      const reliabilityScore = stats.totalInvoices > 0
        ? (stats.onTimeCount / stats.totalInvoices) * 100
        : 100;
      return { ...stats, avgDelay, reliabilityScore };
    });

    const topClients = [...clientData].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const worstClients = [...clientData]
      .filter(c => c.paidCount > 0)
      .sort((a, b) => b.avgDelay - a.avgDelay)
      .slice(0, 5);

    const statusDist = {
      paid: invoices.filter((i: any) => i.status === 'paid').length,
      pending: invoices.filter((i: any) => ['draft', 'sent', 'pending'].includes(i.status)).length,
      overdue: invoices.filter((i: any) => i.status === 'overdue').length,
      draft: invoices.filter((i: any) => i.status === 'draft').length,
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sendDays: Record<number, number[]> = {};
    invoices.forEach((inv: any) => {
      if (inv.status === 'paid' && inv.paid_date) {
        const createdDate = parseISO(inv.created_at);
        const paidDate = parseISO(inv.paid_date);
        const dayOfWeek = getDay(createdDate);
        const timeToPay = differenceInDays(paidDate, createdDate);
        if (!sendDays[dayOfWeek]) sendDays[dayOfWeek] = [];
        sendDays[dayOfWeek].push(timeToPay);
      }
    });

    let bestDayToSend = -1;
    let minAvgTime = Infinity;
    Object.entries(sendDays).forEach(([day, times]) => {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      if (avg < minAvgTime) {
        minAvgTime = avg;
        bestDayToSend = parseInt(day);
      }
    });

    const clientInsights = clientData.map(c => ({
      clientId: c.id,
      name: c.name,
      avgDelay: Math.round(c.avgDelay),
      bestReminderDay: dayNames[4],
    }));

    return {
      kpis: { collectionRate, avgDaysToPayment, onTimeRate, mrr: paidThisMonth },
      charts: {
        revenueTrend: monthlyTrend,
        paymentBehavior: clientData.map(c => ({ name: c.name, avgDays: Math.round(c.avgDelay) })),
        statusDistribution: [
          { name: 'Paid', value: statusDist.paid, color: '#A3FF3F' },
          { name: 'Pending', value: statusDist.pending, color: '#3B82F6' },
          { name: 'Overdue', value: statusDist.overdue, color: '#EF4444' },
          { name: 'Draft', value: statusDist.draft, color: '#64748B' },
        ],
      },
      tables: {
        topClients,
        worstClients,
        recentActivity: payments
          .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
          .slice(0, 10),
      },
      insights: {
        bestDayToSend: bestDayToSend !== -1 ? dayNames[bestDayToSend] : 'Monday',
        clientInsights,
      },
    };
  }
}
