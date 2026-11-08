import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../hooks.ts';
import { IconClose } from '../icons.tsx';

/**
 * Accessible modal: bottom sheet on phones, centered card on wide screens.
 * Focus is trapped while open and restored on close; Escape and the backdrop close it.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  variant = 'ink',
  labelHidden = false,
  closeLabel = 'Close',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: 'ink' | 'paper';
  /** Visually hide the title (still announced). */
  labelHidden?: boolean;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, open, onClose);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  const surface = variant === 'paper' ? 'paper' : 'bg-ink-900 border border-ink-700 text-ivory';
  return createPortal(
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`sheet ${surface}`} tabIndex={-1}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-3 pb-1">
          <span aria-hidden="true" className={`mx-auto h-1 w-10 rounded-full ${variant === 'paper' ? 'bg-paper-ink/25' : 'bg-ivory/20'} sm:hidden`} />
        </div>
        <div className="flex items-start justify-between gap-3 px-5">
          <h2 id={titleId} className={labelHidden ? 'sr-only' : 't-kicker pt-1'}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`icon-btn -mr-2 -mt-1 shrink-0 ${variant === 'paper' ? 'text-paper-ink/70 hover:bg-paper-ink/10 hover:text-paper-ink' : ''}`}
            aria-label={closeLabel}
          >
            <IconClose />
          </button>
        </div>
        <div className="px-5 pb-4">{children}</div>
      </div>
    </>,
    document.body,
  );
}
