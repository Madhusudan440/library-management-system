import React, { useState, useEffect } from 'react';
import { BookmarkCheck, Clock, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentReservations = () => {
  const { success, error: toastError } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const res = await api.getMyReservations();
      if (res.success) {
        setReservations(res.reservations || []);
      }
    } catch (err) {
      toastError('Failed to retrieve your reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await api.cancelReservation(id);
      if (res.success) {
        success(res.message);
        loadReservations();
      } else {
        toastError(res.message);
      }
    } catch (err) {
      toastError(err.message || 'Cancellation failed.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your reserved book holds..." />;
  }

  const activeHolds = reservations.filter((r) => r.status === 'pending' || r.status === 'ready_for_pickup');
  const pastHolds = reservations.filter((r) => r.status === 'fulfilled' || r.status === 'cancelled');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          My Reserved Book Holds
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          When copies become available, your position advances automatically.
        </p>
      </div>

      {/* Active Holds */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Active Holds & Waitlists ({activeHolds.length})
        </h2>

        {activeHolds.length === 0 ? (
          <div className="glass-card p-10 text-center rounded-3xl">
            <BookmarkCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              You have no active book holds.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Browse the catalogue to reserve copies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeHolds.map((res) => {
              const isReady = res.status === 'ready_for_pickup';

              return (
                <div
                  key={res.id}
                  className={`glass-card p-5 rounded-3xl border transition-all ${
                    isReady
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                        {res.reservation_code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {res.book_title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Reserved on: {new Date(res.reserved_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={res.status}>{res.status.replace(/_/g, ' ')}</Badge>
                  </div>

                  <div className="mt-4 p-3 rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 text-xs">
                    {isReady ? (
                      <div className="text-amber-800 dark:text-amber-200 font-medium">
                        ✨ Book is at the front counter ready for pickup!
                        {res.expires_at && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            Collect before: {new Date(res.expires_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-600 dark:text-slate-300">
                        Queue Position: <strong className="text-indigo-600 dark:text-indigo-400">#{res.queue_position}</strong>. You will be notified in-app once a returned copy is processed.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      onClick={() => handleCancel(res.id)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Cancel Hold
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Holds History */}
      {pastHolds.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Past Reservation History
          </h2>
          <div className="glass-card rounded-3xl overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Reservation Code</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Reserved Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pastHolds.map((h) => (
                  <tr key={h.id}>
                    <td className="py-3 px-4 font-mono text-xs text-indigo-500 font-bold">{h.reservation_code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{h.book_title}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(h.reserved_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4"><Badge variant={h.status}>{h.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
