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
import { Button, IconButton, ProgressBar, ProgressRing, Segmented } from '../../components/ui';
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
      <Button variant="primary" size={size} icon="pause" onClick={m.pause} aria-label={t('session.timer.pauseLabel')}>
        {t('session.timer.pause')}
      </Button>
    );
  }
  if (m.status === 'paused') {
    return (
      <Button variant="primary" size={size} icon="play" onClick={m.resume} aria-label={t('session.timer.resumeLabel')}>
        {t('session.timer.resume')}
      </Button>
    );
  }
  return (
    <Button variant="primary" size={size} icon="play" onClick={m.start} aria-label={t('session.timer.startLabel')}>
      {t('session.timer.start')}
    </Button>
  );
}

function statusLabel(status: RestTimerStatus, t: ReturnType<typeof useI18n>['t']): string {
  if (status === 'running') return t('session.timer.resting');
  if (status === 'paused') return t('session.timer.paused');
  if (status === 'finished') return t('session.timer.finished');
  return t('session.timer.ready');
}

/** Full rest timer card: big countdown, controls, duration presets, sound & notifications. */
export function RestTimerCard({ timer, onChange }: { timer: RestTimerState; onChange(next: RestTimerState | null): void }) {
  const { t } = useI18n();
  const m = useTimerModel(timer, onChange);
  const [muted, setMuted] = useState(readTimerMuted);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState(String(timer.durationSeconds));
  const [permission, setPermission] = useState(notificationPermission);
  const [announcement, setAnnouncement] = useState('');
  const customId = useId();
  const prevStatus = useRef(m.status);

  // Announce state changes (not every second) for screen readers.
  useEffect(() => {
    if (prevStatus.current === m.status) return;
    if (m.status === 'finished') setAnnouncement(t('session.timer.finished'));
    else if (m.status === 'running' && prevStatus.current !== 'paused') setAnnouncement(t('session.timer.started', { time: formatClock(m.remaining) }));
    prevStatus.current = m.status;
  }, [m.status, m.remaining, t]);

  const preset = (REST_PRESETS as readonly number[]).includes(timer.durationSeconds) ? timer.durationSeconds : null;

  return (
    <section className={`card rest-timer rest-timer-${m.status}`} aria-labelledby={`${customId}-title`}>
      <header className="rest-timer-header">
        <h2 className="card-title" id={`${customId}-title`}>
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
        <ProgressRing value={m.shown} max={Math.max(1, timer.durationSeconds)} size={136} stroke={10} tone={m.status === 'finished' ? 'success' : m.status === 'paused' ? 'warning' : 'primary'}>
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
          </div>
        </div>
      </div>

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
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}

/** Slim bar pinned above the mobile bottom navigation while a rest is active (hidden on desktop). */
export function RestTimerBar({ timer, onChange }: { timer: RestTimerState; onChange(next: RestTimerState | null): void }) {
  const { t } = useI18n();
  const m = useTimerModel(timer, onChange);
  if (m.status === 'idle') return null;
  return (
    <div className={`rest-bar rest-bar-${m.status}`} aria-label={t('session.timer.title')} role="group">
      <div className="rest-bar-main">
        <span className="rest-bar-clock num">{formatClock(m.shown)}</span>
        <span className="rest-bar-status small">{statusLabel(m.status, t)}</span>
        <ProgressBar value={m.shown} max={Math.max(1, timer.durationSeconds)} tone={m.status === 'finished' ? 'success' : 'primary'} label={t('session.timer.remaining', { time: formatClock(m.shown) })} />
      </div>
      <div className="rest-bar-actions">
        <Button size="sm" variant="ghost" onClick={() => m.adjust(-15)} aria-label={t('session.timer.minus15Label')}>
          {t('session.timer.minus15')}
        </Button>
        <MainButton m={m} size="sm" />
        <Button size="sm" variant="ghost" onClick={() => m.adjust(15)} aria-label={t('session.timer.plus15Label')}>
          {t('session.timer.plus15')}
        </Button>
        <IconButton icon="close" size="sm" label={t('session.timer.close')} onClick={m.close} />
      </div>
    </div>
  );
}
