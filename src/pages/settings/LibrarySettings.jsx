import React, { useState, useEffect } from 'react';
import { Sliders, Save, Check, AlertCircle, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const LibrarySettings = () => {
  const { success, error: toastError } = useToast();
  const [settings, setSettings] = useState({
    max_borrow_limit: 4,
    loan_duration_days: 14,
    max_renewal_count: 2,
    late_fee_per_day: 2.0,
    reservation_pickup_days: 3,
    enable_late_fees: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      toastError('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.updateSettings(settings);
      if (res.success) {
        success(res.message);
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving library policy configuration..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Library Circulation Policies & Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Define global borrowing quotas, default loan durations, late fee rates, and reservation windows.
        </p>
      </div>

      <form onSubmit={handleSave} className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Borrow Limit */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Max Simultaneous Borrow Limit
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Maximum physical copies a student can check out concurrently.
            </p>
            <input
              type="number"
              min="1"
              max="15"
              value={settings.max_borrow_limit}
              onChange={(e) => setSettings({ ...settings, max_borrow_limit: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none"
              required
            />
          </div>

          {/* Standard Loan Duration */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Standard Loan Period (Days)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Number of days before an issued book is flagged as overdue.
            </p>
            <input
              type="number"
              min="3"
              max="90"
              value={settings.loan_duration_days}
              onChange={(e) => setSettings({ ...settings, loan_duration_days: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none"
              required
            />
          </div>

          {/* Max Renewal Count */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Maximum Renewal Limit
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Number of times a student can extend their loan if no waitlist hold exists.
            </p>
            <input
              type="number"
              min="0"
              max="5"
              value={settings.max_renewal_count}
              onChange={(e) => setSettings({ ...settings, max_renewal_count: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none"
              required
            />
          </div>

          {/* Late Fee per day */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Daily Overdue Late Fee (₹ / Day)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Penalty accumulated per day after due date passage.
            </p>
            <input
              type="number"
              step="0.5"
              min="0"
              value={settings.late_fee_per_day}
              onChange={(e) => setSettings({ ...settings, late_fee_per_day: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none"
              required
            />
          </div>

          {/* Reservation Pickup Window */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Reservation Pickup Hold Window (Days)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Days held at counter before advancing to next student in queue.
            </p>
            <input
              type="number"
              min="1"
              max="14"
              value={settings.reservation_pickup_days}
              onChange={(e) => setSettings({ ...settings, reservation_pickup_days: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none"
              required
            />
          </div>

          {/* Toggle late fee penalty */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Enable Late Fee Penalties
              </span>
              <p className="text-[11px] text-slate-400">
                Automatically calculate and assess fines on overdue checkouts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.enable_late_fees}
              onChange={(e) => setSettings({ ...settings, enable_late_fees: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-gradient px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-xs sm:text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Updating Policies...' : 'Save Library Policies'}
          </button>
        </div>
      </form>
    </div>
  );
};
