// ============= PAYMENT SERVICE =============
// All database operations use Replit PostgreSQL directly.

import { query } from '../database/db.js';

export interface PaymentPayload {
  userId: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  provider?: string;
  providerTransactionId?: string | null;
}

export interface PortalPaymentPayload {
  token: string;
  invoiceId: string;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

export class PaymentService {
  static async getInvoiceById(invoiceId: string, userId?: string) {
    const params: unknown[] = [invoiceId];
    let sql = `SELECT * FROM invoices WHERE id = $1`;
    if (userId) {
      params.push(userId);
      sql += ` AND user_id = $2`;
    }
    const result = await query(sql, params);
    if (!result.rows[0]) throw new Error('Invoice not found');
    return result.rows[0];
  }

  static async getInvoiceTotalPaid(invoiceId: string): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM payments WHERE invoice_id = $1 AND status = 'completed'`,
      [invoiceId]
    );
    return Number(result.rows[0]?.total || 0);
  }

  static async finalizeInvoiceStatus(invoiceId: string, userId: string, totalPaid: number) {
    const invoice = await this.getInvoiceById(invoiceId, userId);
    const invoiceTotal = Number(invoice.total ?? invoice.amount);
    const now = new Date().toISOString();

    if (totalPaid >= invoiceTotal - 0.01) {
      await query(
        `UPDATE invoices SET status = 'paid', paid_date = $1, updated_at = $1 WHERE id = $2`,
        [now, invoiceId]
      );
    } else if (totalPaid > 0 && invoice.status !== 'paid') {
      await query(
        `UPDATE invoices SET status = 'partial', updated_at = $1 WHERE id = $2`,
        [now, invoiceId]
      );
    }

    return invoice;
  }

  static async recordPayment(payload: PaymentPayload) {
    const invoice = await this.getInvoiceById(payload.invoiceId, payload.userId);
    const paymentAmount = Number(payload.amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const currentPaid = await this.getInvoiceTotalPaid(payload.invoiceId);
    const invoiceTotal = Number(invoice.total ?? invoice.amount);
    if (currentPaid + paymentAmount > invoiceTotal + 0.01) {
      throw new Error('Payment amount exceeds invoice balance');
    }

    const result = await query(
      `INSERT INTO payments
         (user_id, invoice_id, amount, method, reference, notes, status, payment_date, provider, provider_transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), $7, $8)
       RETURNING *`,
      [
        payload.userId,
        payload.invoiceId,
        paymentAmount,
        payload.method || 'manual',
        payload.reference || null,
        payload.notes || null,
        payload.provider || 'manual',
        payload.providerTransactionId || null,
      ]
    );

    if (!result.rows[0]) throw new Error('Failed to record payment');

    await this.finalizeInvoiceStatus(payload.invoiceId, payload.userId, currentPaid + paymentAmount);

    return result.rows[0];
  }

  static async recordPublicPayment(payload: PortalPaymentPayload) {
    // Look up invoice by portal token via client_portal_tokens
    const tokenResult = await query(
      `SELECT cpt.client_id, i.user_id
       FROM client_portal_tokens cpt
       JOIN invoices i ON i.client_id = cpt.client_id
       WHERE cpt.token = $1 AND cpt.expires_at > NOW() AND i.id = $2`,
      [payload.token, payload.invoiceId]
    );

    if (!tokenResult.rows[0]) throw new Error('Invalid or expired portal token');

    const { user_id } = tokenResult.rows[0];

    return this.recordPayment({
      userId: user_id,
      invoiceId: payload.invoiceId,
      amount: payload.amount,
      method: payload.method,
      reference: payload.reference || `Portal payment`,
      notes: payload.notes || 'Paid from public client portal',
      provider: 'portal',
      providerTransactionId: `portal_${payload.invoiceId}_${Date.now()}`,
    });
  }

  static async getInvoicePayments(invoiceId: string, userId: string) {
    const result = await query(
      `SELECT * FROM payments
       WHERE invoice_id = $1 AND user_id = $2
       ORDER BY payment_date DESC`,
      [invoiceId, userId]
    );
    return result.rows;
  }

  static async getUserPayments(userId: string, limit: number = 20, offset: number = 0) {
    const countResult = await query(
      `SELECT COUNT(*) FROM payments WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    const result = await query(
      `SELECT p.*, i.invoice_number, i.amount AS invoice_amount
       FROM payments p
       LEFT JOIN invoices i ON i.id = p.invoice_id
       WHERE p.user_id = $1
       ORDER BY p.payment_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      payments: result.rows,
      total,
      hasMore: offset + limit < total,
    };
  }

  static async getPaymentStats(userId: string) {
    const result = await query(
      `SELECT amount, method, payment_date
       FROM payments
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY payment_date DESC`,
      [userId]
    );
    const rows = result.rows;

    const stats = {
      totalReceived: 0,
      paymentCount: rows.length,
      methodBreakdown: {} as Record<string, number>,
      recentPayments: [] as Array<Record<string, unknown>>,
    };

    rows.forEach((p: any) => {
      stats.totalReceived += Number(p.amount || 0);
      stats.methodBreakdown[p.method] = (stats.methodBreakdown[p.method] || 0) + Number(p.amount || 0);
    });

    stats.recentPayments = rows.slice(0, 5);
    return stats;
  }

  static async cancelPayment(paymentId: string, userId: string, reason?: string) {
    const result = await query(
      `UPDATE payments SET status = 'cancelled', notes = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [reason || null, paymentId, userId]
    );

