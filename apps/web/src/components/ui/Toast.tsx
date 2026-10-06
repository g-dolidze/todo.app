import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../Icon';

type Tone = 'success' | 'error';
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

/** Short confirmation messages, announced to screen readers (aria-live). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = ++nextId.current;
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 nav:bottom-8"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-md animate-[toast-in_0.2s_ease-out] items-center gap-3 rounded-[14px] bg-fg px-4 py-3 text-sm font-semibold text-bg shadow-card"
          >
            <span
              className={toast.tone === 'error' ? 'text-danger-on-dark' : 'text-primary-on-dark'}
            >
              <Icon name={toast.tone === 'error' ? 'alert' : 'today'} size={20} />
            </span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
