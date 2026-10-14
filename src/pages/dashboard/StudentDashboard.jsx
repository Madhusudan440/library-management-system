import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Repeat,
  BookmarkCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCw,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [stats, setStats] = useState(null);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const [statsRes, loansRes, resRes, popRes] = await Promise.all([
        api.getDashboardStats(),
        api.getMyLoans(),
        api.getMyReservations(),
        api.getPopularBooks(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (loansRes.success) setLoans(loansRes.loans || []);
      if (resRes.success) setReservations(resRes.reservations || []);
      if (popRes.success) setPopularBooks(popRes.books || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
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
        loadStudentData();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Renewal failed.');
    } finally {
      setRenewingId(null);
    }
  };

  const handleQuickReserve = async (bookId) => {
    try {
      const res = await api.createReservation(bookId);
      if (res.success) {
        success(res.message);
        loadStudentData();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Reservation failed.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving your student records..." />;
  }

  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'overdue');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Student Welcome Header */}
      <div className="p-6 sm:p-8 glass-card bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-transparent border border-indigo-200/60 dark:border-indigo-900/40 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Student Academic Library Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Roll No: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user?.student_id || 'BT21CSE042'}</span> • {user?.department || 'Computer Science & Engineering'}
          </p>
        </div>

        <button
          onClick={() => onNavigate('student-catalog')}
          className="btn-gradient px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-indigo-500/20"
        >
          <Search className="w-4 h-4" />
          Browse Catalogue & Search
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Loans"
          value={stats?.activeLoansCount || 0}
          subtitle={`Limit: ${stats?.borrowingLimit || 4} simultaneous books`}
          icon={Repeat}
          color="indigo"
          onClick={() => onNavigate('student-loans')}
        />
        <StatCard
          title="Available Quota"
          value={`${stats?.availableSlots || 0} Books`}
          subtitle="Slots left to borrow"
          icon={BookOpen}
          color="emerald"
        />
        <StatCard
          title="Overdue Notices"
          value={stats?.overdueLoansCount || 0}
          subtitle={stats?.overdueLoansCount > 0 ? `Late fine: ₹${stats?.totalFineIncurred?.toFixed(2)}` : 'Clean account standing'}
          icon={AlertCircle}
          color={stats?.overdueLoansCount > 0 ? 'rose' : 'sky'}
          onClick={() => onNavigate('student-loans')}
        />
        <StatCard
          title="Active Holds"
          value={stats?.activeReservationsCount || 0}
          subtitle="Queued books waiting for pickup"
          icon={BookmarkCheck}
          color="purple"
          onClick={() => onNavigate('student-reservations')}
        />
      </div>

      {/* Active Borrowed Books Card */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Currently Borrowed Books ({activeLoans.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Keep track of due dates to avoid late fee penalties. Eligible books can be renewed once.
            </p>
          </div>
          <button
            onClick={() => onNavigate('student-loans')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            Loan History
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium">You have no active loans right now.</p>
            <button
              onClick={() => onNavigate('student-catalog')}
              className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Explore book catalogue →
            </button>
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
                  className={`p-4 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] text-slate-400 block">{loan.loan_code}</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                        {loan.book_title}
                      </h4>
                    </div>
                    <Badge variant={loan.status}>{loan.status}</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Due Date:</span>
                      <span className={`font-semibold ${isOverdue ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {dueDate.toLocaleDateString()} {isOverdue ? `(${Math.abs(daysLeft)}d overdue)` : `(${daysLeft}d left)`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRenew(loan.id)}
                      disabled={renewingId === loan.id || loan.renewal_count >= 2}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold btn-gradient flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${renewingId === loan.id ? 'animate-spin' : ''}`} />
                      {loan.renewal_count >= 2 ? 'Max Renewed' : `Renew (${loan.renewal_count}/2)`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommended & Popular Academic Books Grid */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Popular Cloud & CSE Recommended Books
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Frequently checked out by your computer science peers
            </p>
          </div>
          <button
            onClick={() => onNavigate('student-catalog')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all books
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularBooks.slice(0, 4).map((book) => (
            <div
              key={book.id}
              className="glass-card bg-slate-50/50 dark:bg-slate-900/40 p-4 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all border border-slate-200/80 dark:border-slate-800/80 group"
            >
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-3 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={book.available_copies > 0 ? 'available' : 'out_of_stock'}>
                      {book.available_copies > 0 ? `${book.available_copies} Available` : 'Waitlist'}
                    </Badge>
                  </div>
                </div>

                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  {book.category_name}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                  {book.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {book.author}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{book.shelf_location}</span>
                <button
                  onClick={() => handleQuickReserve(book.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold btn-gradient"
                >
                  {book.available_copies > 0 ? 'Reserve Copy' : 'Join Waitlist'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
