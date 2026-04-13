// ============= PAYMENTS ROUTES =============

import express from 'express';
import { PaymentService } from '../services/PaymentService.js';
import { NotificationService, NotificationType } from '../services/NotificationService.js';
import { authenticate } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { BillingService } from '../services/BillingService.js';

const router = express.Router();

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Unknown error');

/**
 * POST /payments
 * Record a new payment
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { invoiceId, amount, method, reference, notes } = req.body;

    if (!invoiceId || !amount || !method) {
      return res.status(400).json({
        error: 'Invoice ID, amount, and payment method are required',
      });
    }

    const payment = await PaymentService.recordPayment({
      userId,
      invoiceId,
      amount,
      method,
      reference,
      notes,
      provider: 'manual',
      providerTransactionId: `manual_${invoiceId}_${Date.now()}`,
    });

    // Create a notification for payment received
    await NotificationService.createNotification({
      userId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `Payment of $${amount} received for invoice ${invoiceId}`,
      data: { paymentId: payment.id, invoiceId },
      read: false,
    });

    res.status(201).json(payment);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /payments/public/complete
 * Complete a public client-portal payment using a secure portal token
 */
router.post('/public/complete', async (req, res) => {
  try {
    const { token, invoiceId, amount, method, reference, notes } = req.body;

    if (!token || !invoiceId || !amount || !method) {
      return res.status(400).json({
        error: 'Token, invoice ID, amount, and payment method are required',
      });
    }

    const { data: portalData, error } = await supabaseAdmin.rpc('fetch_portal_data', { p_token: token });
    if (error || !portalData) {
      return res.status(401).json({ error: 'Invalid or expired portal token' });
    }

    const invoice = (portalData.invoices || []).find((item: { id: string }) => item.id === invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found for this portal' });
    }

    const payment = await PaymentService.recordPayment({
      userId: portalData.freelancer_id,
      invoiceId,
      amount,
      method,
      reference: reference || `Portal payment for ${invoice.invoice_number}`,
      notes: notes || 'Paid from public client portal',
      provider: 'portal',
      providerTransactionId: `portal_${invoiceId}_${Date.now()}`,
    });

    await NotificationService.createNotification({
      userId: portalData.freelancer_id,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment received',
      message: `Payment of ${amount} received for invoice ${invoice.invoice_number}.`,
      data: { paymentId: payment.id, invoiceId, source: 'portal' },
      read: false,
    });

    res.status(201).json(payment);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /payments/pending-client
 * Get all pending invoice_payments (client-submitted) for the authenticated user
 */
router.get('/pending-client', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { query } = await import('../database/db.js');
    const result = await query(
      `SELECT ip.*, i.invoice_number, c.name AS client_name
       FROM invoice_payments ip
       JOIN invoices i ON i.id = ip.invoice_id
       JOIN clients c ON c.id = i.client_id
       WHERE i.user_id = $1
       ORDER BY ip.created_at DESC`,
      [userId]
    );
    res.json(result.rows.map((r: any) => ({ ...r, amount: Number(r.amount) })));
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /payments
 * Get all payments for user with invoice + client info
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { query } = await import('../database/db.js');
    const result = await query(
      `SELECT p.*, i.invoice_number, c.name AS client_name
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE p.user_id = $1
       ORDER BY p.payment_date DESC
       LIMIT 200`,
      [userId]
    );
    res.json(result.rows.map((r: any) => ({ ...r, amount: Number(r.amount) })));
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /payments/stats
 * Get payment statistics
 */
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await PaymentService.getPaymentStats(userId);
    res.json(stats);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /payments/invoices/:invoiceId
 * Get all payments for a specific invoice
 */
router.get('/invoices/:invoiceId', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const invoiceId = String(req.params.invoiceId);
    const payments = await PaymentService.getInvoicePayments(invoiceId, userId);
    res.json(payments);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * DELETE /payments/:id
 * Cancel a payment
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const paymentId = String(req.params.id);
    const reason = req.body.reason;

    const payment = await PaymentService.cancelPayment(paymentId, userId, reason);
    res.json(payment);
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /payments/webhooks/paddle
 * Handle provider callbacks for payment success/failure
 */
router.post('/webhooks/paddle', async (req, res) => {
  try {
    const signature = req.headers['paddle-signature'] as string | undefined;
    const rawBody = (req as { rawBody?: string }).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    if (!BillingService.verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const payment = await PaymentService.handleWebhook(event);
    res.json({ ok: true, payment });
  } catch (error: unknown) {
    res.status(400).json({ error: getErrorMessage(error) });
  }
});

export default router;
