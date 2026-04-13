import { query } from '../database/db.js';
import { UserService } from './UserService.js';
import { isOwner } from '../config/billing.js';

interface ClientInput {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  companyName?: string;
  company_name?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: string;
  notes?: string | null;
}

// Plan limits — Free: 2, Pro: 20, Growth: 50
const PLAN_LIMITS: Record<string, number> = {
  free:   2,
  pro:    20,
  growth: 50,
};

export class ClientService {
  static async createClient(userId: string, payload: ClientInput) {
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');

    if (!user.is_owner && !isOwner(user.email)) {
      const limit = PLAN_LIMITS[user.plan] ?? 2;
      const countResult = await query(
        `SELECT COUNT(*) FROM clients WHERE user_id = $1`,
        [userId]
      );
      const count = parseInt(countResult.rows[0]?.count || '0');
      if (count >= limit) {
        const planName = user.plan === 'pro' ? 'Pro' : 'Free';
        const nextPlan = user.plan === 'free' ? 'Pro (20 clients)' : 'Growth (50 clients)';
        throw new Error(
          `You've reached the ${limit}-client limit on the ${planName} plan. Upgrade to ${nextPlan} to add more clients.`
        );
      }
    }

    const result = await query(
      `INSERT INTO clients (user_id, name, email, phone, whatsapp, company_name, gst_number, pan_number, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        payload.name,
        payload.email || null,
        payload.phone || null,
        payload.whatsapp || null,
        payload.company_name || payload.companyName || null,
        payload.gstNumber || null,
        payload.panNumber || null,
        payload.address || null,
      ]
    );

    if (!result.rows[0]) throw new Error('Failed to create client');
    return result.rows[0];
  }

  /**
   * Returns clients with aggregated invoice/payment stats in a single query.
   */
  static async getUserClients(userId: string, page: number = 1, limit: number = 100, search?: string) {
    const offset = (page - 1) * limit;
    const params: unknown[] = [userId];

    let whereClause = 'c.user_id = $1';
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (c.name ILIKE $${params.length} OR c.email ILIKE $${params.length})`;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM clients c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    params.push(limit, offset);
    const result = await query(
      `SELECT
         c.*,
         COALESCE(SUM(i.amount) FILTER (WHERE i.id IS NOT NULL), 0)::numeric   AS total_billed,
         COALESCE(SUM(p_agg.paid_amount), 0)::numeric                           AS total_paid,
         COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'overdue'), 0)::numeric AS overdue_amount,
         COUNT(DISTINCT i.id)::int                                               AS invoice_count
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       LEFT JOIN (
         SELECT invoice_id, SUM(amount) AS paid_amount
         FROM payments
         WHERE status = 'completed'
         GROUP BY invoice_id
       ) p_agg ON p_agg.invoice_id = i.id
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const clients = result.rows.map((r: any) => ({
      ...r,
      totalBilled:   Number(r.total_billed   ?? 0),
      totalPaid:     Number(r.total_paid     ?? 0),
      overdueAmount: Number(r.overdue_amount ?? 0),
      invoiceCount:  Number(r.invoice_count  ?? 0),
    }));

    return {
      clients,
      pagination: { page, limit, total, hasMore: offset + limit < total },
    };
  }

  static async getClient(clientId: string) {
    const result = await query(`SELECT * FROM clients WHERE id = $1`, [clientId]);
    return result.rows[0] || null;
  }

  static async updateClient(clientId: string, payload: ClientInput) {
    const result = await query(
      `UPDATE clients
       SET name = $1, email = $2, phone = $3, whatsapp = $4, company_name = $5,
           gst_number = $6, pan_number = $7, address = $8, notes = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        payload.name,
        payload.email || null,
        payload.phone || null,
        payload.whatsapp || null,
        payload.company_name || payload.companyName || null,
        payload.gstNumber || null,
        payload.panNumber || null,
        payload.address || null,
        payload.notes ?? null,
        clientId,
      ]
    );
    if (!result.rows[0]) throw new Error('Failed to update client');
    return result.rows[0];
  }

  static async deleteClient(clientId: string) {
    await query(`DELETE FROM clients WHERE id = $1`, [clientId]);
  }

  static async getClientStatistics(clientId: string) {
    const result = await query(
      `SELECT
         COALESCE(SUM(i.amount) FILTER (WHERE i.id IS NOT NULL), 0)::numeric   AS total_invoiced,
         COALESCE(SUM(p_agg.paid_amount), 0)::numeric                           AS total_paid,
         COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'overdue'), 0)::numeric AS overdue_amount,
         COUNT(DISTINCT i.id)::int                                               AS invoice_count,
         COUNT(DISTINCT i.id) FILTER (WHERE i.status IN ('draft','sent','partial'))::int AS pending_invoices,
         COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'overdue')::int          AS overdue_invoices
       FROM clients c
       LEFT JOIN invoices i ON i.client_id = c.id
       LEFT JOIN (
         SELECT invoice_id, SUM(amount) AS paid_amount
         FROM payments WHERE status = 'completed' GROUP BY invoice_id
       ) p_agg ON p_agg.invoice_id = i.id
       WHERE c.id = $1`,
      [clientId]
    );

    const row = result.rows[0] || {};
    const totalInvoiced = Number(row.total_invoiced ?? 0);
    const totalPaid     = Number(row.total_paid     ?? 0);

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding: Math.max(totalInvoiced - totalPaid, 0),
      invoiceCount:     Number(row.invoice_count    ?? 0),
      pendingInvoices:  Number(row.pending_invoices ?? 0),
      overdueInvoices:  Number(row.overdue_invoices ?? 0),
    };
  }
}
