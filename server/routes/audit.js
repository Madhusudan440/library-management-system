import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// Get audit logs for compliance and accountability (Admin only)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { action, entity_type, limit = 50 } = req.query;
    let list = [...inMemoryDb.auditLogs];

    if (action) {
      list = list.filter(l => l.action === action);
    }

    if (entity_type) {
      list = list.filter(l => l.entity_type === entity_type);
    }

    const limitNum = parseInt(limit, 10) || 50;
    res.json({
      success: true,
      auditLogs: list.slice(0, limitNum),
      total: list.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit trail.' });
  }
});

export default router;
