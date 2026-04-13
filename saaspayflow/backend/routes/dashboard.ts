// ============= DASHBOARD ROUTE =============

import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../database/db.js';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const router = express.Router();

/**
 * GET /dashboard
 * Returns all dashboard stats, revenue chart, activity feed, recent invoices.
 * Uses only Replit PostgreSQL — no Supabase queries.
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // 1. Auto-promote overdue invoices (sent invoices past due_date)
    const today = new Date().toISOString().split('T')[0];
    await query(
      `UPDATE invoices SET status = 'overdue', updated_at = NOW()
       WHERE user_id = $1 AND status = 'sent' AND due_date < $2`,
      [userId, today]
    );

    // 2. Fetch all invoices for this user (with client name)
    const invoicesRes = await query(
      `SELECT i.id, i.invoice_number, i.amount, i.total, i.status, i.due_date,
              i.created_at, i.client_id,
              c.name AS client_name
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
      [userId]
    );
    const allInvoices = invoicesRes.rows;

    // 3. Fetch completed payments
    const paymentsRes = await query(
      `SELECT id, amount, payment_date, created_at, invoice_id
       FROM payments
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY payment_date DESC`,
      [userId]
    );
    const allPayments = paymentsRes.rows;

    // 4. Fetch reminders
    const remindersRes = await query(
      `SELECT id, sent_at, invoice_id, created_at
       FROM reminders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    const allReminders = remindersRes.rows;

    // 5. STATS
    const totalBilled = allInvoices.reduce((s: number, i: any) => s + Number(i.total ?? i.amount ?? 0), 0);
    const totalRevenue = allPayments.reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

    const pendingAmount = allInvoices
      .filter((i: any) => ['draft', 'sent', 'partial'].includes(i.status))
      .reduce((s: number, i: any) => s + Number(i.total ?? i.amount ?? 0), 0);

    const overdueAmount = allInvoices
      .filter((i: any) => i.status === 'overdue')
      .reduce((s: number, i: any) => s + Number(i.total ?? i.amount ?? 0), 0);

    // Outstanding = unpaid balance = total billed - confirmed payments
    const outstandingAmount = Math.max(0, totalBilled - totalRevenue);

    const remindersSent = allReminders.length;

    const stats = {
      totalBilled,
      totalRevenue,
      outstandingAmount,
      pendingAmount,
      overdueAmount,
      remindersSent,
    };

    // 6. REVENUE CHART (last 6 months)
    const revenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, 'MMM');

      const revenue = allPayments
        .filter((p: any) => {
          const d = new Date(p.payment_date);
          return d >= start && d <= end;
        })
        .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);

      const overdue = allInvoices
        .filter((inv: any) => {
          const d = new Date(inv.created_at);
          return d >= start && d <= end && inv.status === 'overdue';
        })
        .reduce((s: number, inv: any) => s + Number(inv.total ?? inv.amount ?? 0), 0);

      revenueChart.push({ month: label, revenue, overdue });
    }

    // 7. ACTIVITY FEED
    function timeAgo(dateStr: string): string {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    }

    const events: any[] = [];

    allInvoices.slice(0, 5).forEach((inv: any) => {
      events.push({
        id: `inv-${inv.id}`,
        type: inv.status === 'overdue' ? 'invoice_overdue' : 'invoice_created',
        description: inv.status === 'overdue'
          ? `Invoice ${inv.invoice_number} is overdue${inv.client_name ? ` · ${inv.client_name}` : ''}`
          : `Invoice ${inv.invoice_number} created${inv.client_name ? ` · ${inv.client_name}` : ''}`,
        amount: Number(inv.total ?? inv.amount ?? 0),
        timeAgo: timeAgo(inv.created_at),
        createdAt: inv.created_at,
      });
    });

    allPayments.slice(0, 5).forEach((pay: any) => {
      events.push({
        id: `pay-${pay.id}`,
        type: 'payment_received',
        description: 'Payment received',
        amount: Number(pay.amount ?? 0),
        timeAgo: timeAgo(pay.created_at || pay.payment_date),
        createdAt: pay.created_at || pay.payment_date,
      });
    });

    allReminders.slice(0, 3).forEach((rem: any) => {
      events.push({
        id: `rem-${rem.id}`,
        type: 'reminder_sent',
        description: 'Reminder sent',
        timeAgo: timeAgo(rem.created_at),
        createdAt: rem.created_at,
      });
    });

    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 8. RECENT INVOICES (top 5)
    const recentInvoices = allInvoices.slice(0, 5).map((inv: any) => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount: Number(inv.total ?? inv.amount ?? 0),
      status: inv.status,
      due_date: inv.due_date
        ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      client_name: inv.client_name || undefined,
    }));

    console.log(`[dashboard] user=${userId} invoices=${allInvoices.length} payments=${allPayments.length} reminders=${allReminders.length}`);

    res.json({ stats, revenueChart, activityFeed: events.slice(0, 8), recentInvoices });
  } catch (err: any) {
    console.error('[dashboard] Error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;
