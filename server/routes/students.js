import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get all students (Admin)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let students = inMemoryDb.profiles.filter(p => p.role === 'student');

    if (search) {
      const q = search.toLowerCase();
      students = students.filter(s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.student_id?.toLowerCase().includes(q)
      );
    }

    if (department) {
      students = students.filter(s => s.department === department);
    }

    if (status) {
      students = students.filter(s => s.status === status);
    }

    // Attach active loans and overdue count for each student
    const result = students.map(student => {
      const activeLoans = inMemoryDb.loans.filter(
        l => l.user_id === student.id && (l.status === 'active' || l.status === 'overdue')
      );
      const overdueLoans = activeLoans.filter(l => l.status === 'overdue');
      const reservations = inMemoryDb.reservations.filter(
        r => r.user_id === student.id && (r.status === 'pending' || r.status === 'ready_for_pickup')
      );

      return {
        ...student,
        activeLoansCount: activeLoans.length,
        overdueLoansCount: overdueLoans.length,
        activeReservationsCount: reservations.length,
      };
    });

    res.json({ success: true, students: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
  }
});

// 2. Get single student details with loan and reservation history (Admin)
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const student = inMemoryDb.profiles.find(p => p.id === req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const loans = inMemoryDb.loans.filter(l => l.user_id === student.id);
    const reservations = inMemoryDb.reservations.filter(r => r.user_id === student.id);

    res.json({
      success: true,
      student: {
        ...student,
        loans,
        reservations,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student details.' });
  }
});

// 3. Register a new student account (Admin)
router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { full_name, email, student_id, department, phone } = req.body;

    if (!full_name || !email || !student_id) {
      return res.status(400).json({ success: false, message: 'Full name, email, and Student ID (Roll No) are required.' });
    }

    const emailExists = inMemoryDb.profiles.find(p => p.email?.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(409).json({ success: false, message: 'A student profile with this email already exists.' });
    }

    const idExists = inMemoryDb.profiles.find(p => p.student_id?.toLowerCase() === student_id.toLowerCase());
    if (idExists) {
      return res.status(409).json({ success: false, message: `Student ID "${student_id}" is already registered.` });
    }

    const newStudent = {
      id: 'student-' + Date.now(),
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      role: 'student',
      student_id: student_id.trim().toUpperCase(),
      department: department || 'Computer Science & Engineering',
      phone: phone || '',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    inMemoryDb.profiles.push(newStudent);

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'REGISTER_STUDENT',
      'profiles',
      newStudent.id,
      { student_name: newStudent.full_name, student_id: newStudent.student_id }
    );

    res.status(201).json({
      success: true,
      message: `Student account for ${newStudent.full_name} (${newStudent.student_id}) created successfully.`,
      student: newStudent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register student.' });
  }
});

// 4. Update student profile / status (Admin)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const student = inMemoryDb.profiles.find(p => p.id === req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const { full_name, department, phone, status, student_id } = req.body;
    if (full_name) student.full_name = full_name;
    if (department) student.department = department;
    if (phone !== undefined) student.phone = phone;
    if (status) student.status = status;
    if (student_id) student.student_id = student_id;

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'UPDATE_STUDENT',
      'profiles',
      student.id,
      { status: student.status, full_name: student.full_name }
    );

    res.json({ success: true, message: 'Student profile updated.', student });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update student.' });
  }
});

export default router;
