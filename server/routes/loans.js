import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get all loans (Admin view with filter for active, overdue, returned)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    let list = [...inMemoryDb.loans];

    if (status && status !== 'all') {
      list = list.filter(l => l.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.loan_code?.toLowerCase().includes(q) ||
        l.book_title?.toLowerCase().includes(q) ||
        l.user_name?.toLowerCase().includes(q) ||
        l.student_id?.toLowerCase().includes(q)
      );
    }

    // Refresh overdue calculations
    const now = new Date();
    list.forEach(loan => {
      if (loan.status === 'active' && new Date(loan.due_date) < now) {
        loan.status = 'overdue';
        const diffDays = Math.ceil((now - new Date(loan.due_date)) / (1000 * 60 * 60 * 24));
        if (inMemoryDb.settings.enable_late_fees) {
          loan.fine_amount = diffDays * inMemoryDb.settings.late_fee_per_day;
        }
      }
    });

    list.sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date));
    res.json({ success: true, loans: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve loans.' });
  }
});

// 2. Get current student's loans
router.get('/my-loans', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let list = inMemoryDb.loans.filter(l => l.user_id === userId);

    const now = new Date();
    list.forEach(loan => {
      if (loan.status === 'active' && new Date(loan.due_date) < now) {
        loan.status = 'overdue';
        const diffDays = Math.ceil((now - new Date(loan.due_date)) / (1000 * 60 * 60 * 24));
        if (inMemoryDb.settings.enable_late_fees) {
          loan.fine_amount = diffDays * inMemoryDb.settings.late_fee_per_day;
        }
      }
    });

    list.sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date));
    res.json({ success: true, loans: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student loans.' });
  }
});

// 3. Issue Book (Admin)
router.post('/issue', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { book_id, user_id, custom_due_days } = req.body;

    if (!book_id || !user_id) {
      return res.status(400).json({ success: false, message: 'Book ID and Student User ID are required.' });
    }

    const book = inMemoryDb.books.find(b => b.id === book_id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No available copies left for this book. All copies are currently issued or reserved.'
      });
    }

    const student = inMemoryDb.profiles.find(p => p.id === user_id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    // Check student borrowing limit
    const activeStudentLoans = inMemoryDb.loans.filter(
      l => l.user_id === user_id && (l.status === 'active' || l.status === 'overdue')
    );

    const maxLimit = inMemoryDb.settings.max_borrow_limit || 4;
    if (activeStudentLoans.length >= maxLimit) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit exceeded: ${student.full_name} already has ${activeStudentLoans.length} active loans (Policy limit: ${maxLimit}).`
      });
    }

    // Check if student already holds a copy of this book
    const duplicateHold = activeStudentLoans.find(l => l.book_id === book_id);
    if (duplicateHold) {
      return res.status(400).json({
        success: false,
        message: `Student already holds an active loan for "${book.title}". Duplicate checkout prohibited.`
      });
    }

    // Find available copy
    const copy = inMemoryDb.copies.find(c => c.book_id === book_id && c.status === 'available');
    if (copy) {
      copy.status = 'issued';
    }

    // Decrement available copies atomically
    book.available_copies -= 1;
    book.issued_copies += 1;

    // Calculate due date
    const loanDays = parseInt(custom_due_days, 10) || inMemoryDb.settings.loan_duration_days || 14;
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + loanDays * 24 * 60 * 60 * 1000);
    const loanCode = `LN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLoan = {
      id: 'loan-' + Date.now(),
      loan_code: loanCode,
      book_id: book.id,
      book_title: book.title,
      copy_id: copy ? copy.id : null,
      user_id: student.id,
      user_name: student.full_name,
      user_email: student.email,
      student_id: student.student_id || 'N/A',
      issue_date: issueDate.toISOString(),
      due_date: dueDate.toISOString(),
      return_date: null,
      renewal_count: 0,
      status: 'active',
      fine_amount: 0.00,
      fine_paid: false,
      issued_by: req.user.id,
      created_at: new Date().toISOString(),
    };

    inMemoryDb.loans.unshift(newLoan);

    // Send notification to student
    inMemoryDb.notifications.unshift({
      id: 'notif-' + Date.now(),
      user_id: student.id,
      title: 'Book Issued Successfully',
      message: `"${book.title}" was issued to you. Due date: ${dueDate.toLocaleDateString()}. Loan ID: ${loanCode}.`,
      type: 'info',
      link: '/student/loans',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // Audit log
    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'LOAN_ISSUED',
      'loan',
      newLoan.id,
      { loan_code: loanCode, book: book.title, student: student.full_name, due_date: dueDate }
    );

    res.status(201).json({
      success: true,
      message: `Book "${book.title}" successfully issued to ${student.full_name}.`,
      loan: newLoan,
    });
  } catch (err) {
    console.error('Issue book error:', err);
    res.status(500).json({ success: false, message: 'Failed to issue book.' });
  }
});

