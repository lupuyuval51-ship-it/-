import { useEffect, useId, useRef, useState } from 'react';
import {
  MAX_REST_SECONDS,
  adjustTimer,
  idleTimer,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
  timerRemainingSeconds,
  timerStatus,
  type RestTimerState,
  type RestTimerStatus,
} from '@shared/timer';
import { formatClock } from '@shared/training';
import { Button, Icon, IconButton, ProgressRing, Segmented } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n';
import { notificationPermission, primeAudio, requestNotificationPermission } from './alarm';
import { serverNow } from './clock';
import { readTimerMuted, writeTimerMuted } from './storage';

export const REST_PRESETS = [30, 60, 90, 120, 180] as const;

interface TimerModel {
  status: RestTimerStatus;
  remaining: number;
  /** Seconds shown on the clock (the configured duration while idle). */
  shown: number;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  adjust(delta: number): void;
  setDuration(seconds: number): void;
  close(): void;
}

/**
 * Timestamp-based rest timer model (`shared/timer.ts`): the remaining time is always
 * derived from `endsAt` and the server-corrected clock, never from a decrementing
 * counter, so it survives refreshes, background tabs and navigation.
 */
function useTimerModel(timer: RestTimerState, onChange: (next: RestTimerState | null) => void): TimerModel {
  const running = timerStatus(timer, serverNow()) === 'running';
  const now = serverNow(useNow(250, running));
  const status = timerStatus(timer, now);
  const remaining = timerRemainingSeconds(timer, now);
  const act = (next: RestTimerState | null) => {
    primeAudio();
    onChange(next);
  };
  return {
    status,
    remaining,
    shown: status === 'idle' ? timer.durationSeconds : remaining,
    start: () => act(startTimer(timer.durationSeconds, serverNow(), timer.exerciseId)),
    pause: () => act(pauseTimer(timer, serverNow())),
    resume: () => act(resumeTimer(timer, serverNow())),
    reset: () => act(resetTimer(timer)),
    adjust: (delta) => act(adjustTimer(timer, delta, serverNow())),
    setDuration: (seconds) => {
      const d = Math.max(5, Math.min(MAX_REST_SECONDS, Math.round(seconds)));
      // A running rest restarts with the new length; a paused one stays paused (with the new length left).
      if (status === 'running') act(startTimer(d, serverNow(), timer.exerciseId));
      else if (status === 'paused') act({ ...idleTimer(d, timer.exerciseId), remainingSeconds: d });
      else act(idleTimer(d, timer.exerciseId));
    },
    close: () => onChange(null),
  };
}

function MainButton({ m, size }: { m: TimerModel; size?: 'sm' | 'md' }) {
  const { t } = useI18n();
  if (m.status === 'running') {
    return (
      <Button variant="secondary" size={size} icon="pause" onClick={m.pause} aria-label={t('session.timer.pauseLabel')}>
        {t('session.timer.pause')}
      </Button>
    );
  }
  if (m.status === 'paused') {
    return (
      <Button variant="secondary" size={size} icon="play" onClick={m.resume} aria-label={t('session.timer.resumeLabel')}>
        {t('session.timer.resume')}
      </Button>
    );
  }
  return (
    <Button variant="secondary" size={size} icon="play" onClick={m.start} aria-label={t('session.timer.startLabel')}>
      {t('session.timer.start')}
    </Button>
  );
}

export function statusLabel(status: RestTimerStatus, t: ReturnType<typeof useI18n>['t']): string {
  if (status === 'running') return t('session.timer.resting');
  if (status === 'paused') return t('session.timer.paused');
  if (status === 'finished') return t('session.timer.finished');
  return t('session.timer.ready');
}

