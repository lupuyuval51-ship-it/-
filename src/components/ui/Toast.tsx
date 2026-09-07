"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { newId } from "@/lib/ids";

export type ToastTone = "success" | "error" | "info";

export interface ToastOptions {
  message: ReactNode;
  title?: ReactNode;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms (0 = sticky). Defaults: 4000, errors 6000. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  /** Reuse an id to replace an existing toast instead of stacking. */
  id?: string;
}

interface ToastItem extends Required<Pick<ToastOptions, "message" | "tone" | "duration">> {
  id: string;
  title?: ReactNode;
  action?: ToastOptions["action"];
}

export interface ToastApi {
  toast: (options: ToastOptions) => string;
  success: (message: ReactNode, options?: Omit<ToastOptions, "message" | "tone">) => string;
  error: (message: ReactNode, options?: Omit<ToastOptions, "message" | "tone">) => string;
  info: (message: ReactNode, options?: Omit<ToastOptions, "message" | "tone">) => string;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const MAX_VISIBLE = 3;

const toneClasses: Record<ToastTone, { box: string; icon: ReactNode }> = {
  success: { box: "border-success/40", icon: <CircleCheck className="text-success" aria-hidden /> },
  error: { box: "border-danger/40", icon: <CircleAlert className="text-danger" aria-hidden /> },
  info: { box: "border-info/40", icon: <Info className="text-info" aria-hidden /> },
};

/** Hosts toasts (bottom on phones above the nav bar, top-end on desktop). Mounted once in <Providers>. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id?: string) => {
    setItems((prev) => (id ? prev.filter((i) => i.id !== id) : []));
    if (id) {
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);
      timers.current.delete(id);
    } else {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    }
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? newId("toast");
      const tone = options.tone ?? "info";
      const duration = options.duration ?? (tone === "error" ? 6000 : 4000);
      const item: ToastItem = { id, message: options.message, title: options.title, tone, duration, action: options.action };
      setItems((prev) => [...prev.filter((i) => i.id !== id), item].slice(-MAX_VISIBLE));
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (message, o) => toast({ ...o, message, tone: "success" }),
      error: (message, o) => toast({ ...o, message, tone: "error" }),
      info: (message, o) => toast({ ...o, message, tone: "info" }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-auto md:end-4 md:top-4 md:items-end"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border bg-surface p-3 shadow-raised animate-fade-in [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0",
              toneClasses[item.tone].box,
            )}
          >
            {toneClasses[item.tone].icon}
            <div className="min-w-0 flex-1 text-sm">
              {item.title && <div className="font-semibold text-text">{item.title}</div>}
              <div className="text-text">{item.message}</div>
              {item.action && (
                <button
                  type="button"
                  className="mt-1.5 min-h-8 font-semibold text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    item.action?.onClick();
                    dismiss(item.id);
                  }}
                >
                  {item.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label={t("ui.dismiss")}
              className="-me-1 -mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-text"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const noop: ToastApi = {
  toast: () => "",
  success: () => "",
  error: () => "",
  info: () => "",
  dismiss: () => {},
};

/** `const { success, error } = useToast(); success("נשמר");` – no-op outside a ToastProvider. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop;
}
