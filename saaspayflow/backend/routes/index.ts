// ============= ROUTES INDEX =============

import express from 'express';
import authRoutes from './auth.js';
import clientsRoutes from './clients.js';
import invoicesRoutes from './invoices.js';
import paymentsRoutes from './payments.js';
import notificationsRoutes from './notifications.js';
import analyticsRoutes from './analytics.js';
import billingRoutes from './billing.js';
import aiRoutes from './ai.js';
import financialAnalyticsRoutes from './financialAnalytics.js';
import dashboardRoutes from './dashboard.js';
import settingsRoutes from './settings.js';

const router = express.Router();

// Mount routes with their base paths
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/payments', paymentsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/billing', billingRoutes);
router.use('/ai', aiRoutes);
router.use('/financial-analytics', financialAnalyticsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
