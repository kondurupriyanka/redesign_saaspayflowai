// ============= NOTIFICATIONS ROUTES =============

import express from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /notifications
 * Get all notifications for user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await NotificationService.getUserNotifications(userId, limit, offset);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /notifications/unread
 * Get unread notification count
 */
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const count = await NotificationService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const notificationId = String(req.params.id);
    const notification = await NotificationService.markAsRead(notificationId, userId);
    res.json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read for user
 */
router.put('/read/all', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await NotificationService.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const notificationId = String(req.params.id);
    await NotificationService.deleteNotification(notificationId, userId);
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /notifications
 * Clear all notifications for user
 */
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await NotificationService.clearAllNotifications(userId);
    res.json({ message: 'All notifications cleared' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
