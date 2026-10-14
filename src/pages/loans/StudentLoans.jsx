import React, { useState, useEffect } from 'react';
import { Repeat, Clock, AlertTriangle, RotateCw, CheckCircle2, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentLoans = () => {
  const { success, error: toastError } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    loadMyLoans();
  }, []);

  const loadMyLoans = async () => {
    try {
      setLoading(true);
      const res = await api.getMyLoans();
      if (res.success) {
        setLoans(res.loans || []);
      }
    } catch (err) {
      toastError('Failed to retrieve your loans.');
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (loanId) => {
    try {
      setRenewingId(loanId);
      const res = await api.renewLoan({ loan_id: loanId });
      if (res.success) {
        success(res.message);
        loadMyLoans();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Renewal failed.');
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving your borrowing history..." />;
  }

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const pastLoans = loans.filter((l) => l.status === 'returned');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          My Borrowed Books & Renewals
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Monitor your active book checkouts, renewal eligibility, and return receipts.
        </p>
      </div>

      {/* Active Borrowed Books */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Active Loans ({activeLoans.length})
        </h2>

        {activeLoans.length === 0 ? (
          <div className="glass-card p-10 text-center rounded-3xl">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No active borrowed books.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Visit the catalogue to borrow or reserve books.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map((loan) => {
              const dueDate = new Date(loan.due_date);
              const isOverdue = loan.status === 'overdue' || new Date() > dueDate;
              const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={loan.id}
                  className={`glass-card p-5 rounded-3xl border transition-all ${
                    isOverdue
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 block font-bold">
                        {loan.loan_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {loan.book_title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Issued on: {new Date(loan.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={loan.status}>{loan.status}</Badge>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Due Date:</span>
                      <span
                        className={`text-sm font-bold ${
                          isOverdue ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {dueDate.toLocaleDateString()}{' '}
                        {isOverdue ? `(${Math.abs(daysLeft)}d overdue)` : `(${daysLeft}d remaining)`}
                      </span>
                      {loan.fine_amount > 0 && (
                        <span className="text-xs text-rose-500 font-bold block mt-0.5">
                          Incurred fine: ₹{loan.fine_amount.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleRenew(loan.id)}
                      disabled={renewingId === loan.id || loan.renewal_count >= 2}
                      className="btn-gradient px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <RotateCw
                        className={`w-3.5 h-3.5 ${renewingId === loan.id ? 'animate-spin' : ''}`}
                      />
                      {loan.renewal_count >= 2 ? 'Max Renewed' : `Renew Loan (${loan.renewal_count}/2)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Borrowing History Table */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Returned Loan History ({pastLoans.length})
        </h2>

        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Loan ID</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Returned Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fine Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pastLoans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No returned loan records yet.
                    </td>
                  </tr>
                ) : (
                  pastLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-xs text-indigo-500 font-bold">
                        {loan.loan_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {loan.book_title}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(loan.issue_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {loan.return_date ? new Date(loan.return_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="returned">Returned</Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300 font-medium">
                        ₹{loan.fine_amount ? loan.fine_amount.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