/** Duration presets, custom length and notifications: shared by the desktop card and the phone dock's expander. */
function RestOptions({ m, timer, showMute }: { m: TimerModel; timer: RestTimerState; showMute: boolean }) {
  const { t } = useI18n();
  const [muted, setMuted] = useState(readTimerMuted);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState(String(timer.durationSeconds));
  const [permission, setPermission] = useState(notificationPermission);
  const customId = useId();
  const preset = (REST_PRESETS as readonly number[]).includes(timer.durationSeconds) ? timer.durationSeconds : null;
  return (
    <>
      <div className="rest-timer-durations">
        <Segmented<number>
          label={t('session.timer.duration')}
          size="sm"
          value={customOpen ? null : preset}
          onChange={(v) => {
            setCustomOpen(false);
            m.setDuration(v);
          }}
          options={REST_PRESETS.map((p) => ({ value: p, label: formatClock(p) }))}
        />
        <Button size="sm" variant={customOpen || preset == null ? 'secondary' : 'ghost'} aria-expanded={customOpen} onClick={() => setCustomOpen((v) => !v)}>
          {preset == null && !customOpen ? `${t('session.timer.custom')} · ${formatClock(timer.durationSeconds)}` : t('session.timer.custom')}
        </Button>
        {showMute && (
          <Button
            size="sm"
            variant="ghost"
            icon="bell"
            className={muted ? 'rest-timer-mute is-muted' : 'rest-timer-mute'}
            aria-pressed={muted}
            onClick={() => {
              writeTimerMuted(!muted);
              setMuted(!muted);
              primeAudio();
            }}
          >
            {muted ? t('session.timer.unmute') : t('session.timer.mute')}
          </Button>
        )}
        {customOpen && (
          <form
            className="row rest-timer-custom"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(custom);
              if (Number.isFinite(n) && n > 0) {
                m.setDuration(n);
                setCustomOpen(false);
              }
            }}
          >
            <label htmlFor={customId} className="visually-hidden">
              {t('session.timer.customLabel')}
            </label>
            <input
              id={customId}
              className="input input-number rest-timer-custom-input"
              inputMode="numeric"
              enterKeyHint="done"
              autoComplete="off"
              value={custom}
              onChange={(e) => /^\d{0,3}$/.test(e.target.value) && setCustom(e.target.value)}
              aria-describedby={`${customId}-hint`}
            />
            <span id={`${customId}-hint`} className="small muted">
              {t('session.timer.customHint')}
            </span>
            <Button size="sm" type="submit" variant="secondary">
              {t('session.timer.apply')}
            </Button>
          </form>
        )}
      </div>

      {permission === 'default' && (
        <Button
          size="sm"
          variant="ghost"
          icon="bell"
          className="rest-timer-notify"
          onClick={async () => {
            primeAudio();
            setPermission(await requestNotificationPermission());
          }}
        >
          {t('session.timer.notify')}
        </Button>
      )}
      {permission === 'denied' && <p className="small faint">{t('session.timer.notificationsBlocked')}</p>}
    </>
  );
}

/** Screen-reader announcement of state changes (not every second). */
function useTimerAnnouncement(m: TimerModel): string {
  const { t } = useI18n();
  const [announcement, setAnnouncement] = useState('');
  const prevStatus = useRef(m.status);
  useEffect(() => {
    if (prevStatus.current === m.status) return;
    if (m.status === 'finished') setAnnouncement(t('session.timer.finished'));
    else if (m.status === 'running' && prevStatus.current !== 'paused') setAnnouncement(t('session.timer.started', { time: formatClock(m.remaining) }));
    prevStatus.current = m.status;
  }, [m.status, m.remaining, t]);
  return announcement;
}

