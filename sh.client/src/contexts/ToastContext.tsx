import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X, Info } from 'lucide-react';

type ToastItem = { id: number; message: string; variant: 'success' | 'error' | 'info' };

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: 'success' | 'error' | 'info') => {
      const id = ++idRef.current;
      setToasts((list) => [...list, { id, message, variant }]);
      timers.current.set(
        id,
        setTimeout(() => remove(id), TOAST_MS),
      );
    },
    [remove],
  );

  const success = useCallback((m: string) => push(m, 'success'), [push]);
  const error = useCallback((m: string) => push(m, 'error'), [push]);
  const info = useCallback((m: string) => push(m, 'info'), [push]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
      <div
        className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-[min(100vw-2rem,22rem)] pointer-events-none p-1"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
              t.variant === 'success'
                ? 'bg-white border-emerald-200 text-slate-800'
                : t.variant === 'info'
                  ? 'bg-white border-sky-200 text-slate-800'
                  : 'bg-white border-red-200 text-slate-800'
            }`}
          >
            {t.variant === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
            ) : t.variant === 'info' ? (
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" aria-hidden />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
            )}
            <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="text-slate-400 hover:text-slate-700 shrink-0 rounded-lg p-0.5"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast chỉ dùng bên trong ToastProvider');
  return ctx;
}
