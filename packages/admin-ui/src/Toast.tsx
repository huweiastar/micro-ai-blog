"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}
interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Fallback：没有 Provider 时通过 console 输出，避免抛错中断组件渲染。 */
const FALLBACK: ToastContextValue = {
  show: (message, type = "info") => {
    const log = type === "error" ? console.error : type === "success" ? console.log : console.info;
    log(`[toast][${type}] ${message}`);
  },
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? FALLBACK;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = icons[item.type];
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const tone =
    item.type === "success"
      ? "text-[var(--success)]"
      : item.type === "error"
        ? "text-[var(--danger)]"
        : "text-[var(--info)]";
  return (
    <div className="glass flex items-center gap-2 rounded-lg px-4 py-3 shadow-[var(--shadow-lg)] animate-slide-up">
      <Icon className={`h-4 w-4 shrink-0 ${tone}`} />
      <span className="text-sm text-[var(--foreground)]">{item.message}</span>
      <button onClick={onClose} aria-label="关闭" className="ml-2 text-[var(--muted)]">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
