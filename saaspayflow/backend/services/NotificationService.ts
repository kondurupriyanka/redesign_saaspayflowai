// ============= NOTIFICATION SERVICE =============

import { query } from '../database/db.js';
import { EmailService } from './EmailService.js';

export enum NotificationType {
  INVOICE_SENT = 'invoice_sent',
  INVOICE_PAID = 'invoice_paid',
  PAYMENT_REMINDER = 'payment_reminder',
  OVERDUE_ALERT = 'overdue_alert',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  MILESTONE_REACHED = 'milestone_reached',
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
}

export class NotificationService {
  static async createNotification(payload: NotificationPayload) {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, is_read)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        payload.userId,
        payload.type,
        payload.title,
        payload.message,
        JSON.stringify(payload.data || {}),
        payload.read || false,
      ]
    );

    if (!result.rows[0]) throw new Error('Failed to create notification');

    const emailTypes = new Set([
      NotificationType.INVOICE_SENT,
      NotificationType.INVOICE_PAID,
      NotificationType.PAYMENT_REMINDER,
      NotificationType.OVERDUE_ALERT,
      NotificationType.PAYMENT_RECEIVED,
      NotificationType.PAYMENT_FAILED,
    ]);

    if (emailTypes.has(payload.type)) {
      void EmailService.sendNotificationEmail({
        userId: payload.userId,
        type: payload.type as any,
        title: payload.title,
        message: payload.message,
        data: payload.data,
      }).catch((emailError) => {
        console.error('Failed to send notification email:', emailError);
      });
    }

    return result.rows[0];
  }

  static async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    const countResult = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0]?.count || '0');

    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      notifications: result.rows,
      total,
      hasMore: offset + limit < total,
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || '0');
  }

  static async markAsRead(notificationId: string, userId: string) {
    const result = await query(
      `UPDATE notifications
       SET is_read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    if (!result.rows[0]) throw new Error('Failed to mark as read');
    return result.rows[0];
  }

  static async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = true, read_at = NOW()
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  static async deleteNotification(notificationId: string, userId: string) {
    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
  }

  static async clearAllNotifications(userId: string) {
    await query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
  }

  static async sendBatch(notifications: NotificationPayload[]) {
    if (!notifications.length) return [];

    const values: any[] = [];
    const placeholders = notifications.map((n, i) => {
      const base = i * 6;
      values.push(n.userId, n.type, n.title, n.message, JSON.stringify(n.data || {}), false);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, data, is_read)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );
    return result.rows;
  }
}
