// =============================================================
//  InvoiceService — all queries use Replit PostgreSQL directly
// =============================================================

import { query } from '../database/db.js';
import type { Invoice, InvoiceStatus } from '../database/types.js';

export class InvoiceService {
  private static coerce(row: Record<string, unknown>): Invoice {
    return {
      ...row,
      amount:      Number(row.amount      ?? 0),
      subtotal:    row.subtotal != null ? Number(row.subtotal) : null,
      tax:         Number(row.tax         ?? 0),
      tax_percent: Number(row.tax_percent ?? 0),
      total:       row.total != null ? Number(row.total) : null,
      line_items:  Array.isArray(row.line_items) ? row.line_items : [],
    } as Invoice;
  }

  // ── Log an activity event ────────────────────────────────────
  static async logActivity(invoiceId: string, type: string, data: Record<string, unknown> = {}) {
    await query(
      `INSERT INTO invoice_activity (invoice_id, type, data) VALUES ($1, $2, $3)`,
      [invoiceId, type, JSON.stringify(data)]
    ).catch(() => {}); // non-fatal
  }

  static async createInvoice(
    userId: string,
    payload: {
      clientId: string;
      title?: string;
      description?: string;
      currency?: string;
      dueDate: string;
      status?: string;
      subtotal: number;
      taxPercent: number;
      taxAmount: number;
      total: number;
      lineItems?: unknown[];
    }
  ): Promise<Invoice> {
    const year = new Date().getFullYear();
    const lastResult = await query(
      `SELECT invoice_number FROM invoices
       WHERE user_id = $1 AND invoice_number LIKE $2
       ORDER BY created_at DESC LIMIT 1`,
      [userId, `PF-${year}-%`]
    );
    let nextNum = 1;
    if (lastResult.rows[0]) {
      const parts = lastResult.rows[0].invoice_number.split('-');
      const n = parseInt(parts[2] || '0', 10);
      if (!isNaN(n)) nextNum = n + 1;
    }
    const invoiceNumber = `PF-${year}-${String(nextNum).padStart(4, '0')}`;

    const status = payload.status ?? 'draft';
    const sentAt = status === 'sent' ? new Date().toISOString() : null;

    const result = await query(
      `INSERT INTO invoices
         (user_id, client_id, invoice_number, title, description, currency,
          amount, subtotal, tax, tax_percent, total, status, due_date, sent_at, line_items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
       RETURNING *`,
      [
        userId,
        payload.clientId,
        invoiceNumber,
        payload.title || null,
        payload.description || payload.title || null,
        payload.currency || 'INR',
        payload.total,
        payload.subtotal,
        payload.taxAmount,
        payload.taxPercent,
        payload.total,
        status,
        payload.dueDate,
        sentAt,
        JSON.stringify(payload.lineItems || []),
      ]
    );

    if (!result.rows[0]) throw new Error('Failed to create invoice');
    const invoice = this.coerce(result.rows[0]);
    await this.logActivity(invoice.id as string, 'created', { invoice_number: invoiceNumber });
    return invoice;
  }

