"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@lib/utils";
import { Toast, ToastTone } from "@interfaces/components/Toast";

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Show a toast: `const { toast } = useToast(); toast("Saved", "success")`. */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-4 text-brand-green" />,
  error: <AlertCircle className="size-4 text-brand-red" />,
  info: <Info className="size-4 text-brand-accent" />,
};

let nextId = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback(
    (id: number) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    setToasts((t) => [...t, { id: nextId++, message, tone }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Bottom on phones (thumb + above nothing), top-right on desktop. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:items-end"
      >
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastRow = ({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) => {
  // Errors stay put — they usually need reading and acting on.
  useEffect(() => {
    if (toast.tone === "error") return;
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, toast.tone, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md",
        "animate-in fade-in slide-in-from-bottom-2 sm:slide-in-from-top-2",
        "border-glass-border bg-navy-700/95 text-foreground",
      )}
    >
      {ICONS[toast.tone]}
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};
