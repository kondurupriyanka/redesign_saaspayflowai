import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { BillingService } from '../services/BillingService.js';
import { isOwner } from '../config/billing.js';

const router = express.Router();

router.get('/subscription', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const subscription = await BillingService.getUserSubscription(userId);
    res.json(subscription || { plan: 'free', status: 'active' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/checkout', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;
    if (!userId || !email) return res.status(401).json({ error: 'User not authenticated' });

    if (isOwner(email)) {
      return res.json({
        transactionId: 'owner-bypass',
        checkoutUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
      });
    }

    const { plan } = req.body;
    if (!plan) return res.status(400).json({ error: 'plan is required' });

    const checkout = await BillingService.createCheckout(userId, email, plan);
    res.json(checkout);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/webhooks/paddle', async (req, res) => {
  try {
    const signature = req.headers['paddle-signature'] as string | undefined;
    const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    
    if (!BillingService.verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    await BillingService.handleWebhook(event);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