  static async getUserInvoices(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ) {
    const offset = (page - 1) * limit;
    const params: unknown[] = [userId];

    let where = 'i.user_id = $1';
    if (status) {
      params.push(status);
      where += ` AND i.status = $${params.length}`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM invoices i WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    params.push(limit, offset);
    const result = await query(
      `SELECT i.*,
              c.name AS client_name, c.email AS client_email,
              COALESCE(SUM(p.amount), 0) AS amount_paid
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN payments p ON p.invoice_id = i.id
       WHERE ${where}
       GROUP BY i.id, c.name, c.email
       ORDER BY i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const invoices = result.rows.map((r: Record<string, unknown>) => ({
      ...this.coerce(r),
      amount_paid: Number(r.amount_paid ?? 0),
      client: r.client_name ? {
        id:    r.client_id,
        name:  r.client_name,
        email: r.client_email,
      } : null,
    }));

    return {
      invoices,
      pagination: { page, limit, total, hasMore: offset + limit < total },
    };
  }

  static async getInvoiceById(userId: string, invoiceId: string): Promise<Invoice | null> {
    const result = await query(
      `SELECT i.*,
              c.id AS client_id_ref, c.name AS client_name, c.email AS client_email,
              c.phone AS client_phone, c.whatsapp AS client_whatsapp,
              c.company_name AS client_company_name, c.address AS client_address,
              COALESCE(SUM(p.amount), 0) AS amount_paid
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN payments p ON p.invoice_id = i.id
       WHERE i.id = $1 AND i.user_id = $2
       GROUP BY i.id, c.id, c.name, c.email, c.phone, c.whatsapp, c.company_name, c.address`,
      [invoiceId, userId]
    );

    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      ...this.coerce(r),
      amount_paid: Number(r.amount_paid ?? 0),
      client: r.client_name ? {
        id: r.client_id_ref,
        name: r.client_name,
        email: r.client_email,
        phone: r.client_phone,
        whatsapp: r.client_whatsapp,
        company_name: r.client_company_name,
        address: r.client_address,
      } : null,
    } as any;
  }

  static async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: unknown[] = [status];

    if (status === 'paid') updates.push(`paid_date = NOW()`);
    if (status === 'sent') updates.push(`sent_at = NOW()`);

    params.push(invoiceId);
    const result = await query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (!result.rows[0]) throw new Error('Failed to update invoice status');
    return this.coerce(result.rows[0]);
  }

  static async updateInvoice(userId: string, invoiceId: string, data: Record<string, unknown>): Promise<Invoice> {
    const allowed = ['title', 'description', 'amount', 'subtotal', 'tax', 'tax_percent', 'total',
                     'status', 'due_date', 'line_items', 'currency', 'client_id'];
    const setClauses: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];

    for (const key of allowed) {
      if (key in data) {
        params.push(key === 'line_items' ? JSON.stringify(data[key]) : data[key]);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    params.push(invoiceId, userId);
    const result = await query(
      `UPDATE invoices SET ${setClauses.join(', ')}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    );

    if (!result.rows[0]) throw new Error('Invoice not found or not authorized');
    return this.coerce(result.rows[0]);
  }

  static async deleteInvoice(userId: string, invoiceId: string): Promise<void> {
    await query(`DELETE FROM invoices WHERE id = $1 AND user_id = $2`, [invoiceId, userId]);
  }

  /** Generate a share token, stamp sent_at, set status = 'sent'. */
  static async sendInvoice(userId: string, invoiceId: string): Promise<{ token: string; invoice: Invoice }> {
    const check = await query(
      `SELECT id FROM invoices WHERE id = $1 AND user_id = $2`,
      [invoiceId, userId]
    );
    if (!check.rows[0]) throw new Error('Invoice not found');

    const { randomBytes } = await import('crypto');
    const token = randomBytes(20).toString('hex');

    const result = await query(
      `UPDATE invoices
       SET share_token = $1, status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [token, invoiceId, userId]
    );

    if (!result.rows[0]) throw new Error('Failed to send invoice');
    const invoice = this.coerce(result.rows[0]);
    await this.logActivity(invoiceId, 'sent', { token });
    return { token, invoice };
  }

  /** Fetch invoice by public share token — no auth. */
  static async getInvoiceByShareToken(token: string) {
    const result = await query(
      `SELECT i.id, i.invoice_number, i.title, i.description, i.currency, i.amount, i.subtotal,
              i.tax, i.tax_percent, i.total, i.status, i.due_date, i.sent_at, i.paid_date,
              i.line_items, i.created_at,
              c.name AS client_name, c.email AS client_email, c.company_name AS client_company,
              u.email AS freelancer_email, u.name AS freelancer_name,
              u.business_name, u.phone AS freelancer_phone,
              COALESCE(u.payment_info, '{}'::jsonb) AS payment_info,
              COALESCE(SUM(p.amount), 0) AS amount_paid
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN users u ON u.id = i.user_id
       LEFT JOIN payments p ON p.invoice_id = i.id
       WHERE i.share_token = $1
       GROUP BY i.id, i.invoice_number, i.title, i.description, i.currency, i.amount,
                i.subtotal, i.tax, i.tax_percent, i.total, i.status, i.due_date,
                i.sent_at, i.paid_date, i.line_items, i.created_at,
                c.name, c.email, c.company_name, u.email, u.name, u.business_name, u.phone, u.payment_info`,
      [token]
    );
    if (!result.rows[0]) return null;
    const r = result.rows[0];
    return {
      id:             r.id,
      invoice_number: r.invoice_number,
      title:          r.title,
      description:    r.description,
      currency:       r.currency,
      amount:         Number(r.amount),
      subtotal:       r.subtotal != null ? Number(r.subtotal) : null,
      tax:            Number(r.tax ?? 0),
      tax_percent:    Number(r.tax_percent ?? 0),
      total:          r.total != null ? Number(r.total) : null,
      status:         r.status,
      due_date:       r.due_date,
      sent_at:        r.sent_at,
      paid_date:      r.paid_date,
      amount_paid:    Number(r.amount_paid ?? 0),
      line_items:     Array.isArray(r.line_items) ? r.line_items : [],
      created_at:     r.created_at,
      client_name:    r.client_name,
      client_email:   r.client_email,
      client_company: r.client_company,
      freelancer_email:  r.freelancer_email,
      freelancer_name:   r.freelancer_name,
      freelancer_phone:  r.freelancer_phone,
      business_name:     r.business_name,
      payment_info:      r.payment_info ?? {},
    };
  }

  /** Get invoice_id from share token */
  static async getInvoiceIdByToken(token: string): Promise<string | null> {
    const result = await query(
      `SELECT id, user_id FROM invoices WHERE share_token = $1`,
      [token]
    );
    return result.rows[0]?.id ?? null;
  }

  // ── Client portal: messages ──────────────────────────────────

  static async addMessage(invoiceId: string, sender: 'client' | 'freelancer', message: string) {
    const result = await query(
      `INSERT INTO invoice_messages (invoice_id, sender, message) VALUES ($1, $2, $3) RETURNING *`,
      [invoiceId, sender, message]
    );
    await this.logActivity(invoiceId, 'message', { sender, preview: message.slice(0, 80) });
    return result.rows[0];
  }

  static async getMessages(invoiceId: string) {
    const result = await query(
      `SELECT * FROM invoice_messages WHERE invoice_id = $1 ORDER BY created_at ASC`,
      [invoiceId]
    );
    return result.rows;
  }

  // ── Client portal: payment confirmations ─────────────────────

  static async submitPayment(invoiceId: string, amount: number, method: string, reference?: string) {
    const result = await query(
      `INSERT INTO invoice_payments (invoice_id, amount, method, reference)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoiceId, amount, method, reference ?? null]
    );
    await this.logActivity(invoiceId, 'payment_requested', { amount, method });
    return result.rows[0];
  }

