import cron, { ScheduledTask } from 'node-cron';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { query } from '../database/db.js';
import { NotificationService, NotificationType } from '../services/NotificationService.js';
import { AIService } from '../services/AIService.js';
import { InvoiceService } from '../services/InvoiceService.js';

let scheduledJob: ScheduledTask | null = null;

async function runSweep() {
  const today = new Date().toISOString().split('T')[0];

  const promotedCount = await InvoiceService.promoteOverdueInvoices();

  const overdueResult = await query(
    `SELECT i.id, i.user_id, i.client_id, i.invoice_number, i.amount, i.currency, i.due_date, i.status,
            c.name AS client_name, c.email AS client_email, c.whatsapp AS client_whatsapp, c.phone AS client_phone
     FROM invoices i
     LEFT JOIN clients c ON c.id = i.client_id
     WHERE i.status = 'overdue' AND i.due_date < $1`,
    [today]
  );

  const overdueInvoices = overdueResult.rows.map((row: any) => ({
    ...row,
    clients: {
      name: row.client_name,
      email: row.client_email,
      whatsapp: row.client_whatsapp,
      phone: row.client_phone,
    },
  }));

  if (!overdueInvoices.length) {
    return { processed: 0, created: 0, skipped: 0, promoted: promotedCount };
  }

  const invoiceIds = overdueInvoices.map((invoice: any) => invoice.id);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const remindersResult = await query(
    `SELECT invoice_id, created_at FROM reminders
     WHERE invoice_id = ANY($1) AND created_at >= $2`,
    [invoiceIds, dayStart.toISOString()]
  );
  const existingReminders = remindersResult.rows;

  const alreadyNotified = new Set(existingReminders.map((r: any) => r.invoice_id));
  const reminderCounts = new Map<string, number>();
  for (const reminder of existingReminders) {
    reminderCounts.set(reminder.invoice_id, (reminderCounts.get(reminder.invoice_id) || 0) + 1);
  }

  let created = 0;
  let skipped = 0;

  const pickChannel = (count: number, client: any) => {
    if (count >= 2 && client?.whatsapp) return 'whatsapp';
    if (count >= 3 && client?.phone) return 'sms';
    return client?.email ? 'email' : client?.whatsapp ? 'whatsapp' : 'email';
  };

  for (const invoice of overdueInvoices) {
    const client = invoice.clients;
    const dueDate = parseISO(invoice.due_date);
    const daysOverdue = Math.max(differenceInCalendarDays(new Date(), dueDate), 0);
    const reminderCount = reminderCounts.get(invoice.id) || 0;
    const escalationLevel = Math.min(reminderCount + 1, 3);
    const tone = escalationLevel === 1 ? 'friendly' : escalationLevel === 2 ? 'firm' : 'serious';
    const channel = pickChannel(reminderCount, client);

    if (alreadyNotified.has(invoice.id)) {
      skipped++;
      continue;
    }

    const reminder = await AIService.generatePaymentReminder({
      businessName: undefined,
      clientName: client?.name || 'Client',
      amount: Number(invoice.amount),
      invoiceNumber: invoice.invoice_number,
      dueDate: invoice.due_date,
      daysOverdue,
      tone,
    });

    await query(
      `INSERT INTO reminders (user_id, invoice_id, client_id, channel, tone, message, status, sent_at, scheduled_for, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, 'sent', NOW(), NOW(), $7)`,
      [
        invoice.user_id,
        invoice.id,
        invoice.client_id || null,
        channel,
        reminder.tone,
        reminder.message,
        JSON.stringify({
          automation: 'daily-overdue-sweep',
          days_overdue: daysOverdue,
          subject: reminder.subject,
          escalation_level: escalationLevel,
          reminder_count: reminderCount + 1,
        }),
      ]
    );

    await NotificationService.createNotification({
      userId: invoice.user_id,
      type: NotificationType.OVERDUE_ALERT,
      title: 'Overdue invoice reminder queued',
      message: `Queued an automated reminder for invoice ${invoice.invoice_number}.`,
      data: { invoiceId: invoice.id, invoiceNumber: invoice.invoice_number, daysOverdue },
      read: false,
    });

    created++;
  }

  return { processed: overdueInvoices.length, created, skipped, promoted: promotedCount };
}

export function startDailyReminderJob() {
  if (process.env.ENABLE_DAILY_REMINDER_JOB === 'false') return null;
  if (scheduledJob) return scheduledJob;

  const cronExpression = process.env.DAILY_REMINDER_CRON || '0 9 * * *';
  scheduledJob = cron.schedule(
    cronExpression,
    async () => {
      try {
        const result = await runSweep();
        console.log('[daily-reminder-job] completed', result);
      } catch (error) {
        console.error('[daily-reminder-job] failed', error);
      }
    },
    { timezone: process.env.TIMEZONE || 'UTC' }
  );

  return scheduledJob;
}
