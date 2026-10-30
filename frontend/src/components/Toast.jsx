import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

export function ToastProvider({ children }) {
  const { trData } = useLanguage();
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, message, duration = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const success = useCallback((message, duration) => showToast('success', message, duration), [showToast]);
  const error = useCallback((message, duration) => showToast('error', message, duration), [showToast]);
  const info = useCallback((message, duration) => showToast('info', message, duration), [showToast]);
  const warning = useCallback((message, duration) => showToast('warning', message, duration), [showToast]);

  const value = useMemo(() => ({ showToast, success, error, info, warning }), [showToast, success, error, info, warning]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Notification Container */}
      <div
        role="region"
        aria-label="การแจ้งเตือน"
        className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2.5 max-w-sm sm:max-w-md pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
              t.type === 'success'
                ? 'border-emerald-400/30 bg-[#0e1a14]/95 text-emerald-100 shadow-emerald-950/40'
                : t.type === 'error'
                ? 'border-rose-400/30 bg-[#1f0e13]/95 text-rose-100 shadow-rose-950/40'
                : t.type === 'warning'
                ? 'border-amber-400/30 bg-[#1e170a]/95 text-amber-100 shadow-amber-950/40'
                : 'border-cyan-400/30 bg-[#0b141d]/95 text-cyan-100 shadow-cyan-950/40'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
            </div>

            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {trData(t.message)}
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 rounded-lg p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="ปิดการแจ้งเตือน"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
