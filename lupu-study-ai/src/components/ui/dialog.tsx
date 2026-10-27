"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** "sheet" נפתח מלמטה בטלפון */
  side?: "center" | "sheet";
}

/**
 * דיאלוג מבוסס <dialog> מובנה: מלכודת פוקוס, ESC ו-aria-modal מגיעים מהדפדפן.
 */
export function Dialog({ open, onOpenChange, title, description, children, footer, className, side = "center" }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === ref.current) onOpenChange(false);
      }}
      className={cn(
        "m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-2xl border bg-card p-0 text-card-foreground shadow-soft open:animate-fade-up",
        side === "sheet" && "max-sm:mb-0 max-sm:max-w-none max-sm:rounded-b-none",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b p-5 pb-4">
            <div>
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="סגירה" onClick={() => onOpenChange(false)}>
              <X />
            </Button>
          </div>
          <div className="overflow-y-auto p-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t p-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "מחיקה", onConfirm, destructive = true,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">פעולה זו {destructive ? "אינה הפיכה" : "תבוצע מיד"}.</p>
    </Dialog>
  );
}
