import React, { useState } from 'react';
import { User, Lock, Save, Check, Shield, KeyRound, Building, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { api } from '../../services/api';
import { Badge } from '../../components/common/Badge';

export const UserProfile = () => {
  const { user, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.updateProfile(profileData);
      if (res.success) {
        success('Profile updated successfully.');
        refreshProfile();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toastError('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toastError('Password must be at least 6 characters.');
      return;
    }

    try {
      setChangingPassword(true);
      const res = await api.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      if (res.success) {
        success('Password changed successfully.');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Profile & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, academic credentials, and security password.
        </p>
      </div>

      {/* User Header Summary Card */}
      <div className="glass-card p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
          alt={user?.full_name}
          className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-md"
        />

        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.full_name}</h2>
            <Badge variant={user?.role}>{user?.role?.toUpperCase()}</Badge>
          </div>
          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5" />
            {user?.email}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            ID: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{user?.student_id || 'ID: ' + user?.role?.toUpperCase()}</span> • {user?.department}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <form onSubmit={handleProfileUpdate} className="glass-card p-6 rounded-3xl space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Personal Information</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={profileData.department}
              onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-gradient w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Updating...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordChange} className="glass-card p-6 rounded-3xl space-y-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Update Password</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changingPassword}
              className="btn-secondary w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-indigo-500" />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
