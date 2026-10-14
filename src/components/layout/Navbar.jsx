import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Menu,
  BookOpen,
  Check,
  User,
  Shield,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export const Navbar = ({ onToggleSidebar, activeTab, setActiveTab }) => {
  const { user, isAdmin, isStudent, switchRole, openAuthModal, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleRoleChange = async (target) => {
    await switchRole(target);
    setActiveTab(target === 'admin' ? 'admin-dashboard' : 'student-dashboard');
  };

  return (
    <header className="sticky top-0 z-30 w-full glass-card bg-white/70 dark:bg-[#0B0F19]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab(isAdmin ? 'admin-dashboard' : 'student-dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                CloudLib <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">Pro</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-medium text-slate-400 -mt-1 block">
                Cloud Computing Mini Project
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active Authenticated Portal Badge */}
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
            {isAdmin ? (
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Shield className="w-3.5 h-3.5" />
                Librarian & Admin Portal
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                <GraduationCap className="w-3.5 h-3.5" />
                Student Library Portal
              </span>
            )}
          </div>
        )}

        {/* Right Controls: Notifications, Theme Toggle, Profile */}
        <div className="flex items-center gap-2">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse-subtle">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div
                className="absolute right-0 mt-3 w-80 sm:w-96 glass-card bg-white dark:bg-[#111827] shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 z-50 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) {
                            if (n.link.includes('loan')) setActiveTab(isAdmin ? 'admin-loans' : 'student-loans');
                            if (n.link.includes('reservation')) setActiveTab(isAdmin ? 'admin-reservations' : 'student-reservations');
                            setShowNotifMenu(false);
                          }
                        }}
                        className={`p-3 rounded-xl cursor-pointer text-left transition-colors border ${
                          n.is_read
                            ? 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {/* User Profile Pill or Sign In Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                  alt={user?.full_name}
                  className="w-7 h-7 rounded-lg object-cover ring-2 ring-indigo-500/20"
                />
                <div className="hidden sm:block text-left">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[110px]">
                    {user?.full_name?.split(' ')[0]}
                  </span>
                  <span className="block text-[10px] font-medium text-slate-400 capitalize">
                    {user?.role}
                  </span>
                </div>
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-3 w-60 glass-card bg-white dark:bg-[#111827] shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl p-2 z-50 animate-slide-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">{user?.student_id || 'ID: ' + user?.role?.toUpperCase()}</p>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('user-profile');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Manage Profile & Security
                    </button>

                    <button
                      onClick={() => {
                        openAuthModal('student');
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Switch Account (OTP / Admin)
                    </button>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          logout();
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('student')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-sm shadow-indigo-500/25 transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student / Admin Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
