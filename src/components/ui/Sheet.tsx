"use client";
import { useCallback, useEffect, useId, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import { IconButton } from "./IconButton";

export type SheetSize = "sm" | "md" | "lg" | "full";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Sticky footer (usually the action buttons). */
  footer?: ReactNode;
  size?: SheetSize;
  /** Backdrop click / Escape / drag handle close the sheet (default true). Set false for blocking flows. */
  dismissible?: boolean;
  /** Element to focus when the sheet opens (defaults to the first focusable element). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Hide the header close button. */
  hideClose?: boolean;
  className?: string;
  /** Extra classes for the scrollable body. */
  bodyClassName?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const sizes: Record<SheetSize, string> = {
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-2xl",
  full: "md:max-w-4xl h-[100dvh] md:h-auto md:max-h-[90dvh]",
};

const noopSubscribe = () => () => {};

let lockCount = 0;
function lockScroll() {
  if (lockCount++ === 0) {
    document.body.dataset.dcScrollLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
}
function unlockScroll() {
  if (--lockCount <= 0) {
    lockCount = 0;
    document.body.style.overflow = document.body.dataset.dcScrollLock ?? "";
    delete document.body.dataset.dcScrollLock;
  }
}

/**
 * Bottom sheet on phones, centred dialog from `md` up. Portal + focus trap + Escape + scroll lock.
 * Content is not rendered while closed.
 */
export function Sheet({ open, onClose, title, description, children, footer, size = "md", dismissible = true, initialFocusRef, hideClose, className, bodyClassName }: SheetProps) {
  const { t } = useT();
  const id = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);
  // Portals need document.body: render nothing on the server / first client paint (no setState-in-effect).
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    lockScroll();
    const target = initialFocusRef?.current ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panelRef.current;
    const raf = requestAnimationFrame(() => target?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(raf);
      unlockScroll();
      const prev = previouslyFocused.current as HTMLElement | null;
      if (prev && typeof prev.focus === "function" && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, [open, initialFocusRef]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (dismissible) onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (nodes.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [dismissible, onClose],
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        aria-describedby={description ? `${id}-desc` : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex w-full max-h-[92dvh] flex-col rounded-t-xl bg-surface shadow-raised outline-none md:rounded-xl",
          "animate-[slide-up_220ms_cubic-bezier(0.2,0.8,0.2,1)_both] md:animate-[fade-in_180ms_ease-out_both]",
          sizes[size],
          className,
        )}
      >
        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("ui.sheet.dragHandle")}
            className="mx-auto mt-2 flex h-6 w-16 items-center justify-center rounded-full md:hidden"
          >
            <span className="block h-1.5 w-10 rounded-full bg-border-strong" aria-hidden />
          </button>
        )}
        {(title || !hideClose) && (
          <div className="flex items-start gap-3 px-5 pt-3 pb-2 md:pt-5">
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={`${id}-title`} className="text-lg font-bold leading-snug text-text">
                  {title}
                </h2>
              )}
              {description && (
                <p id={`${id}-desc`} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            {!hideClose && <IconButton label={t("ui.close")} icon={<X />} onClick={onClose} className="-me-2 -mt-1" />}
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5", !title && hideClose && "pt-5", bodyClassName)}>{children}</div>
        {footer && <div className="safe-bottom border-t border-border bg-surface px-5 py-3 md:rounded-b-xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
