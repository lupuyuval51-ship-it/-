import type { ReactNode } from 'react';
import { formatClock } from '@shared/training';
import { Badge, Button, Icon, Tally } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useSyncStatus } from './hooks';

/** "All changes saved" / "Saving…" / offline state of the workout's local edit queue. */
export function SyncIndicator() {
  const { t } = useI18n();
  const s = useSyncStatus();
  const state = s.offline ? 'offline' : s.retrying ? 'retrying' : s.pending > 0 || s.saving ? 'saving' : 'saved';
  const icon = state === 'saved' ? 'check' : state === 'saving' ? 'refresh' : 'warning';
  return (
    <p className={`sync-status sync-${state}`} role="status" aria-live="polite">
      <Icon name={icon} size={14} />
      <span>{t(`session.sync.${state}`)}</span>
    </p>
  );
}

/**
 * Compact sticky strip at the top of the live workout: title, elapsed clock, set tally and save state,
 * with Pause / Finish / Discard as small neutral buttons (the only orange action on the screen is the
 * current set's check button).
 */
export function SessionStrip({
  name,
  elapsedSeconds,
  paused,
  done,
  total,
  pausePending,
  discardPending,
  onPause,
  onFinish,
  onDiscard,
  children,
}: {
  name: string;
  elapsedSeconds: number;
  paused: boolean;
  done: number;
  total: number;
  pausePending: boolean;
  discardPending: boolean;
  onPause(): void;
  onFinish(): void;
  onDiscard(): void;
  /** Transient overlay hung directly below the strip (the undo bar), so it never covers the current set. */
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const progress = t('session.header.progress', { done, total });
  return (
    <header className="session-strip">
      <div className="session-strip-top">
        <h1 className="session-strip-title">{name}</h1>
        <div className="session-strip-clock">
          {paused && <Badge tone="warning">{t('enums.sessionStatus.paused')}</Badge>}
          <span className="session-clock-value num" role="timer" aria-label={`${t('session.header.elapsed')}: ${formatClock(elapsedSeconds)}`}>
            {formatClock(elapsedSeconds)}
          </span>
        </div>
      </div>
      <div className="session-strip-progress">
        <Tally total={total} done={done} label={progress} />
        <span className="session-strip-count num">
          {done}/{total}
        </span>
        <SyncIndicator />
      </div>
      <div className="session-strip-actions" role="group" aria-label={t('session.header.actions')}>
        <Button
          size="sm"
          icon={paused ? 'play' : 'pause'}
          onClick={onPause}
          loading={pausePending}
          aria-label={paused ? t('session.header.resumeLabel') : t('session.header.pauseLabel')}
        >
          {paused ? t('session.header.resume') : t('session.header.pause')}
        </Button>
        <Button size="sm" icon="check" onClick={onFinish}>
          {t('session.header.finish')}
        </Button>
        <Button size="sm" variant="ghost" icon="close" className="session-discard" onClick={onDiscard} loading={discardPending}>
          {t('session.header.discard')}
        </Button>
      </div>
      {children}
    </header>
  );
}