  static async getPendingPayments(invoiceId: string) {
    const result = await query(
      `SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY created_at DESC`,
      [invoiceId]
    );
    return result.rows;
  }

  static async confirmPayment(invoiceId: string, paymentId: string, userId: string) {
    // Update invoice_payment status
    await query(
      `UPDATE invoice_payments SET status = 'confirmed' WHERE id = $1 AND invoice_id = $2`,
      [paymentId, invoiceId]
    );
    // Get payment details
    const pr = await query(`SELECT * FROM invoice_payments WHERE id = $1`, [paymentId]);
    const pay = pr.rows[0];
    if (!pay) throw new Error('Payment not found');

    // Record in main payments table
    await query(
      `INSERT INTO payments (user_id, invoice_id, amount, method, reference, status, provider)
       VALUES ($1, $2, $3, $4, $5, 'completed', 'portal')`,
      [userId, invoiceId, pay.amount, pay.method, pay.reference ?? null]
    );

    // Check if fully paid
    const totalResult = await query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE invoice_id = $1`,
      [invoiceId]
    );
    const totalPaid = Number(totalResult.rows[0]?.total_paid ?? 0);
    const invResult = await query(`SELECT amount, total FROM invoices WHERE id = $1`, [invoiceId]);
    const invAmount = Number(invResult.rows[0]?.total ?? invResult.rows[0]?.amount ?? 0);

    if (totalPaid >= invAmount) {
      await query(
        `UPDATE invoices SET status = 'paid', paid_date = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2`,
        [invoiceId, userId]
      );
    } else if (totalPaid > 0) {
      await query(
        `UPDATE invoices SET status = 'partial', updated_at = NOW() WHERE id = $1 AND user_id = $2`,
        [invoiceId, userId]
      );
    }
    await this.logActivity(invoiceId, 'payment_confirmed', { amount: pay.amount, method: pay.method });
    return pay;
  }

  // ── Client portal: extension/dispute requests ────────────────

  static async submitRequest(invoiceId: string, type: 'extension' | 'dispute', reason: string, message?: string) {
    const result = await query(
      `INSERT INTO invoice_requests (invoice_id, type, reason, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [invoiceId, type, reason, message ?? null]
    );
    await this.logActivity(invoiceId, 'request', { type, reason });
    return result.rows[0];
  }

