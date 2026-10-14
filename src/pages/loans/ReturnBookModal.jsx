import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Check, DollarSign } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { api } from '../../services/api';

export const ReturnBookModal = ({ isOpen, onClose, loan, onReturned }) => {
  if (!loan) return null;

  const [waiveFine, setWaiveFine] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dueDate = new Date(loan.due_date);
  const isOverdue = new Date() > dueDate;
  const overdueDays = Math.max(0, Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24)));
  const calculatedFine = isOverdue ? overdueDays * 2.0 : 0.0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const res = await api.returnBook({
        loan_id: loan.id,
        fine_waived: waiveFine,
      });

      if (res.success) {
        onReturned(res.message);
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to process return.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Academic Book Return"
      subtitle={`Loan ID: ${loan.loan_code}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div>
            <span className="text-[11px] text-slate-400 block">Book Title</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{loan.book_title}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <div>
              <span className="text-slate-400 block text-[11px]">Student</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{loan.user_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Due Date</span>
              <span className={`font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                {dueDate.toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Overdue Penalty Notice */}
        {isOverdue && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Overdue Notice: {overdueDays} Days Past Due</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-rose-800/80 dark:text-rose-300/80">Computed Late Fee (₹2/day):</span>
              <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                ₹{calculatedFine.toFixed(2)}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-rose-200/60 dark:border-rose-900/60 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={waiveFine}
                onChange={(e) => setWaiveFine(e.target.checked)}
                className="rounded border-rose-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Waive late fee for this return (Discretionary)</span>
            </label>
          </div>
        )}

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
            disabled={loading}
            className="btn-gradient py-2.5 px-6 rounded-xl font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {loading ? 'Processing Return...' : 'Confirm Return & Restock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
