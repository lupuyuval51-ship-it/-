"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { Sheet } from "./Sheet";
import { Button } from "./Button";

export interface ConfirmOptions {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = destructive action (red confirm button). */
  tone?: "primary" | "danger" | "accent";
  icon?: ReactNode;
}

export interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Shows a spinner on the confirm button while an async action runs. */
  loading?: boolean;
}

/** Controlled yes/no dialog built on Sheet. Prefer `useConfirm()` for one-off confirmations. */
export function ConfirmDialog({ open, onConfirm, onCancel, title, description, confirmLabel, cancelLabel, tone = "primary", icon, loading }: ConfirmDialogProps) {
  const { t } = useT();
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Sheet open={open} onClose={onCancel} size="sm" hideClose title={undefined} initialFocusRef={cancelRef} dismissible={!loading}>
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        {icon && <div className={cn("flex size-14 items-center justify-center rounded-full [&_svg]:size-7", tone === "danger" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary")}>{icon}</div>}
        <h2 className="text-lg font-bold text-text">{title}</h2>
        {description && <p className="text-base text-muted">{description}</p>}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button ref={cancelRef} variant="secondary" size="lg" onClick={onCancel} disabled={loading}>
          {cancelLabel ?? t("ui.dialog.cancel")}
        </Button>
        <Button variant={tone} size="lg" onClick={onConfirm} loading={loading}>
          {confirmLabel ?? t("ui.dialog.confirm")}
        </Button>
      </div>
    </Sheet>
  );
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const DialogContext = createContext<ConfirmFn | null>(null);

/** Hosts the promise-based confirm dialog. Mounted once in <Providers>. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);
  const confirm = useCallback<ConfirmFn>((options) => new Promise<boolean>((resolve) => {
    setState((prev) => {
      prev?.resolve(false);
      return { options, resolve };
    });
  }), []);
  const settle = (value: boolean) => {
    setState((prev) => {
      prev?.resolve(value);
      return null;
    });
  };
  const value = useMemo(() => confirm, [confirm]);
  return (
    <DialogContext.Provider value={value}>
      {children}
      <ConfirmDialog open={state !== null} onConfirm={() => settle(true)} onCancel={() => settle(false)} {...(state?.options ?? { title: "" })} />
    </DialogContext.Provider>
  );
}

/**
 * `const confirm = useConfirm(); if (await confirm({ title: "למחוק?", tone: "danger" })) …`
 * Outside a DialogProvider it falls back to window.confirm so nothing breaks in isolation.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(DialogContext);
  return useMemo<ConfirmFn>(
    () => ctx ?? (async (o) => (typeof window !== "undefined" ? window.confirm(typeof o.title === "string" ? o.title : "?") : false)),
    [ctx],
  );
}
