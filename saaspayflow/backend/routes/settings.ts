// ============= SETTINGS ROUTES =============
// Dedicated endpoint for reading and writing all user settings.
// Uses user_id from the verified JWT — never from the request body.

import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../database/db.js';

const router = express.Router();

// ── GET /api/settings ──────────────────────────────────────────────────────
// Returns the complete settings row for the authenticated user.
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = await query(`SELECT * FROM users WHERE id = $1`, [userId]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('[settings] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/settings ──────────────────────────────────────────────────────
// Accepts any combination of profile / payment / notification fields.
// Builds a dynamic SET clause — only columns explicitly provided are updated.
// user_id always comes from the verified JWT (req.user.id), never from body.
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const {
      // Profile
      business_name,
      full_name,
      phone,
      avatar_url,
      invoice_prefix,
      default_currency,
      default_tax,
      // Payment info (full JSONB object)
      payment_info,
      // Notifications
      notify_invoice_viewed,
      notify_payment_received,
      notify_daily_digest,
      reminder_days,
    } = req.body;

    console.log('[settings] PUT payload for user', userId, ':', JSON.stringify(req.body, null, 2));

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: unknown[] = [];

    function add(col: string, val: unknown) {
      if (val !== undefined) {
        params.push(val);
        setClauses.push(`${col} = $${params.length}`);
      }
    }

    add('business_name', business_name);
    add('name', full_name);
    add('phone', phone);
    add('avatar_url', avatar_url);
    add('invoice_prefix', invoice_prefix);
    add('default_currency', default_currency);
    add('default_tax', default_tax !== undefined ? Number(default_tax) : undefined);
    add('notify_invoice_viewed', notify_invoice_viewed);
    add('notify_payment_received', notify_payment_received);
    add('notify_daily_digest', notify_daily_digest);
    add('reminder_days', reminder_days !== undefined ? Number(reminder_days) : undefined);

    // payment_info is stored as JSONB
    if (payment_info !== undefined) {
      params.push(JSON.stringify(payment_info));
      setClauses.push(`payment_info = $${params.length}`);
    }

    params.push(userId);
    const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`;

    const result = await query(sql, params);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    console.log('[settings] PUT saved — row id:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('[settings] PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
