import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import { supabase, isLiveSupabase, inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// Get current authenticated user profile
router.get('/profile', authenticateUser, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
    isLiveSupabase,
  });
});

// Demo role switcher for testing and demonstration
router.post('/switch-demo-role', async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'librarian', 'student'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  }

  const target = inMemoryDb.profiles.find(p => p.role === role) || {
    id: `user-${role}-demo`,
    full_name: role === 'admin' ? 'Dr. Sarah Mitchell (Admin)' : 'Rahul Sharma (Student)',
    email: `${role}@cloudlib.edu`,
    role,
    department: 'Computer Science & Engineering',
    status: 'active'
  };

  inMemoryDb.currentDemoUser = target;
  res.json({
    success: true,
    message: `Switched demo role to ${role}`,
    user: target,
  });
});

// Update profile details
router.put('/profile', authenticateUser, async (req, res) => {
  const { full_name, phone, department, avatar_url } = req.body;
  const userId = req.user.id;

  if (isLiveSupabase) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, phone, department, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res.json({ success: true, message: 'Profile updated successfully.', user: data });
  } else {
    const profile = inMemoryDb.profiles.find(p => p.id === userId);
    if (profile) {
      if (full_name) profile.full_name = full_name;
      if (phone) profile.phone = phone;
      if (department) profile.department = department;
      if (avatar_url) profile.avatar_url = avatar_url;
      return res.json({ success: true, message: 'Profile updated successfully.', user: profile });
    }
    return res.json({ success: true, message: 'Profile updated in session.', user: req.user });
  }
});

// Password recovery / change simulation
router.post('/change-password', authenticateUser, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  if (isLiveSupabase) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  inMemoryDb.logAudit(req.user.id, req.user.email, 'PASSWORD_CHANGED', 'profile', req.user.id, { timestamp: new Date() });
  res.json({ success: true, message: 'Password changed successfully.' });
});

export default router;
