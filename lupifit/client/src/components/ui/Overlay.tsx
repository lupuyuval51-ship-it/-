import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { Button, IconButton } from './Button';
import { Icon, type IconName } from './Icon';

/** Accessible modal built on <dialog> (focus trapping, Esc to close, backdrop click). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose(): void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } else if (!open && d.open) {
      if (typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
    }
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal modal-${size}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="modal-content">
          <header className="modal-header">
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
            <IconButton icon="close" label={t('common.actions.close')} onClick={onClose} />
          </header>
          <div className="modal-body">{children}</div>
          {footer && <footer className="modal-footer">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

// ---------------------------------------------------------------- Confirm dialog

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [state, setState] = useState<(ConfirmOptions & { resolve(v: boolean): void }) | null>(null);
  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={state != null}
        onClose={() => close(false)}
        title={state?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button onClick={() => close(false)}>{t('common.actions.cancel')}</Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
              {state?.confirmLabel ?? t('common.actions.confirm')}
            </Button>
          </>
        }
      >
        {state?.body}
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** `const confirm = useConfirm(); if (await confirm({ title })) …` */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx;
}

// ---------------------------------------------------------------- Toasts

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick(): void };
}

interface ToastApi {
  show(message: string, kind?: ToastKind, action?: ToastItem['action']): void;
  success(message: string): void;
  error(message: string, action?: ToastItem['action']): void;
  info(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);
const ICONS: Record<ToastKind, IconName> = { success: 'check', error: 'warning', info: 'info' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const { t } = useI18n();
  const remove = useCallback((id: number) => setItems((list) => list.filter((x) => x.id !== id)), []);
  const show = useCallback(
    (message: string, kind: ToastKind = 'info', action?: ToastItem['action']) => {
      const id = Date.now() + Math.random();
      setItems((list) => [...list.slice(-3), { id, kind, message, action }]);
      window.setTimeout(() => remove(id), kind === 'error' ? 7000 : 4000);
    },
    [remove],
  );
  const api = useRef<ToastApi>({
    show,
    success: (m) => show(m, 'success'),
    error: (m, a) => show(m, 'error', a),
    info: (m) => show(m, 'info'),
  });
  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div className="toasts" aria-live="polite" aria-relevant="additions">
        {items.map((it) => (
          <div key={it.id} className={`toast toast-${it.kind}`} role={it.kind === 'error' ? 'alert' : 'status'}>
            <Icon name={ICONS[it.kind]} size={18} />
            <span className="toast-message">{it.message}</span>
            {it.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  it.action!.onClick();
                  remove(it.id);
                }}
              >
                {it.action.label}
              </button>
            )}
            <button type="button" className="toast-close" aria-label={t('common.actions.close')} onClick={() => remove(it.id)}>
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
