import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    let msg = message;
    let t = type;
    let title = null;
    let d = duration;

    if (typeof message === 'object' && message !== null) {
      msg = message.message || message.description || '';
      t = message.type || 'info';
      title = message.title || null;
      if (message.duration) d = message.duration;
    }

    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message: String(msg), title, type: t }]);

    if (d > 0) {
      setTimeout(() => {
        removeToast(id);
      }, d);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        addToast,
        showToast: addToast,
        success: (m) => addToast(m, 'success'),
        error: (m) => addToast(m, 'error'),
        info: (m) => addToast(m, 'info'),
        warning: (m) => addToast(m, 'warning'),
      }}
    >
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-300 dark:border-emerald-800/80',
    error: 'border-rose-300 dark:border-rose-800/80',
    warning: 'border-amber-300 dark:border-amber-800/80',
    info: 'border-indigo-300 dark:border-indigo-800/80',
  };

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl glass-card bg-white/95 dark:bg-[#111827]/95 shadow-xl border ${borders[toast.type] || borders.info} animate-slide-up`}
    >
      <div className="flex items-center gap-3">
        {icons[toast.type] || icons.info}
        <div>
          {toast.title && (
            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-0.5">
              {toast.title}
            </p>
          )}
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {toast.message}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => useContext(ToastContext);
