import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  AlertTriangle,
  Award,
  Users,
  Layers,
  BookOpen,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const AnalyticsReports = () => {
  const { success } = useToast();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [activeBorrowers, setActiveBorrowers] = useState([]);
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes, catRes, borrowRes, userRes, shortRes] = await Promise.all([
        api.getDashboardStats(),
        api.getTrends(),
        api.getCategoryDistribution(),
        api.getMostBorrowed(),
        api.getActiveBorrowers(),
        api.getShortageAlerts(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (trendsRes.success) setTrends(trendsRes.trends || []);
      if (catRes.success) setCategories(catRes.distribution || []);
      if (borrowRes.success) setMostBorrowed(borrowRes.mostBorrowed || []);
      if (userRes.success) setActiveBorrowers(userRes.activeBorrowers || []);
      if (shortRes.success) setShortages(shortRes.shortageAlerts || []);
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Total Titles', stats?.totalTitles || 0],
      ['Total Copies', stats?.totalCopies || 0],
      ['Available Copies', stats?.availableCopies || 0],
      ['Issued Copies', stats?.issuedCopies || 0],
      ['Active Loans', stats?.activeLoans || 0],
      ['Overdue Loans', stats?.overdueLoans || 0],
      ['Registered Students', stats?.totalStudents || 0],
      ['Active Reservations', stats?.totalReservations || 0],
    ];

    const csvContent = reportData.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_analytics_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    success('Analytics summary CSV report downloaded.');
  };

  if (loading) {
    return <LoadingSpinner text="Crunching PostgreSQL circulation analytics..." />;
  }

  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#14B8A6'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Library Analytics & Academic Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Data-driven insights into circulation trends, domain distribution, and inventory utilization.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="btn-gradient px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Report to CSV
        </button>
      </div>

      {/* Circulation Area Chart & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circulation Trends */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Circulation Volume Trends
              </h3>
              <p className="text-xs text-slate-400">Monthly books issued vs returned</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="issued" name="Issued" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="returned" name="Returned" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Copies Distribution */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Subject Domain Inventory
              </h3>
              <p className="text-xs text-slate-400">Total physical copies across CSE categories</p>
            </div>
            <Layers className="w-5 h-5 text-violet-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="slug" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="totalCopies" name="Copies" radius={[6, 6, 0, 0]}>
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Borrowed Titles & Most Active Student Borrowers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Books */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Most Borrowed Academic Books
            </h3>
          </div>

          <div className="space-y-3">
            {mostBorrowed.map((b, idx) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1">{b.title}</h4>
                    <p className="text-[11px] text-slate-400">{b.author} • {b.category}</p>
                  </div>
                </div>
                <Badge variant="indigo">{b.issued_count} checkouts</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Borrowers */}
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <Users className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Top Active Student Borrowers
            </h3>
          </div>

          <div className="space-y-3">
            {activeBorrowers.map((s, idx) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-extrabold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{s.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{s.student_id} • {s.department}</p>
                  </div>
                </div>
                <Badge variant="emerald">{s.totalBorrowed} Books Read</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
