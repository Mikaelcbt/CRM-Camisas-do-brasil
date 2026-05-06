import React, { createContext, useContext, useState, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
  info: () => {},
});

let _nextId = 0;

const VARIANTS = {
  success: { bar: '#34d399', icon: '✓', iconBg: 'rgba(52,211,153,0.15)' },
  error:   { bar: '#f87171', icon: '✕', iconBg: 'rgba(248,113,113,0.15)' },
  info:    { bar: '#a78bfa', icon: 'i', iconBg: 'rgba(167,139,250,0.15)' },
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{
      success: (msg) => push('success', msg),
      error:   (msg) => push('error', msg),
      info:    (msg) => push('info', msg),
    }}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 'max(76px, calc(env(safe-area-inset-bottom, 0px) + 76px))',
          left: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
          maxWidth: 400,
          margin: '0 auto',
          pointerEvents: 'none',
        }}>
          {toasts.map(t => {
            const v = VARIANTS[t.type];
            return (
              <div key={t.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                background: '#1c1c1f',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${v.bar}`,
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                fontSize: '13px',
                color: '#e4e4e7',
                pointerEvents: 'auto',
                animation: 'toastSlideUp 0.25s ease',
              }}>
                <span style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: v.iconBg,
                  color: v.bar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {v.icon}
                </span>
                {t.message}
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
