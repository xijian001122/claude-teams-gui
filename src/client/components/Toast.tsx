import { useState, useEffect, useCallback } from 'preact/hooks';
import { Icon } from './Icon';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastItemProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    // Auto close
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(toast.id), 300); // Wait for exit animation
    }, toast.duration ?? 3000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons: Record<ToastType, string> = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  const colors: Record<ToastType, string> = {
    success: 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${colors[toast.type]} min-w-[280px] max-w-md transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Icon icon={icons[toast.type]} size={20} />
      <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
        {toast.message}
      </span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <Icon icon="x" size={16} className="text-[var(--text-secondary)]" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, type, message, duration }]);
    return id;
  }, []);

  const closeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return showToast('success', message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast('error', message, duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast('warning', message, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast('info', message, duration);
  }, [showToast]);

  return {
    toasts,
    closeToast,
    success,
    error,
    warning,
    info
  };
}