// 4. Return Book (Admin)
router.post('/return', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { loan_id, fine_waived = false } = req.body;
    if (!loan_id) {
      return res.status(400).json({ success: false, message: 'Loan ID is required.' });
    }

    const loan = inMemoryDb.loans.find(l => l.id === loan_id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan record not found.' });
    }

    if (loan.status === 'returned') {
      return res.status(400).json({ success: false, message: 'This book has already been marked returned.' });
    }

    const returnDate = new Date();
    loan.return_date = returnDate.toISOString();
    loan.status = 'returned';

    // Calculate final overdue fine if applicable
    const dueDate = new Date(loan.due_date);
    if (returnDate > dueDate && inMemoryDb.settings.enable_late_fees && !fine_waived) {
      const diffDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      loan.fine_amount = diffDays * inMemoryDb.settings.late_fee_per_day;
      loan.fine_paid = true;
    } else {
      loan.fine_amount = 0.00;
      loan.fine_paid = true;
    }

    const book = inMemoryDb.books.find(b => b.id === loan.book_id);
    const copy = loan.copy_id ? inMemoryDb.copies.find(c => c.id === loan.copy_id) : null;

    // Check if there is an active reservation waiting for this book
    const nextReservation = inMemoryDb.reservations
      .filter(r => r.book_id === loan.book_id && r.status === 'pending')
      .sort((a, b) => a.queue_position - b.queue_position || new Date(a.reserved_at) - new Date(b.reserved_at))[0];

    if (nextReservation) {
      // Allocate copy to the reserved student
      nextReservation.status = 'ready_for_pickup';
      nextReservation.ready_at = new Date().toISOString();
      const pickupDays = inMemoryDb.settings.reservation_pickup_days || 3;
      nextReservation.expires_at = new Date(Date.now() + pickupDays * 24 * 60 * 60 * 1000).toISOString();

      if (copy) copy.status = 'reserved';
      if (book) {
        book.issued_copies = Math.max(0, book.issued_copies - 1);
        book.reserved_copies += 1;
      }

      // Notify the reserved student
      inMemoryDb.notifications.unshift({
        id: 'notif-' + Date.now(),
        user_id: nextReservation.user_id,
        title: 'Reserved Book Ready for Pickup!',
        message: `Your reserved copy of "${nextReservation.book_title || book?.title}" has arrived. Please pick it up within ${pickupDays} days.`,
        type: 'reservation',
        link: '/student/reservations',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else {
      // Return to available inventory
      if (copy) copy.status = 'available';
      if (book) {
        book.issued_copies = Math.max(0, book.issued_copies - 1);
        book.available_copies += 1;
      }
    }

    // Send return receipt notification to student
    inMemoryDb.notifications.unshift({
      id: 'notif-' + Date.now(),
      user_id: loan.user_id,
      title: 'Book Return Confirmed',
      message: `Return processed for "${loan.book_title}". Fine paid: ₹${loan.fine_amount.toFixed(2)}.`,
      type: 'success',
      link: '/student/loans',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'BOOK_RETURNED',
      'loan',
      loan.id,
      { book: loan.book_title, student: loan.user_name, fine: loan.fine_amount }
    );

    res.json({
      success: true,
      message: `Book "${loan.book_title}" returned successfully.`,
      loan,
    });
  } catch (err) {
    console.error('Return book error:', err);
    res.status(500).json({ success: false, message: 'Failed to process book return.' });
  }
});

// 5. Renew Loan (Student or Admin)
router.post('/renew', authenticateUser, async (req, res) => {
  try {
    const { loan_id } = req.body;
    if (!loan_id) {
      return res.status(400).json({ success: false, message: 'Loan ID is required.' });
    }

    const loan = inMemoryDb.loans.find(l => l.id === loan_id);
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    // Authorization: only student owner or admin can renew
    if (req.user.role === 'student' && loan.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot renew another student\'s loan.' });
    }

    if (loan.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Cannot renew a returned loan.' });
    }

    // Check maximum renewal policy
    const maxRenewals = inMemoryDb.settings.max_renewal_count || 2;
    if (loan.renewal_count >= maxRenewals) {
      return res.status(400).json({
        success: false,
        message: `Maximum renewal limit (${maxRenewals}) reached for this book loan.`
      });
    }

    // Check if another student has placed a pending reservation on this book
    const hasReservationHold = inMemoryDb.reservations.some(
      r => r.book_id === loan.book_id && r.status === 'pending'
    );

    if (hasReservationHold) {
      return res.status(400).json({
        success: false,
        message: 'Renewal denied: Another student has reserved this book. Please return it on the current due date.'
      });
    }

    // Extend due date by loan_duration_days
    const extensionDays = inMemoryDb.settings.loan_duration_days || 14;
    const currentDueDate = new Date(loan.due_date);
    const newDueDate = new Date(currentDueDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    loan.due_date = newDueDate.toISOString();
    loan.renewal_count += 1;
    loan.status = 'active'; // Reset if it was overdue
    loan.fine_amount = 0.00;

    inMemoryDb.notifications.unshift({
      id: 'notif-' + Date.now(),
      user_id: loan.user_id,
      title: 'Loan Renewed Successfully',
      message: `Your loan for "${loan.book_title}" has been extended by ${extensionDays} days to ${newDueDate.toLocaleDateString()}. (Renewal ${loan.renewal_count}/${maxRenewals})`,
      type: 'info',
      link: '/student/loans',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'LOAN_RENEWED',
      'loan',
      loan.id,
      { book: loan.book_title, student: loan.user_name, new_due_date: newDueDate }
    );

    res.json({
      success: true,
      message: `Loan renewed successfully. New due date is ${newDueDate.toLocaleDateString()}.`,
      loan,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to renew loan.' });
  }
});

export default router;
