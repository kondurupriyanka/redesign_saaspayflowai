// ============= CLIENTS ROUTES =============

import express from 'express';
import { ClientService } from '../services/ClientService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /clients
 * Create a new client
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, email, phone, whatsapp, companyName, company_name, gstNumber, panNumber, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const client = await ClientService.createClient(userId, {
      name,
      email,
      phone,
      whatsapp,
      companyName: companyName ?? company_name,
      company_name: company_name ?? companyName,
      gstNumber,
      panNumber,
      address,
    });

    res.status(201).json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /clients
 * Get all clients for user with pagination
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const result = await ClientService.getUserClients(userId, page, limit, search);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /clients/:id
 * Get a specific client
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clientId = String(req.params.id);
    const client = await ClientService.getClient(clientId);

    if (!client || client.user_id !== userId) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /clients/:id
 * Update a client
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clientId = String(req.params.id);

    // Verify ownership
    const client = await ClientService.getClient(clientId);
    if (!client || client.user_id !== userId) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { name, email, phone, whatsapp, companyName, company_name, gstNumber, panNumber, address, notes } = req.body;

    const updatedClient = await ClientService.updateClient(clientId, {
      name,
      email,
      phone,
      whatsapp,
      companyName: companyName ?? company_name,
      company_name: company_name ?? companyName,
      gstNumber,
      panNumber,
      address,
      notes: notes ?? null,
    });

    res.json(updatedClient);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * DELETE /clients/:id
 * Delete a client
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clientId = String(req.params.id);

    // Verify ownership
    const client = await ClientService.getClient(clientId);
    if (!client || client.user_id !== userId) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await ClientService.deleteClient(clientId);
    res.json({ message: 'Client deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /clients/:id/statistics
 * Get client statistics (invoices, payments)
 */
router.get('/:id/statistics', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const clientId = String(req.params.id);

    // Verify ownership
    const client = await ClientService.getClient(clientId);
    if (!client || client.user_id !== userId) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const stats = await ClientService.getClientStatistics(clientId);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