/** Full rest timer card (desktop): big countdown, controls, duration presets, sound & notifications. */
export function RestTimerCard({ timer, onChange }: { timer: RestTimerState; onChange(next: RestTimerState | null): void }) {
  const { t } = useI18n();
  const m = useTimerModel(timer, onChange);
  const [muted, setMuted] = useState(readTimerMuted);
  const announcement = useTimerAnnouncement(m);
  const titleId = useId();

  return (
    <section className={`card rest-timer rest-timer-${m.status}`} aria-labelledby={`${titleId}-title`}>
      <header className="rest-timer-header">
        <h2 className="card-title" id={`${titleId}-title`}>
          {t('session.timer.title')}
        </h2>
        <div className="row">
          <IconButton
            icon="bell"
            size="sm"
            className={muted ? 'rest-timer-mute is-muted' : 'rest-timer-mute'}
            label={muted ? t('session.timer.unmute') : t('session.timer.mute')}
            aria-pressed={muted}
            onClick={() => {
              writeTimerMuted(!muted);
              setMuted(!muted);
              primeAudio();
            }}
          />
          <IconButton icon="close" size="sm" label={t('session.timer.close')} onClick={m.close} />
        </div>
      </header>

      <div className="rest-timer-body">
        <ProgressRing value={m.shown} max={Math.max(1, timer.durationSeconds)} size={160} stroke={12} tone={m.status === 'finished' ? 'success' : m.status === 'paused' ? 'warning' : 'primary'}>
          <span className="rest-timer-clock num" role="timer" aria-label={t('session.timer.remaining', { time: formatClock(m.shown) })}>
            {formatClock(m.shown)}
          </span>
        </ProgressRing>
        <div className="rest-timer-side">
          <p className="rest-timer-status" data-status={m.status}>
            {statusLabel(m.status, t)}
          </p>
          <div className="rest-timer-controls">
            <Button size="sm" onClick={() => m.adjust(-15)} aria-label={t('session.timer.minus15Label')}>
              {t('session.timer.minus15')}
            </Button>
            <MainButton m={m} />
            <Button size="sm" onClick={() => m.adjust(15)} aria-label={t('session.timer.plus15Label')}>
              {t('session.timer.plus15')}
            </Button>
            <Button size="sm" variant="ghost" icon="refresh" onClick={m.reset} disabled={m.status === 'idle'} aria-label={t('session.timer.resetLabel')}>
              {t('session.timer.reset')}
            </Button>
            <Button size="sm" variant="secondary" icon="chevronRight" onClick={m.close} aria-label={t('session.timer.skipLabel')}>
              {t('session.timer.skip')}
            </Button>
          </div>
        </div>
      </div>

      <RestOptions m={m} timer={timer} showMute={false} />
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}

/**
 * Phone rest dock: fixed to the bottom edge while a timer exists. Remaining time, status and a thin
 * progress line, with -15 / pause-resume / +15 / reset / skip always in reach. Presets, sound, custom
 * length and notifications sit behind an expander (a disclosure, deliberately not a dialog, so the
 * workout keyboard shortcuts and the set inputs stay live).
 */
export function RestDock({ timer, onChange }: { timer: RestTimerState; onChange(next: RestTimerState | null): void }) {
  const { t } = useI18n();
  const m = useTimerModel(timer, onChange);
  const [open, setOpen] = useState(false);
  const optionsId = useId();
  const announcement = useTimerAnnouncement(m);
  const pct = Math.max(0, Math.min(100, (m.shown / Math.max(1, timer.durationSeconds)) * 100));
  const mainLabel = m.status === 'running' ? t('session.timer.pauseLabel') : m.status === 'paused' ? t('session.timer.resumeLabel') : t('session.timer.startLabel');
  const mainIcon = m.status === 'running' ? 'pause' : 'play';
  const onMain = m.status === 'running' ? m.pause : m.status === 'paused' ? m.resume : m.start;
  return (
    <section className={`rest-dock rest-dock-${m.status}`} aria-label={t('session.timer.title')}>
      <div className="rest-dock-line" aria-hidden="true">
        <span className="rest-dock-line-fill" style={{ inlineSize: `${pct}%` }} />
      </div>
      {open && (
        <div className="rest-dock-options" id={optionsId}>
          <RestOptions m={m} timer={timer} showMute />
        </div>
      )}
      <div className="rest-dock-row">
        <div className="rest-dock-time">
          <span className="rest-dock-clock num" role="timer" aria-label={t('session.timer.remaining', { time: formatClock(m.shown) })}>
            {formatClock(m.shown)}
          </span>
          <span className="rest-dock-status" data-status={m.status}>
            {m.status === 'finished' ? t('session.timer.notificationTitle') : statusLabel(m.status, t)}
          </span>
        </div>
        <div className="rest-dock-transport">
          <button type="button" className="rest-dock-btn rest-dock-step" onClick={() => m.adjust(-15)} aria-label={t('session.timer.minus15Label')}>
            {t('session.timer.minus15')}
          </button>
          <button type="button" className="rest-dock-btn rest-dock-main" onClick={onMain} aria-label={mainLabel}>
            <Icon name={mainIcon} size={20} />
          </button>
          <button type="button" className="rest-dock-btn rest-dock-step" onClick={() => m.adjust(15)} aria-label={t('session.timer.plus15Label')}>
            {t('session.timer.plus15')}
          </button>
        </div>
        <button type="button" className="rest-dock-btn" onClick={m.reset} disabled={m.status === 'idle'} aria-label={t('session.timer.resetLabel')}>
          <Icon name="refresh" size={18} />
        </button>
        <button type="button" className="rest-dock-btn" onClick={m.close} aria-label={t('session.timer.skipLabel')}>
          <Icon name="close" size={18} />
        </button>
        <button
          type="button"
          className="rest-dock-btn"
          aria-expanded={open}
          aria-controls={open ? optionsId : undefined}
          aria-label={t('session.timer.options')}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? 'chevronDown' : 'chevronUp'} size={18} />
        </button>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
