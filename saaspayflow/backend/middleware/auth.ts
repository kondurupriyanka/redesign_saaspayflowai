// ============= AUTH MIDDLEWARE =============
// JWT validation uses Supabase. Profile lookup uses local PostgreSQL.

import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../config/supabase.js';
import { isOwner } from '../config/billing.js';
import { query } from '../database/db.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        plan?: 'free' | 'pro' | 'growth';
        isOwner?: boolean;
      };
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[auth] Missing or invalid authorization header');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    // Validate JWT via Supabase Auth
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      console.warn('[auth] Invalid token:', error?.message || 'no user returned');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = data.user.id;
    const userEmail = data.user.email || '';

    console.log('[auth] Token validated — user_id:', userId, '| email:', userEmail);

    // Look up plan from local PostgreSQL
    let plan: 'free' | 'pro' | 'growth' = 'free';
    let isOwnerFlag = isOwner(userEmail);

    try {
      const profileResult = await query(
        `SELECT plan, is_owner FROM users WHERE id = $1`,
        [userId]
      );
      const profile = profileResult.rows[0];
      if (profile) {
        plan = (profile.plan as 'free' | 'pro' | 'growth') || 'free';
        isOwnerFlag = Boolean(profile.is_owner) || isOwner(userEmail);
      }
    } catch (profileErr: any) {
      console.warn('[auth] Profile lookup failed (non-fatal):', profileErr?.message);
    }

    if (isOwnerFlag) {
      plan = 'growth';
    }

    req.user = {
      id: userId,
      email: userEmail,
      plan,
      isOwner: isOwnerFlag,
    };

    console.log('[auth] req.user set — plan:', plan, '| isOwner:', isOwnerFlag);
    next();
  } catch (error: any) {
    console.error('[auth] Authentication error:', error.message);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data.user) {
        req.user = {
          id: data.user.id,
          email: data.user.email || '',
          isOwner: isOwner(data.user.email || ''),
        };
        if (req.user.isOwner) {
          req.user.plan = 'growth';
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  if (!req.user.isOwner) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
