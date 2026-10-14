import React from 'react';
import {
  LayoutDashboard,
  BookMarked,
  Repeat,
  Users,
  Clock,
  BarChart3,
  Sliders,
  FileText,
  BookmarkCheck,
  UserCheck,
  Cloud,
  Database,
  Server,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { isAdmin, isStudent, user } = useAuth();

  const adminNav = [
    { id: 'admin-dashboard', label: 'Library Dashboard', icon: LayoutDashboard },
    { id: 'admin-books', label: 'Book Inventory', icon: BookMarked },
    { id: 'admin-loans', label: 'Issue & Returns', icon: Repeat },
    { id: 'admin-students', label: 'Student Directory', icon: Users },
    { id: 'admin-reservations', label: 'Reservations Queue', icon: Clock },
    { id: 'admin-analytics', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'admin-settings', label: 'Library Policies', icon: Sliders },
    { id: 'admin-audit', label: 'Audit Trail', icon: FileText },
  ];

  const studentNav = [
    { id: 'student-dashboard', label: 'My Overview', icon: LayoutDashboard },
    { id: 'student-catalog', label: 'Book Catalogue', icon: BookMarked },
    { id: 'student-loans', label: 'My Loans & Due Dates', icon: Repeat },
    { id: 'student-reservations', label: 'My Reservations', icon: BookmarkCheck },
    { id: 'user-profile', label: 'Profile & Security', icon: UserCheck },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-card bg-white/90 dark:bg-[#0E131F]/90 backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between pb-4 mb-2 lg:hidden border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Navigation</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Status Tag */}
          <div className="px-3 py-2 mb-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {isAdmin ? 'Librarian Portal' : 'Student Portal'}
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              v1.0
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500'
                    }`}
                  />
                  <span>{item.label}</span>

                  {isActive && (
                    <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-white shadow-glow" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cloud Architecture Highlights (B.Tech Cloud Computing Focus) */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-violet-500/5 to-transparent border border-indigo-200/50 dark:border-indigo-900/30">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud Infrastructure</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Supabase PostgreSQL DB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="w-3 h-3 text-slate-400" />
                <span>Vercel Serverless Express API</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
