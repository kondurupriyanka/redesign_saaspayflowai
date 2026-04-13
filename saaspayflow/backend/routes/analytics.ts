// ============= ANALYTICS ROUTES =============

import express from 'express';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /analytics/track
 * Track an analytics event
 */
router.post('/track', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { eventType, eventName, properties } = req.body;

    if (!eventType || !eventName) {
      return res.status(400).json({
        error: 'Event type and event name are required',
      });
    }

    const event = await AnalyticsService.trackEvent({
      userId,
      eventType,
      eventName,
      properties,
    });

    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /analytics
 * Get user analytics for a date range
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required',
      });
    }

    const analytics = await AnalyticsService.getUserAnalytics(
      userId,
      startDate as string,
      endDate as string
    );

    res.json(analytics);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /analytics/summary
 * Get event summary for dashboard
 */
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const summary = await AnalyticsService.getEventSummary(userId, days);

    res.json(summary);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /analytics/attribution
 * Get user attribution data
 */
router.get('/attribution', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const attribution = await AnalyticsService.getUserAttribution(userId);
    res.json(attribution || {});
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
