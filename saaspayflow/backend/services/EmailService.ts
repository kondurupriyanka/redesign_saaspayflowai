// ============= EMAIL SERVICE =============

import { query } from '../database/db.js';

type NotificationEmailType = 'invoice_sent' | 'invoice_paid' | 'payment_reminder' | 'overdue_alert' | 'payment_received' | 'payment_failed';

interface EmailRecipient {
  email: string;
  name?: string | null;
}

interface SendEmailPayload {
  to: EmailRecipient;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static readonly resendUrl = 'https://api.resend.com/emails';

  private static renderBrandLogo() {
    return `
      <div style="display:inline-flex;align-items:center;gap:12px;margin-bottom:24px">
        <div style="width:48px;height:48px;border-radius:16px;background:rgba(163,255,63,.10);border:1px solid rgba(163,255,63,.20);display:flex;align-items:center;justify-content:center;box-shadow:0 0 24px rgba(163,255,63,.16)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20 6.5V3l-3.5 3.5" stroke="#A3FF3F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 17.5V21l3.5-3.5" stroke="#A3FF3F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5.5 8.5A8 8 0 0 1 19 6.5" stroke="#A3FF3F" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M18.5 15.5A8 8 0 0 1 5 17.5" stroke="#A3FF3F" stroke-width="2.4" stroke-linecap="round"/>
          </svg>
        </div>
        <div style="font-size:20px;font-weight:700;line-height:1;letter-spacing:-0.02em">
          <span style="color:#ffffff">PayFlow</span>
          <span style="color:#A3FF3F;margin-left:4px">AI</span>
        </div>
      </div>
    `;
  }

  static async sendEmail(payload: SendEmailPayload) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_API_KEY');
    }

    const from = process.env.RESEND_FROM_EMAIL || 'PayFlow AI <no-reply@payflowai.com>';

    const response = await fetch(this.resendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [payload.to.email],
        subject: payload.subject,
        html: payload.html,
        text: payload.text || payload.subject,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!response.ok) {
      throw new Error(body?.message || body?.error || 'Failed to send email');
    }

    return body;
  }

  static async sendNotificationEmail(notification: {
    userId: string;
    type: NotificationEmailType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    const result = await query(
      `SELECT email, name, business_name FROM users WHERE id = $1`,
      [notification.userId]
    );
    const user = result.rows[0];

    if (!user?.email) return null;

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#0a0f0a;color:#ffffff;padding:24px">
        <div style="max-width:640px;margin:0 auto;background:#0f1a12;border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:32px">
          ${this.renderBrandLogo()}
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2">${notification.title}</h1>
          <p style="margin:0 0 16px;color:rgba(255,255,255,.75);font-size:15px;line-height:1.6">${notification.message}</p>
          <p style="margin:24px 0 0;color:#a3ff3f;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">PayFlow AI</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: { email: user.email, name: user.name || user.business_name || undefined },
      subject: notification.title,
      html,
      text: notification.message,
    });
  }
}
