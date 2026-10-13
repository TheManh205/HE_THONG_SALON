import React, { createContext, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast floating container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          let borderClass = 'border-emerald-500/40';
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />;

          if (toast.type === 'error') {
            borderClass = 'border-rose-500/40';
            icon = <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />;
          } else if (toast.type === 'info' || toast.type === 'warning') {
            borderClass = 'border-amber-500/40';
            icon = <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={toast.id}
              className={`toast-item pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 transform translate-y-0 bg-white dark:bg-slate-900 text-slate-900 dark:text-white ${borderClass}`}
              style={{
                boxShadow: '0 12px 30px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.2)',
              }}
            >
              {icon}
              <div className="toast-text flex-1 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white">
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Đóng thông báo"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