    if (!result.rows[0]) throw new Error('Failed to cancel payment');
    return result.rows[0];
  }

  static async handleWebhook(event: unknown) {
    const webhook = (event || {}) as {
      event_type?: string;
      type?: string;
      event_id?: string;
      data?: Record<string, unknown>;
      custom_data?: Record<string, unknown>;
    };
    const data = (webhook.data || {}) as Record<string, unknown>;
    const customData = (data.custom_data || webhook.custom_data || {}) as Record<string, unknown>;
    const eventType = String(webhook.event_type || webhook.type || '').toLowerCase();
    const invoiceId = String(
      customData.invoiceId || customData.invoice_id || data.invoice_id || data.invoiceId || ''
    );
    const userId = String(customData.userId || customData.user_id || data.user_id || '');
    const providerTransactionId = String(
      data.id || data.transaction_id || customData.transactionId || customData.transaction_id || webhook.event_id || ''
    ) || null;

    const details = data.details as Record<string, unknown> | undefined;
    const totals = details?.totals as Record<string, unknown> | undefined;
    const paymentData = data.payment as Record<string, unknown> | undefined;
    const amount = Number(
      data.amount || totals?.grand_total || paymentData?.amount || customData.amount || 0
    );

    const method = String(data.payment_method || customData.method || 'card');
    const isFailure = eventType.includes('fail') || eventType.includes('declin') || eventType.includes('past_due');

    if (!invoiceId || !userId) {
      throw new Error('Webhook payload missing invoice or user identifiers');
    }

    if (isFailure) {
      const failureReason = String(data.failure_reason || data.error_message || `Webhook event: ${eventType}`);
      const result = await query(
        `INSERT INTO payments
           (user_id, invoice_id, amount, method, reference, notes, status, payment_date)
         VALUES ($1, $2, $3, $4, $5, $6, 'failed', NOW())
         RETURNING *`,
        [
          userId,
          invoiceId,
          amount || 0.01,
          method,
          `Webhook failure ${providerTransactionId || webhook.event_id || 'unknown'}`,
          failureReason,
        ]
      );
      return result.rows[0];
    }

    return this.recordPayment({
      userId,
      invoiceId,
      amount,
      method,
      reference: data.id ? `Webhook payment ${data.id}` : `Webhook payment ${webhook.event_id || 'completed'}`,
      notes: `Webhook event: ${eventType}`,
      provider: 'paddle',
      providerTransactionId,
    });
  }
}
