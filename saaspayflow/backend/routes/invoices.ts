// ============= INVOICES ROUTES =============

import express from 'express';
import { InvoiceService } from '../services/InvoiceService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ─── PUBLIC ROUTES (no auth) ─────────────────────────────────────────────────

router.get('/public/:token', async (req, res) => {
  try {
    const data = await InvoiceService.getInvoiceByShareToken(String(req.params.token));
    if (!data) return res.status(404).json({ error: 'Invoice not found or link has expired' });
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Client submits a payment confirmation */
router.post('/public/:token/pay', async (req, res) => {
  try {
    const invoiceId = await InvoiceService.getInvoiceIdByToken(String(req.params.token));
    if (!invoiceId) return res.status(404).json({ error: 'Invoice not found' });

    const { amount, method, reference } = req.body;
    if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Valid amount is required' });

    const row = await InvoiceService.submitPayment(invoiceId, Number(amount), method || 'other', reference);
    res.json({ success: true, payment: row });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Client sends a message */
router.post('/public/:token/message', async (req, res) => {
  try {
    const invoiceId = await InvoiceService.getInvoiceIdByToken(String(req.params.token));
    if (!invoiceId) return res.status(404).json({ error: 'Invoice not found' });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    const row = await InvoiceService.addMessage(invoiceId, 'client', message.trim());
    res.json({ success: true, message: row });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Client fetches the message thread (for seeing freelancer replies) */
router.get('/public/:token/messages', async (req, res) => {
  try {
    const invoiceId = await InvoiceService.getInvoiceIdByToken(String(req.params.token));
    if (!invoiceId) return res.status(404).json({ error: 'Invoice not found' });
    const messages = await InvoiceService.getMessages(invoiceId);
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Client submits extension or dispute request */
router.post('/public/:token/request', async (req, res) => {
  try {
    const invoiceId = await InvoiceService.getInvoiceIdByToken(String(req.params.token));
    if (!invoiceId) return res.status(404).json({ error: 'Invoice not found' });

    const { type, reason, message } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const reqType = type === 'dispute' ? 'dispute' : 'extension';

    const row = await InvoiceService.submitRequest(invoiceId, reqType, reason, message);
    res.json({ success: true, request: row });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Keep old paths for backward compat
router.post('/public/:token/confirm-payment', async (req, res) => {
  try {
    const invoiceId = await InvoiceService.getInvoiceIdByToken(String(req.params.token));
    if (!invoiceId) return res.status(404).json({ error: 'Invoice not found' });
    const { amount, method, note } = req.body;
    if (!amount || isNaN(Number(amount))) return res.status(400).json({ error: 'Valid amount is required' });
    const row = await InvoiceService.submitPayment(invoiceId, Number(amount), method || 'other', note);
    res.json({ success: true, payment: row });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/public/:token/request-extension', async (req, res) => {
  try {
    const invoiceId = await InvoiceService.getInvoiceIdByToken(String(req.params.token));
    if (!invoiceId) return res.status(404).json({ error: 'Invoice not found' });
    const { reason, message } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const row = await InvoiceService.submitRequest(invoiceId, 'extension', reason, message);
    res.json({ success: true, request: row });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── AUTHENTICATED INVOICE CRUD ──────────────────────────────────────────────

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const { clientId, title, description, currency, dueDate, status, subtotal, taxPercent, taxAmount, total, lineItems } = req.body;
    if (!clientId) return res.status(400).json({ error: 'Client is required' });
    if (!dueDate)  return res.status(400).json({ error: 'Due date is required' });
    if (!total || Number(total) <= 0) return res.status(400).json({ error: 'Invoice total must be greater than 0' });

    const invoice = await InvoiceService.createInvoice(userId, {
      clientId, title, description, currency, dueDate, status,
      subtotal:   Number(subtotal  ?? total),
      taxPercent: Number(taxPercent ?? 0),
      taxAmount:  Number(taxAmount  ?? 0),
      total:      Number(total),
      lineItems,
    });
    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 200;
    const status = req.query.status as string | undefined;
    const result = await InvoiceService.getUserInvoices(userId, page, limit, status);
    res.json(result.invoices);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const stats = await InvoiceService.getInvoiceStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/list/overdue', authenticate, async (req, res) => {
  try {
    const invoices = await InvoiceService.getOverdueInvoices(req.user?.id);
    res.json(invoices);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/list/upcoming', authenticate, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const invoices = await InvoiceService.getUpcomingDueInvoices(days);
    const userInvoices = invoices.filter((inv) => inv.user_id === req.user?.id);
    res.json(userInvoices);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── AUTHENTICATED INVOICE DETAIL ROUTES ─────────────────────────────────────

/** Get all messages for an invoice */
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    // Verify ownership
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const messages = await InvoiceService.getMessages(invoiceId);
    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Freelancer sends a reply message */
router.post('/:id/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
    const row = await InvoiceService.addMessage(invoiceId, 'freelancer', message.trim());
    res.json(row);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Get pending payments for an invoice */
router.get('/:id/pending-payments', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const payments = await InvoiceService.getPendingPayments(invoiceId);
    res.json(payments);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Confirm a client payment */
router.post('/:id/pending-payments/:pid/confirm', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    const paymentId = String(req.params.pid);
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const result = await InvoiceService.confirmPayment(invoiceId, paymentId, userId);
    res.json({ success: true, payment: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Get extension/dispute requests */
router.get('/:id/requests', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const requests = await InvoiceService.getRequests(invoiceId);
    res.json(requests);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Approve or reject a request */
router.patch('/:id/requests/:rid', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    const requestId = String(req.params.rid);
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const result = await InvoiceService.updateRequestStatus(invoiceId, requestId, status);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/** Get activity timeline */
router.get('/:id/activity', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const invoiceId = String(req.params.id);
    const inv = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    const activity = await InvoiceService.getActivity(invoiceId);
    res.json(activity);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const invoiceId = String(req.params.id);
    const invoice = await InvoiceService.getInvoiceById(userId, invoiceId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/send', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const invoiceId = String(req.params.id);
    const { token, invoice } = await InvoiceService.sendInvoice(userId, invoiceId);
    res.json({ invoice, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const invoiceId = String(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });
    const invoice = await InvoiceService.updateInvoiceStatus(invoiceId, status);
    res.json(invoice);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const invoiceId = String(req.params.id);
    await InvoiceService.deleteInvoice(userId, invoiceId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
