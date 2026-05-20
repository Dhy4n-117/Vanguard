'use client';

/**
 * ToastNotification — Cyberpunk-styled notification system for critical security events.
 * Displays ephemeral alerts with severity-based coloring and auto-dismiss.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)', icon: '🚨' },
  high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.4)', icon: '⚠️' },
  medium:   { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)',  border: 'rgba(234, 179, 8, 0.4)',  icon: '🔔' },
  low:      { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)',  border: 'rgba(34, 197, 94, 0.4)',  icon: 'ℹ️' },
  info:     { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)',  border: 'rgba(6, 182, 212, 0.4)',  icon: '💡' },
  success:  { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', icon: '✅' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, severity = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, severity, duration, createdAt: Date.now() }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container — fixed to top-right */}
      <div className="fixed top-20 right-6 z-[200] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '400px' }}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

function Toast({ toast, onDismiss }) {
  const config = SEVERITY_CONFIG[toast.severity] || SEVERITY_CONFIG.info;

  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      className="pointer-events-auto animate-fade-in-up backdrop-blur-xl rounded-xl px-4 py-3 flex items-start gap-3 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        backdropFilter: 'blur(20px)',
      }}
      onClick={onDismiss}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: config.color }}>
          {toast.severity}
        </p>
        <p className="text-xs font-mono leading-relaxed" style={{ color: '#e2e8f0' }}>
          {toast.message}
        </p>
      </div>
      <button className="text-xs opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: config.color }}>
        ✕
      </button>
    </div>
  );
}
