"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info'; ttl?: number };

interface ToastContextValue {
  push: (t: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const ttl = t.ttl ?? 4000;
    setToasts((prev) => [...prev, { ...t, id, ttl }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, ttl);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[999] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              'pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-subtle backdrop-blur transition-colors ' +
              (t.type === 'success'
                ? 'border-success/40 bg-success/15 text-success'
                : t.type === 'error'
                  ? 'border-danger/40 bg-danger/15 text-danger'
                  : 'border-border/60 bg-surface/80 text-fg')
            }
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
