import React, { useState, useEffect } from 'react';
import { Repeat, AlertCircle, Check, Users, BookOpen } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';

export const IssueBookModal = ({ isOpen, onClose, onIssued }) => {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [loanDays, setLoanDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      setError('');
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      const [stuRes, bookRes, setRes] = await Promise.all([
        api.getStudents(),
        api.getBooks({ availability: 'available', limit: 100 }),
        api.getSettings(),
      ]);

      if (stuRes.success) {
        setStudents(stuRes.students || []);
        if (stuRes.students?.length > 0) setSelectedStudentId(stuRes.students[0].id);
      }

      if (bookRes.success) {
        setBooks(bookRes.books || []);
        if (bookRes.books?.length > 0) setSelectedBookId(bookRes.books[0].id);
      }

      if (setRes.success && setRes.settings) {
        setLoanDays(setRes.settings.loan_duration_days || 14);
      }
    } catch (err) {
      setError('Failed to load selection data.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookId) {
      setError('Please select both a student and a book.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.issueBook({
        user_id: selectedStudentId,
        book_id: selectedBookId,
        custom_due_days: loanDays,
      });

      if (res.success) {
        onIssued(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to issue book.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Academic Book to Student"
      subtitle="Generates unique loan ID, verifies borrowing quotas and adjusts inventory"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            Select Registered Student *
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} ({s.student_id || 'ID'}) — {s.department} [{s.activeLoansCount || 0} active loans]
              </option>
            ))}
          </select>
          {selectedStudent && (
            <p className="mt-1 text-[11px] text-slate-500">
              Active loans: <strong>{selectedStudent.activeLoansCount || 0}</strong> • Status: {selectedStudent.status}
            </p>
          )}
        </div>

        {/* Book Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            Select Available Book *
          </label>
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          >
            {books.length === 0 ? (
              <option value="">No books currently available to issue</option>
            ) : (
              books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author} ({b.available_copies} available / {b.shelf_location})
                </option>
              ))
            )}
          </select>
          {selectedBook && (
            <p className="mt-1 text-[11px] text-slate-500">
              ISBN: <span className="font-mono">{selectedBook.isbn}</span> • Shelf: {selectedBook.shelf_location}
            </p>
          )}
        </div>

        {/* Loan Duration in Days */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Loan Period (Days)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={loanDays}
            onChange={(e) => setLoanDays(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-semibold text-indigo-600 dark:text-indigo-400"
            required
          />
          <p className="mt-1 text-[11px] text-slate-400">
            Due date will be automatically set to {new Date(Date.now() + loanDays * 86400000).toLocaleDateString()}.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || books.length === 0}
            className="btn-gradient py-2.5 px-6 rounded-xl font-semibold flex items-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            {loading ? 'Processing Transaction...' : 'Issue Book Now'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
