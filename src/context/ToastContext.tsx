import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { classNames } from '../lib/format';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

const config: Record<ToastType, { icon: typeof Info; ring: string; bar: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'border-green-200', bar: 'bg-green-600', iconColor: 'text-green-600' },
  error: { icon: AlertTriangle, ring: 'border-red-200', bar: 'bg-red-600', iconColor: 'text-red-600' },
  info: { icon: Info, ring: 'border-slate-200', bar: 'bg-slate-500', iconColor: 'text-slate-500' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const value: ToastContextValue = {
    showToast,
    success: (m) => showToast(m, 'success'),
    error: (m) => showToast(m, 'error'),
    info: (m) => showToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => {
          const c = config[t.type];
          const Icon = c.icon;
          return (
            <div
              key={t.id}
              className={classNames(
                'pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-lg border bg-white p-3.5 pr-9 shadow-card-hover animate-slide-up',
                c.ring,
              )}
              role="alert"
            >
              <span className={classNames('absolute left-0 top-0 h-full w-1', c.bar)} />
              <Icon className={classNames('mt-0.5 h-5 w-5 shrink-0', c.iconColor)} />
              <p className="text-sm leading-snug text-slate-700">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Tutup notifikasi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}
