import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get library policy settings
router.get('/', authenticateUser, async (req, res) => {
  try {
    res.json({ success: true, settings: inMemoryDb.settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
});

// 2. Update library policies (Admin only)
router.put('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      max_borrow_limit,
      loan_duration_days,
      max_renewal_count,
      late_fee_per_day,
      reservation_pickup_days,
      enable_late_fees,
    } = req.body;

    if (max_borrow_limit !== undefined) inMemoryDb.settings.max_borrow_limit = Math.max(1, parseInt(max_borrow_limit, 10));
    if (loan_duration_days !== undefined) inMemoryDb.settings.loan_duration_days = Math.max(1, parseInt(loan_duration_days, 10));
    if (max_renewal_count !== undefined) inMemoryDb.settings.max_renewal_count = Math.max(0, parseInt(max_renewal_count, 10));
    if (late_fee_per_day !== undefined) inMemoryDb.settings.late_fee_per_day = Math.max(0, parseFloat(late_fee_per_day));
    if (reservation_pickup_days !== undefined) inMemoryDb.settings.reservation_pickup_days = Math.max(1, parseInt(reservation_pickup_days, 10));
    if (enable_late_fees !== undefined) inMemoryDb.settings.enable_late_fees = Boolean(enable_late_fees);

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'UPDATE_LIBRARY_POLICIES',
      'settings',
      inMemoryDb.settings.id,
      inMemoryDb.settings
    );

    res.json({
      success: true,
      message: 'Library policy configurations updated successfully.',
      settings: inMemoryDb.settings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

export default router;
