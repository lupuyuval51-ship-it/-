import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DirectorStatus } from '../../ai/client.ts';
import { useStore, type Toast } from '../../state/store.tsx';
import { navigate } from '../router.ts';
import { IconFilm, IconRefresh } from '../icons.tsx';
import { Sheet } from './Sheet.tsx';

const DOT: Record<string, string> = {
  online: 'bg-ok',
  degraded: 'bg-warn',
  rate_limited: 'bg-warn',
  checking: 'bg-ivory-mute anim-pulse',
  unreachable: 'bg-warn',
  not_configured: 'bg-ivory-mute',
  no_server: 'bg-ivory-mute',
  misconfigured: 'bg-err',
  auth_failed: 'bg-err',
  forbidden: 'bg-err',
  model_unavailable: 'bg-err',
};

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`t-display select-none whitespace-nowrap leading-none ${compact ? 'text-[1.1875rem]' : 'text-[clamp(17px,5.6vw,22px)] max-[359px]:text-[16.5px]'}`}
      aria-label="PLOT TWIST"
    >
      <span aria-hidden="true">
        PLOT<span className="mx-[0.12em] inline-block -translate-y-[0.06em] rotate-[-8deg] text-[color:var(--accent)]">✶</span>TWIST
      </span>
    </span>
  );
}

/** The pill's one word. "Offline": can't be reached right now; "Off": not set up on this server. */
const SHORT: Record<string, string> = {
  online: 'Online',
  degraded: 'Unstable',
  rate_limited: 'Busy',
  checking: 'Checking',
  unreachable: 'Offline',
  not_configured: 'Off',
  no_server: 'Offline',
  misconfigured: 'Error',
  auth_failed: 'Error',
  forbidden: 'Error',
  model_unavailable: 'Error',
};

export function StatusPill({ status, onClick }: { status: DirectorStatus; onClick: () => void }) {
  const short = SHORT[status.state] ?? status.label;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex min-h-11 shrink-0 items-center"
      // The accessible name starts with the visible text, so "click AI Online" works for voice users.
      aria-label={`AI ${short}. AI Director: ${status.label}. Show details`}
    >
      {/* Below 360px everything in the header gives up a few pixels, so even "AI Checking" fits one row. */}
      <span className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full border border-ivory/14 bg-ivory/[0.04] py-1 pl-2.5 pr-3 text-[0.7812rem] max-[359px]:gap-1.5 max-[359px]:pl-2 max-[359px]:pr-2.5 font-semibold text-ivory-dim transition-colors group-hover:border-ivory/30 group-hover:text-ivory">
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[status.state] ?? 'bg-ivory-mute'}`} aria-hidden="true" />
        {/* Never truncated, and always says what it is about ("Off" alone reads like the app is
            off): on narrow screens only the "·" goes, and the header wraps before anything is cut. */}
        <span aria-hidden="true">
          AI <span className="text-ivory-mute max-[419px]:hidden">· </span>
          <span className="text-ivory">{short}</span>
        </span>
      </span>
    </button>
  );
}

function timeAgo(ts: number | null): string {
  if (!ts) return 'not yet';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

export function DirectorSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, refreshDirector, toast } = useStore();
  const s = state.director;
  const [checking, setChecking] = useState(false);

  // The check ends when the request settles — even if the server answers from its short
  // refresh throttle with an unchanged snapshot — and its outcome is announced.
  const check = () => {
    if (checking) return;
    setChecking(true);
    void refreshDirector().then((status) => {
      setChecking(false);
      toast(status ? `AI Director checked: ${status.label}.` : 'Could not check the AI Director. Try again in a moment.', status ? 'info' : 'warn');
    });
  };

  return (
    <Sheet open={open} onClose={onClose} title="AI Director status">
      <div className="mt-3 flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${DOT[s.state] ?? 'bg-ivory-mute'}`} aria-hidden="true" />
        <p className="t-display text-[1.75rem]">{s.label}</p>
      </div>
      <p className="mt-3 text-ivory-dim">{s.detail}</p>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[0.875rem]">
        <dt className="t-kicker">Provider</dt>
        <dd>{s.state === 'no_server' ? 'Server unreachable' : s.configured ? 'Anthropic Claude' : 'Not configured'}</dd>
        {s.model && (
          <>
            <dt className="t-kicker">Model</dt>
            <dd className="t-num text-[0.8125rem]">{s.model}</dd>
          </>
        )}
        <dt className="t-kicker">Checked</dt>
        <dd>{timeAgo(s.checkedAt)}</dd>
      </dl>
      <div className="card mt-5 p-4 text-[0.875rem] text-ivory-dim">
        <p>
          <strong className="text-ivory">How it works:</strong> when the AI Director is online, one of your three envelopes is written just for you — then checked against the same rules as our
          curated episodes. If it misses, an archive episode takes its place. Curated episodes keep working when the AI Director is offline.
        </p>
      </div>
      {/* aria-disabled, not disabled: a disabled button drops keyboard focus out of the dialog. */}
      <button type="button" className="btn btn-secondary mt-5 w-full" aria-disabled={checking || undefined} onClick={check}>
        <IconRefresh size={18} className={checking ? 'anim-spin' : undefined} /> {checking ? 'Checking…' : 'Check again'}
      </button>
    </Sheet>
  );
}

