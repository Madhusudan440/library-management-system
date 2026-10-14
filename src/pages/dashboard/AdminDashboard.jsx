import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Layers,
  Repeat,
  AlertTriangle,
  Users,
  Clock,
  PlusCircle,
  FileSpreadsheet,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [recentLoans, setRecentLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, catRes, shortRes, loansRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTrends(),
        api.getCategoryDistribution(),
        api.getShortageAlerts(),
        api.getLoans({ limit: 5 }),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (trendsRes.success) setTrends(trendsRes.trends);
      if (catRes.success) setCategories(catRes.distribution);
      if (shortRes.success) setShortages(shortRes.shortageAlerts);
      if (loansRes.success) setRecentLoans(loansRes.loans?.slice(0, 5) || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating Cloud Computing Library Metrics..." />;
  }

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#14B8A6'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/60 dark:border-indigo-900/40 rounded-3xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            Librarian Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Cloud Library Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time PostgreSQL inventory metrics, serverless circulation statistics, and reservation queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('admin-loans', { action: 'issue' })}
            className="btn-gradient px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-indigo-500/20"
          >
            <Repeat className="w-4 h-4" />
            Issue Book
          </button>
          <button
            onClick={() => onNavigate('admin-books', { action: 'add' })}
            className="btn-secondary px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-indigo-500" />
            Add New Book
          </button>
          <button
            onClick={() => onNavigate('admin-books', { action: 'import' })}
            className="btn-secondary px-3.5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2"
            title="Import Books via CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Import CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Book Titles"
          value={stats?.totalTitles || 0}
          subtitle={`${stats?.totalCopies || 0} Physical copies in catalogue`}
          icon={BookOpen}
          color="indigo"
          onClick={() => onNavigate('admin-books')}
        />
        <StatCard
          title="Available to Issue"
          value={stats?.availableCopies || 0}
          subtitle={`${stats?.issuedCopies || 0} Currently checked out`}
          icon={Layers}
          color="emerald"
          onClick={() => onNavigate('admin-books')}
        />
        <StatCard
          title="Active Loans"
          value={stats?.activeLoans || 0}
          subtitle={`${stats?.overdueLoans || 0} Requiring overdue attention`}
          icon={Repeat}
          color={stats?.overdueLoans > 0 ? 'rose' : 'sky'}
          trend={stats?.overdueLoans > 0 ? { value: `${stats.overdueLoans} Overdue`, positive: false, label: 'action required' } : null}
          onClick={() => onNavigate('admin-loans')}
        />
        <StatCard
          title="Registered Students"
          value={stats?.totalStudents || 0}
          subtitle={`${stats?.totalReservations || 0} Active book reservations`}
          icon={Users}
          color="purple"
          onClick={() => onNavigate('admin-students')}
        />
      </div>

      {/* Shortage Alerts Notification Banner (if any) */}
      {shortages.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl glass-card bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Inventory Shortage Alert ({shortages.length} books low on stock)
            </h4>
            <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
              The following titles have high reservation demand but minimal available physical copies:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {shortages.map(b => (
                <span
                  key={b.id}
                  onClick={() => onNavigate('admin-books')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {b.title} ({b.available} left / {b.waitlistCount} waiting)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Circulation Area Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Monthly Circulation Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dynamic monthly issued vs returned volumes from PostgreSQL transactions
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Last 6 Months
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="issued"
                  name="Books Issued"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorIssued)"
                />
                <Area
                  type="monotone"
                  dataKey="returned"
                  name="Books Returned"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorReturned)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Category Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Copies count per engineering domain
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categories.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                  width={90}
                  tickFormatter={(val) => val.length > 13 ? val.slice(0, 11) + '..' : val}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="totalCopies" name="Total Copies" radius={[0, 6, 6, 0]}>
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Loans Transactions Table */}
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Recent Issue & Circulation Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live audit trail of recently borrowed and returned academic literature
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin-loans')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            View all loans
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="pb-3 font-semibold">Loan Code</th>
                <th className="pb-3 font-semibold">Book Title</th>
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Due Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentLoans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No recent loan transactions found.
                  </td>
                </tr>
              ) : (
                recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {loan.loan_code}
                    </td>
                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {loan.book_title}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      <div>{loan.user_name}</div>
                      <div className="text-[11px] text-slate-400">{loan.student_id}</div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {new Date(loan.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Badge variant={loan.status}>{loan.status}</Badge>
                    </td>
                    <td className="py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                      {loan.fine_amount > 0 ? (
                        <span className="text-rose-500 font-semibold">₹{loan.fine_amount.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">₹0.00</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