  static async getRequests(invoiceId: string) {
    const result = await query(
      `SELECT * FROM invoice_requests WHERE invoice_id = $1 ORDER BY created_at DESC`,
      [invoiceId]
    );
    return result.rows;
  }

  static async updateRequestStatus(invoiceId: string, requestId: string, status: 'approved' | 'rejected') {
    const result = await query(
      `UPDATE invoice_requests SET status = $1 WHERE id = $2 AND invoice_id = $3 RETURNING *`,
      [status, requestId, invoiceId]
    );
    return result.rows[0];
  }

  // ── Activity timeline ────────────────────────────────────────

  static async getActivity(invoiceId: string) {
    const result = await query(
      `SELECT * FROM invoice_activity WHERE invoice_id = $1 ORDER BY created_at ASC`,
      [invoiceId]
    );
    return result.rows;
  }

  static async getOverdueInvoices(userId?: string) {
    const today = new Date().toISOString().split('T')[0];
    const params: unknown[] = [today];
    let userFilter = '';
    if (userId) {
      params.push(userId);
      userFilter = `AND i.user_id = $${params.length}`;
    }
    const result = await query(
      `SELECT i.*, c.name AS client_name, c.email AS client_email, c.whatsapp AS client_whatsapp,
              COUNT(r.id) AS reminders_count
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN reminders r ON r.invoice_id = i.id
       WHERE i.status = 'overdue' AND i.due_date < $1 ${userFilter}
       GROUP BY i.id, c.name, c.email, c.whatsapp
       ORDER BY i.due_date ASC`,
      params
    );
    return result.rows.map((r: Record<string, unknown>) => ({
      ...this.coerce(r),
      reminders_count: Number(r.reminders_count ?? 0),
      client: { name: r.client_name, email: r.client_email, whatsapp: r.client_whatsapp },
    }));
  }

  static async promoteOverdueInvoices(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await query(
      `UPDATE invoices SET status = 'overdue', updated_at = NOW()
       WHERE status = 'sent' AND due_date < $1
       RETURNING id`,
      [today]
    );
    return result.rows.length;
  }

  static async getUpcomingDueInvoices(days: number = 7) {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date();
    future.setDate(future.getDate() + days);
    const futureDate = future.toISOString().split('T')[0];

    const result = await query(
      `SELECT i.*, c.name AS client_name, c.email AS client_email, c.whatsapp AS client_whatsapp
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE i.status = 'sent' AND i.due_date >= $1 AND i.due_date <= $2`,
      [today, futureDate]
    );
    return result.rows.map((r: Record<string, unknown>) => ({
      ...this.coerce(r),
      client: { name: r.client_name, email: r.client_email, whatsapp: r.client_whatsapp },
    }));
  }

  static async getInvoiceStats(userId: string) {
    const result = await query(
      `SELECT status, total, amount FROM invoices WHERE user_id = $1`,
      [userId]
    );
    const rows = result.rows;

    const stats = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      invoiceCount: rows.length,
    };

    rows.forEach((inv: Record<string, unknown>) => {
      const value = Number(inv.total ?? inv.amount ?? 0);
      stats.totalInvoiced += value;
      if (inv.status === 'paid')                                       stats.totalPaid    += value;
      if (['draft', 'sent', 'partial'].includes(inv.status as string)) stats.totalPending += value;
      if (inv.status === 'overdue')                                     stats.totalOverdue += value;
    });

    return stats;
  }
}
