import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Search,
  Plus,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { IssueBookModal } from './IssueBookModal';
import { ReturnBookModal } from './ReturnBookModal';

export const LoanManagement = ({ initialAction }) => {
  const { success, error: toastError } = useToast();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modals
  const [isIssueOpen, setIsIssueOpen] = useState(initialAction === 'issue');
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    loadLoans();
  }, [statusFilter, search]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const res = await api.getLoans({ status: statusFilter, search });
      if (res.success) {
        setLoans(res.loans || []);
      }
    } catch (err) {
      toastError('Failed to fetch loans.');
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
        loadLoans();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Renewal failed.');
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Book Circulation & Loan Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Issue books, process returns, compute late fees, and track active student loans.
          </p>
        </div>

        <button
          onClick={() => setIsIssueOpen(true)}
          className="btn-gradient px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Issue New Book
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'active', label: 'Active Loans' },
            { id: 'overdue', label: 'Overdue Warnings' },
            { id: 'returned', label: 'Returned Records' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, book, loan ID..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Loans Table */}
      {loading ? (
        <LoadingSpinner text="Loading circulation records..." />
      ) : loans.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <Repeat className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No loans match your criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try switching filter tabs or checking student name spelling.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Loan Code</th>
                  <th className="py-3.5 px-4">Book Title</th>
                  <th className="py-3.5 px-4">Borrower (Student)</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Late Fee</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loans.map((loan) => {
                  const isOverdue = loan.status === 'overdue';
                  return (
                    <tr
                      key={loan.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors ${
                        isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                        {loan.loan_code}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-100">
                        {loan.book_title}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{loan.user_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{loan.student_id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(loan.issue_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${isOverdue ? 'text-rose-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {new Date(loan.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={loan.status}>{loan.status}</Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {loan.fine_amount > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            ₹{loan.fine_amount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {loan.status !== 'returned' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRenew(loan.id)}
                              disabled={renewingId === loan.id || loan.renewal_count >= 2}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
                              title="Renew Loan (+14 days)"
                            >
                              <RotateCw className={`w-3 h-3 ${renewingId === loan.id ? 'animate-spin' : ''}`} />
                              Renew ({loan.renewal_count}/2)
                            </button>
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setIsReturnOpen(true);
                              }}
                              className="btn-gradient px-3 py-1 rounded-lg text-xs font-semibold"
                            >
                              Return
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <IssueBookModal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        onIssued={(msg) => {
          success(msg);
          loadLoans();
        }}
      />

      <ReturnBookModal
        loan={selectedLoan}
        isOpen={isReturnOpen}
        onClose={() => {
          setIsReturnOpen(false);
          setSelectedLoan(null);
        }}
        onReturned={(msg) => {
          success(msg);
          loadLoans();
        }}
      />
    </div>
  );
};
