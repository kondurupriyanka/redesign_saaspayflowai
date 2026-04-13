// ============= ANALYTICS SERVICE =============

import { query } from '../database/db.js';

export interface AnalyticsEvent {
  userId: string;
  eventType: string;
  eventName: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export class AnalyticsService {
  static async trackEvent(event: AnalyticsEvent) {
    try {
      const result = await query(
        `INSERT INTO analytics_events (user_id, event_type, event_name, properties, timestamp)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          event.userId,
          event.eventType,
          event.eventName,
          JSON.stringify(event.properties || {}),
          event.timestamp || new Date().toISOString(),
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  static async getUserAnalytics(userId: string, startDate: string, endDate: string) {
    const result = await query(
      `SELECT * FROM analytics_events
       WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
       ORDER BY timestamp DESC`,
      [userId, startDate, endDate]
    );
    return result.rows;
  }

  static async getEventSummary(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await query(
      `SELECT event_name FROM analytics_events
       WHERE user_id = $1 AND timestamp >= $2`,
      [userId, startDate.toISOString()]
    );

    const summary: Record<string, number> = {};
    result.rows.forEach((event: any) => {
      summary[event.event_name] = (summary[event.event_name] || 0) + 1;
    });

    return summary;
  }

  static async getUserAttribution(userId: string) {
    const result = await query(
      `SELECT properties->>'source' AS source, properties->>'campaign' AS campaign
       FROM analytics_events
       WHERE user_id = $1 AND event_type = 'user_signup'
       LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  static async trackBatchEvents(events: AnalyticsEvent[]) {
    if (!events.length) return [];

    const values: any[] = [];
    const placeholders = events.map((e, i) => {
      const base = i * 5;
      values.push(
        e.userId,
        e.eventType,
        e.eventName,
        JSON.stringify(e.properties || {}),
        e.timestamp || new Date().toISOString()
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    });

    try {
      const result = await query(
        `INSERT INTO analytics_events (user_id, event_type, event_name, properties, timestamp)
         VALUES ${placeholders.join(', ')}
         RETURNING *`,
        values
      );
      return result.rows;
    } catch (error) {
      console.error('Failed to track batch events:', error);
      return [];
    }
  }
}