export function TopBar({ onStatus }: { onStatus: () => void }) {
  const { state } = useStore();
  const count = state.p.completed.length;
  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-x-2 px-3 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))] min-[360px]:px-4">
      <a
        href="#/"
        className="-ml-1 inline-flex min-h-11 min-w-0 items-center rounded-lg px-1"
        aria-label="PLOT TWIST — home"
        onClick={(e) => {
          if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          // In-app navigation: no second entry for the same screen (a bare URL and #/ are one place).
          e.preventDefault();
          navigate({ name: 'scene' });
        }}
      >
        <Wordmark />
      </a>
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1">
        <StatusPill status={state.director} onClick={onStatus} />
        <button
          type="button"
          onClick={() => navigate({ name: 'series' })}
          className="relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[0.7812rem] max-[359px]:px-2 font-semibold text-ivory-dim transition-colors hover:bg-ivory/[0.06] hover:text-ivory"
          aria-label={`My Series, ${count} episode${count === 1 ? '' : 's'}`}
        >
          <IconFilm size={20} />
          <span className="hidden min-[420px]:inline">Series</span>
          <span className="t-num grid h-5 min-w-5 place-items-center rounded-full bg-ivory/12 px-1 text-[0.6875rem] text-ivory" aria-hidden="true">
            {count}
          </span>
        </button>
      </div>
    </header>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [hold, setHold] = useState(false);
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;
  useEffect(() => {
    if (hold) return;
    const id = window.setTimeout(() => dismiss.current(), 4600);
    return () => window.clearTimeout(id);
  }, [hold]);
  return (
    <button
      type="button"
      onClick={onDismiss}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
      className={`anim-fade-up pointer-events-auto max-w-[440px] rounded-2xl border px-4 py-3 text-left text-[0.875rem] font-medium shadow-2xl backdrop-blur ${
        toast.tone === 'warn' ? 'border-warn/40 bg-ink-850/95 text-ivory' : toast.tone === 'success' ? 'border-ok/30 bg-ink-850/95 text-ivory' : 'border-ivory/15 bg-ink-850/95 text-ivory'
      }`}
    >
      {toast.message}
      <span className="sr-only"> (dismiss)</span>
    </button>
  );
}

/**
 * Text for the toast announcer: the newest message only, set once per new toast. Dismissing a
 * toast never changes it (that would re-read an older one), and a repeated message still
 * changes the text so it is announced again.
 */
function useToastAnnouncement(toasts: readonly Toast[]): string {
  const [text, setText] = useState('');
  /** Toasts already announced (or already on screen), so a dismissal never re-announces one. */
  const known = useRef(new Set<string>());
  useEffect(() => {
    const fresh = toasts.filter((t) => !known.current.has(t.id));
    known.current = new Set(toasts.map((t) => t.id));
    const newest = fresh[fresh.length - 1];
    if (!newest) return;
    setText((prev) => (prev === newest.message ? `${newest.message}\u00a0` : newest.message));
  }, [toasts]);
  return text;
}

/**
 * Status messages. Portaled to <body> (so they stay announced while a dialog makes
 * the app inert) and placed below the header/sticky bar, never over its controls.
 * Screen readers hear each message once, from a separate announcer; the visible stack
 * (buttons that dismiss) is not a live region.
 */
export function Toasts() {
  const { state, dismissToast } = useStore();
  const announcement = useToastAnnouncement(state.toasts);
  return createPortal(
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(max(0.5rem,env(safe-area-inset-top))+3.5rem)] z-[80] flex flex-col items-center gap-2 px-4">
        {state.toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>,
    document.body,
  );
}

export function StorageBanner() {
  const { state } = useStore();
  const [hidden, setHidden] = useState(false);
  const message =
    state.storageIssue === 'quota'
      ? 'Storage on this device is full, so your newest progress may not be saved. Free up some space and it will save again.'
      : !state.storageWritable
        ? "This browser isn't letting PLOT TWIST save (private browsing or blocked site data). Your episode works, but progress won't survive a refresh."
        : state.loadStatus === 'reset-corrupt' || state.loadStatus === 'repaired'
          ? state.loadMessage
          : undefined;
  if (!message || hidden) return null;
  return (
    <div className="relative z-20 mx-4 mb-2 flex items-start gap-3 rounded-2xl border border-warn/30 bg-warn/[0.07] p-3 text-[0.8438rem] text-ivory" role="alert">
      <p className="flex-1">{message}</p>
      <button type="button" className="t-kicker -my-2 -mr-1 inline-flex min-h-11 shrink-0 items-center px-2 text-ivory-dim hover:text-ivory" onClick={() => setHidden(true)}>
        Dismiss
      </button>
    </div>
  );
}
