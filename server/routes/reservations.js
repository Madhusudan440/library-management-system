import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { inMemoryDb } from '../config/supabase.js';

const router = express.Router();

// 1. Get all reservations (Admin view)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const list = [...inMemoryDb.reservations].sort((a, b) => new Date(b.reserved_at) - new Date(a.reserved_at));
    res.json({ success: true, reservations: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reservations.' });
  }
});

// 2. Get student's own reservations
router.get('/my', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const list = inMemoryDb.reservations
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.reserved_at) - new Date(a.reserved_at));
    res.json({ success: true, reservations: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve your reservations.' });
  }
});

// 3. Create Reservation (Student)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { book_id } = req.body;
    const userId = req.user.id;

    if (!book_id) {
      return res.status(400).json({ success: false, message: 'Book ID is required.' });
    }

    const book = inMemoryDb.books.find(b => b.id === book_id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // Check duplicate active reservation
    const duplicate = inMemoryDb.reservations.find(
      r => r.book_id === book_id &&
           r.user_id === userId &&
           (r.status === 'pending' || r.status === 'ready_for_pickup')
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active hold / reservation for this book.'
      });
    }

    // Check if student already holds an active loan of this book
    const existingLoan = inMemoryDb.loans.find(
      l => l.book_id === book_id && l.user_id === userId && (l.status === 'active' || l.status === 'overdue')
    );
    if (existingLoan) {
      return res.status(400).json({
        success: false,
        message: 'You currently hold an issued copy of this book. You cannot reserve another copy simultaneously.'
      });
    }

    // Calculate queue position
    const existingQueue = inMemoryDb.reservations.filter(
      r => r.book_id === book_id && r.status === 'pending'
    );
    const queuePosition = existingQueue.length + 1;

    // Check if book has available copies immediately
    let initialStatus = 'pending';
    let readyAt = null;
    let expiresAt = null;

    if (book.available_copies > 0) {
      // Allocate immediately
      initialStatus = 'ready_for_pickup';
      readyAt = new Date().toISOString();
      const pickupDays = inMemoryDb.settings.reservation_pickup_days || 3;
      expiresAt = new Date(Date.now() + pickupDays * 24 * 60 * 60 * 1000).toISOString();

      book.available_copies -= 1;
      book.reserved_copies += 1;
    }

    const reservationCode = `RES-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReservation = {
      id: 'res-' + Date.now(),
      reservation_code: reservationCode,
      book_id: book.id,
      book_title: book.title,
      user_id: req.user.id,
      user_name: req.user.full_name,
      student_id: req.user.student_id || 'N/A',
      queue_position: queuePosition,
      status: initialStatus,
      reserved_at: new Date().toISOString(),
      ready_at: readyAt,
      expires_at: expiresAt,
    };

    inMemoryDb.reservations.unshift(newReservation);

    // In-app notification
    const notifMsg = initialStatus === 'ready_for_pickup'
      ? `"${book.title}" is ready for pickup at the library counter. Please collect it within ${inMemoryDb.settings.reservation_pickup_days} days.`
      : `Reservation confirmed for "${book.title}". You are #${queuePosition} in the queue.`;

    inMemoryDb.notifications.unshift({
      id: 'notif-' + Date.now(),
      user_id: req.user.id,
      title: initialStatus === 'ready_for_pickup' ? 'Reservation Ready!' : 'Book Reserved',
      message: notifMsg,
      type: initialStatus === 'ready_for_pickup' ? 'success' : 'info',
      link: '/student/reservations',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'BOOK_RESERVED',
      'reservation',
      newReservation.id,
      { book: book.title, code: reservationCode, status: initialStatus }
    );

    res.status(201).json({
      success: true,
      message: initialStatus === 'ready_for_pickup'
        ? `"${book.title}" reserved and ready for pickup!`
        : `Reservation placed. You are in queue position #${queuePosition}.`,
      reservation: newReservation,
    });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(500).json({ success: false, message: 'Failed to place reservation.' });
  }
});

// 4. Cancel Reservation (Student or Admin)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const reservation = inMemoryDb.reservations.find(r => r.id === req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (req.user.role === 'student' && reservation.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this reservation.' });
    }

    if (reservation.status === 'cancelled' || reservation.status === 'fulfilled') {
      return res.status(400).json({ success: false, message: `Reservation is already ${reservation.status}.` });
    }

    // If reservation was ready_for_pickup, return copy to inventory or next student
    if (reservation.status === 'ready_for_pickup') {
      const book = inMemoryDb.books.find(b => b.id === reservation.book_id);
      if (book) {
        book.reserved_copies = Math.max(0, book.reserved_copies - 1);
        book.available_copies += 1;
      }
    }

    reservation.status = 'cancelled';

    // Shift remaining queue
    const queue = inMemoryDb.reservations
      .filter(r => r.book_id === reservation.book_id && r.status === 'pending')
      .sort((a, b) => a.queue_position - b.queue_position);

    queue.forEach((item, index) => {
      item.queue_position = index + 1;
    });

    inMemoryDb.logAudit(
      req.user.id,
      req.user.email,
      'RESERVATION_CANCELLED',
      'reservation',
      reservation.id,
      { book: reservation.book_title, code: reservation.reservation_code }
    );

    res.json({
      success: true,
      message: 'Reservation cancelled successfully.',
      reservation,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  }
});

// 5. Fulfill Reservation (Admin marks fulfilled when issuing)
router.put('/:id/fulfill', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const reservation = inMemoryDb.reservations.find(r => r.id === req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    reservation.status = 'fulfilled';
    const book = inMemoryDb.books.find(b => b.id === reservation.book_id);
    if (book && book.reserved_copies > 0) {
      book.reserved_copies -= 1;
    }

    res.json({ success: true, message: 'Reservation fulfilled.', reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fulfill reservation.' });
  }
});

export default router;
