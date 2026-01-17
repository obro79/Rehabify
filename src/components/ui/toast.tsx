"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastVariant = "default" | "success" | "warning" | "error";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timeoutsRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutsRef.current.delete(id);
      }, duration);
      timeoutsRef.current.set(id, timeoutId);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  React.useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      // Cleanup all timeouts on unmount
      timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      timeouts.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

const VARIANT_CONFIG = {
  default: {
    icon: Info,
    container: "bg-white border-sage-200",
    iconColor: "text-sage-500",
  },
  success: {
    icon: CheckCircle,
    container: "bg-white border-sage-300",
    iconColor: "text-sage-600",
  },
  warning: {
    icon: AlertTriangle,
    container: "bg-white border-amber-300",
    iconColor: "text-amber-500",
  },
  error: {
    icon: AlertCircle,
    container: "bg-white border-red-300",
    iconColor: "text-red-500",
  },
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const config = VARIANT_CONFIG[toast.variant ?? "default"];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 shadow-lg",
        "animate-in slide-in-from-right fade-in-0",
        config.container
      )}
    >
      <Icon size={20} className={cn("shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-foreground">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm text-muted-foreground mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-sage-100 transition-colors"
      >
        <X size={16} />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}

function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export { Toaster };
