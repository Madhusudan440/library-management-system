import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get notifications for current user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    // Admins can see alerts directed to admin OR user
    const list = inMemoryDb.notifications.filter(
      n => n.user_id === userId || (req.user.role === 'admin' && n.user_id === 'user-admin-001')
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = list.filter(n => !n.is_read).length;

    res.json({
      success: true,
      notifications: list,
      unreadCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

// 2. Mark single notification as read
router.put('/:id/read', authenticateUser, async (req, res) => {
  try {
    const notif = inMemoryDb.notifications.find(n => n.id === req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notif.is_read = true;
    res.json({ success: true, message: 'Notification marked as read.', notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// 3. Mark all as read
router.put('/read-all', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    inMemoryDb.notifications.forEach(n => {
      if (n.user_id === userId || (req.user.role === 'admin' && n.user_id === 'user-admin-001')) {
        n.is_read = true;
      }
    });

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
});

export default router;
