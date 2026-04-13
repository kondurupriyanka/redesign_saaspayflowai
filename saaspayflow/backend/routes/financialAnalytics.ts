import express from 'express';
import { FinancialAnalyticsService } from '../services/FinancialAnalyticsService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/financial-analytics
 * Get comprehensive financial analytics for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is on Pro plan (Optional: can also be checked in middleware)
    if (req.user?.plan === 'free') {
       // We still allow the API call but frontend will show the gate.
       // Alternatively, we could 403 here:
       // return res.status(403).json({ error: 'Pro plan required' });
    }

    const analytics = await FinancialAnalyticsService.getFinancialAnalytics(userId);
    res.json(analytics);
  } catch (error: any) {
    console.error('Financial Analytics Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
