// ============= AUTH ROUTES =============

import express, { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', (_req: Request, res: Response) =>
  res.status(410).json({ error: 'Use Supabase Auth signUp from frontend client' })
);
router.post('/login', (_req: Request, res: Response) =>
  res.status(410).json({ error: 'Use Supabase Auth signIn from frontend client' })
);
router.post('/refresh-token', (_req: Request, res: Response) =>
  res.status(410).json({ error: 'Supabase manages token refresh automatically' })
);
router.post('/change-password', (_req: Request, res: Response) =>
  res.status(410).json({ error: 'Use Supabase Auth updateUser for password changes' })
);
router.post('/request-password-reset', (_req: Request, res: Response) =>
  res.status(410).json({ error: 'Use Supabase Auth resetPasswordForEmail' })
);
router.post('/reset-password', (_req: Request, res: Response) =>
  res.status(410).json({ error: 'Handled by Supabase Auth reset flow' })
);

/**
 * POST /auth/sync
 * Sync authenticated Supabase user into app profile table
 */
router.post('/sync', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id || !req.user.email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const profile = await AuthService.syncUserFromSupabase({
      id: req.user.id,
      email: req.user.email,
      name: req.body?.name || null,
    });
    res.json(profile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await AuthService.getUserProfile(userId);
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /auth/me
 * Update user profile
 */
router.put('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { 
      name, businessName, phone, avatarUrl, invoicePrefix, 
      defaultCurrency, defaultTax, onboardingCompleted, 
      notifyInvoiceViewed, notifyPaymentReceived, notifyDailyDigest, reminderDays,
      paymentInfo,
    } = req.body;
    
    const updatedUser = await AuthService.updateProfile(userId, {
      name, businessName, phone, avatarUrl, invoicePrefix,
      defaultCurrency, defaultTax, onboardingCompleted,
      notifyInvoiceViewed, notifyPaymentReceived, notifyDailyDigest, reminderDays,
      paymentInfo,
    });

    res.json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
