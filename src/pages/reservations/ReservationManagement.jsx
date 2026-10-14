import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Search, AlertCircle, BookmarkCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ReservationManagement = () => {
  const { success, error: toastError } = useToast();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const res = await api.getReservations();
      if (res.success) {
        setReservations(res.reservations || []);
      }
    } catch (err) {
      toastError('Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (id) => {
    try {
      const res = await api.fulfillReservation(id);
      if (res.success) {
        success('Reservation marked fulfilled.');
        loadReservations();
      }
    } catch (err) {
      toastError(err.message || 'Action failed.');
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await api.cancelReservation(id);
      if (res.success) {
        success('Reservation cancelled.');
        loadReservations();
      }
    } catch (err) {
      toastError(err.message || 'Action failed.');
    }
  };

  const filtered = statusFilter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Book Reservation Queue & Holds
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          FIFO waitlist queue, pickup fulfillment, and automatic reservation expiry.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Reservations' },
          { id: 'pending', label: 'Waitlist Queue' },
          { id: 'ready_for_pickup', label: 'Ready for Counter Pickup' },
          { id: 'fulfilled', label: 'Fulfilled' },
          { id: 'cancelled', label: 'Cancelled' },
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

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving reservation queues..." />
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-3xl">
          <BookmarkCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No reservations in this queue
          </h3>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Queue Pos.</th>
                  <th className="py-3 px-4">Reserved At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                      {item.reservation_code}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {item.book_title}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{item.user_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.student_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        #{item.queue_position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(item.reserved_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.status}>{item.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'ready_for_pickup' && (
                        <button
                          onClick={() => handleFulfill(item.id)}
                          className="btn-gradient px-3 py-1 rounded-lg text-xs font-semibold mr-2"
                        >
                          Fulfill & Handover
                        </button>
                      )}
                      {(item.status === 'pending' || item.status === 'ready_for_pickup') && (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
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
