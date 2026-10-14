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

// In-Memory OTP Store: email -> { otp, expiresAt, attempts }
const otpStore = new Map();

// Helper to look up profile across live Supabase & inMemoryDb
async function findProfileByEmail(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (isLiveSupabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.warn('Live Supabase lookup fallback:', e.message);
    }
  }
  return inMemoryDb.profiles.find((p) => p.email.toLowerCase() === cleanEmail) || null;
}

// 1. Send OTP for Student Login or Registration
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid university or personal email address.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingStudent = await findProfileByEmail(cleanEmail);

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(cleanEmail, { otp, expiresAt, attempts: 0 });

  res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}. Valid for 10 minutes.`,
    email: cleanEmail,
    isNewStudent: !existingStudent,
    demoOtp: otp, // Visual helper for demo & viva evaluations
    expiresInSeconds: 600,
  });
});

// 2. Verify OTP & Authenticate (or register new student)
router.post('/verify-otp', async (req, res) => {
  const { email, otp, studentDetails } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const record = otpStore.get(cleanEmail);

  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this email, or code has expired. Please request a new OTP.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanEmail);
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  if (record.attempts >= 5) {
    otpStore.delete(cleanEmail);
    return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please request a new OTP.' });
  }

  if (record.otp !== otp.trim()) {
    record.attempts += 1;
    return res.status(400).json({ success: false, message: 'Incorrect OTP code. Please check and try again.' });
  }

  // OTP verified successfully!
  otpStore.delete(cleanEmail);

  // Check if existing student
  let student = await findProfileByEmail(cleanEmail);

  if (student) {
    // Existing Student - Log in immediately
    inMemoryDb.currentDemoUser = student;
    inMemoryDb.logAudit(student.id, student.email, 'STUDENT_OTP_LOGIN', 'auth', student.id, {
      method: 'OTP_VERIFICATION',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Welcome back, ${student.full_name}!`,
      user: student,
      token: student.id,
      isNewStudent: false,
    });
  }

  // New Student Flow
  if (!studentDetails || !studentDetails.full_name || !studentDetails.student_id) {
    return res.json({
      success: true,
      verified: true,
      needsRegistration: true,
      email: cleanEmail,
      message: 'OTP verified! Please complete your student profile details to finalize registration.',
    });
  }

  // Create New Student Profile
  const studentId = studentDetails.student_id.trim().toUpperCase();
  const studentName = studentDetails.full_name.trim();

  // Check if Student Roll Number is already registered
  const duplicateId = inMemoryDb.profiles.find((p) => p.student_id?.toUpperCase() === studentId);
  if (duplicateId) {
    return res.status(409).json({ success: false, message: `Student ID / Roll No '${studentId}' is already registered.` });
  }

  const newStudent = {
    id: `stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    full_name: studentName,
    email: cleanEmail,
    role: 'student',
    student_id: studentId,
    department: studentDetails.department?.trim() || 'Computer Science & Engineering',
    phone: studentDetails.phone?.trim() || '',
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(studentId)}`,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Save to inMemoryDb
  inMemoryDb.profiles.push(newStudent);
  inMemoryDb.currentDemoUser = newStudent;

  // Save to Supabase PostgreSQL if live
  if (isLiveSupabase) {
    try {
      await supabase.from('profiles').insert([newStudent]);
    } catch (err) {
      console.warn('Supabase profile insertion note:', err.message);
    }
  }

  // Add welcome notification
  inMemoryDb.notifications.unshift({
    id: `notif-${Date.now()}`,
    user_id: newStudent.id,
    title: '🎓 Welcome to CloudLib Pro!',
    message: `Hello ${studentName}! Your digital library card (Roll No: ${studentId}) is now active. You can borrow up to 3 books.`,
    is_read: false,
    created_at: new Date().toISOString(),
  });

  // Log Audit Entry
  inMemoryDb.logAudit(newStudent.id, newStudent.email, 'STUDENT_REGISTERED_OTP', 'profile', newStudent.id, {
    student_id: studentId,
    department: newStudent.department,
  });

  return res.status(201).json({
    success: true,
    message: `Registration complete! Welcome to CloudLib Pro, ${studentName}.`,
    user: newStudent,
    token: newStudent.id,
    isNewStudent: true,
  });
});

// 3. Admin / Librarian Password Login
router.post('/admin-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  
  // Find admin profile
  const adminProfile = inMemoryDb.profiles.find(
    (p) => (p.role === 'admin' || p.role === 'librarian') && (p.email.toLowerCase() === cleanEmail || cleanEmail.includes('admin'))
  ) || inMemoryDb.profiles.find((p) => p.role === 'admin');

  // Verify password (default 'admin123' or any 6+ chars in demo mode)
  if (password === 'admin123' || password === 'admin' || password.length >= 6) {
    inMemoryDb.currentDemoUser = adminProfile;
    inMemoryDb.logAudit(adminProfile.id, adminProfile.email, 'ADMIN_LOGIN', 'auth', adminProfile.id, {
      method: 'PASSWORD',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Welcome back, ${adminProfile.full_name}!`,
      user: adminProfile,
      token: adminProfile.id,
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid admin credentials. (Demo password: admin123)' });
});

// 4. Student Password Login (Alternative to OTP)
router.post('/student-login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const student = await findProfileByEmail(cleanEmail) || inMemoryDb.profiles.find((p) => p.role === 'student');

  if (password === 'student123' || password === 'student' || password.length >= 6) {
    inMemoryDb.currentDemoUser = student;
    inMemoryDb.logAudit(student.id, student.email, 'STUDENT_PASSWORD_LOGIN', 'auth', student.id, {
      method: 'PASSWORD',
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Welcome back, ${student.full_name}!`,
      user: student,
      token: student.id,
    });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials. (Demo password: student123 or use OTP)' });
});

// 5. Sign Out
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Signed out successfully.' });
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
