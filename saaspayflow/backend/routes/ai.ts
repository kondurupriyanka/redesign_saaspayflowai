import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePlan } from '../middleware/plan.js';
import { AIService } from '../services/AIService.js';
import { InvoiceService } from '../services/InvoiceService.js';
import { FinancialAnalyticsService } from '../services/FinancialAnalyticsService.js';

const router = express.Router();

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

router.post('/reminders/generate', authenticate, requirePlan('pro'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const { invoiceId, tone } = req.body;
    if (!invoiceId) return res.status(400).json({ error: 'invoiceId is required' });

    const invoice = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const dueDate = new Date(invoice.due_date);
    const now = new Date();
    const daysOverdue = Math.max(Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)), 0);

    const result = await AIService.generatePaymentReminder({
      businessName: undefined,
      clientName: invoice.clients?.name || 'Client',
      amount: Number(invoice.amount),
      invoiceNumber: invoice.invoice_number,
      dueDate: invoice.due_date,
      daysOverdue,
      tone,
    });

    res.json({
      invoiceId,
      data: result,
    });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

router.post('/invoices/extract', authenticate, requirePlan('pro'), async (req, res) => {
  try {
    const { base64File, mimeType } = req.body;
    if (!base64File || !mimeType) {
      return res.status(400).json({ error: 'base64File and mimeType are required' });
    }

    const data = await AIService.extractInvoiceData({ base64File, mimeType });
    res.json({ data });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

router.post('/insights', authenticate, requirePlan('pro'), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const summary = await FinancialAnalyticsService.getFinancialAnalytics(userId);
    const topClients = (summary.tables?.topClients || []).map((client: { name?: string; revenue?: number; avgDelay?: number }) => ({
      name: client.name || 'Unknown',
      revenue: Number(client.revenue || 0),
      avgDelay: Number(client.avgDelay || 0),
    }));
    const overdueClients = (summary.tables?.worstClients || []).map((client: { name?: string; revenue?: number; avgDelay?: number }) => ({
      name: client.name || 'Unknown',
      revenue: Number(client.revenue || 0),
      avgDelay: Number(client.avgDelay || 0),
    }));

    const insights = await AIService.generateFinancialInsights({
      summary: summary.kpis || summary,
      topClients,
      overdueClients,
    });

    res.json({ data: insights });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

export default router;
