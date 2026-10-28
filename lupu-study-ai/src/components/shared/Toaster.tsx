"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { toastBus, type ToastMsg } from "@/lib/bus";
import { cn } from "@/lib/utils";

export function Toaster() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    return toastBus.on((t) => {
      setItems((cur) => [...cur.slice(-3), t]);
      setTimeout(() => setItems((cur) => cur.filter((x) => x.id !== t.id)), t.kind === "error" ? 7000 : t.action ? 8000 : 4000);
    });
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-md animate-fade-up items-start gap-3 rounded-xl border bg-card p-3.5 shadow-soft",
            t.kind === "error" && "border-destructive/50",
            t.kind === "success" && "border-success/50",
          )}
        >
          {t.kind === "success" && <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />}
          {t.kind === "error" && <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />}
          {t.kind === "info" && <Info className="mt-0.5 size-5 shrink-0 text-primary" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{t.title}</p>
            {t.detail && <p className="mt-0.5 text-sm text-muted-foreground">{t.detail}</p>}
          </div>
          {t.action && (
            <button type="button" className="shrink-0 rounded-md bg-primary/10 px-3 py-1 text-sm font-bold text-primary hover:bg-primary/20" onClick={() => { t.action!.onClick(); setItems((c) => c.filter((x) => x.id !== t.id)); }}>
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="סגירה" className="text-muted-foreground hover:text-foreground" onClick={() => setItems((c) => c.filter((x) => x.id !== t.id))}>
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
