/**
 * Header pill linking back to an in-progress workout (shown on every page except the
 * workout itself). Being mounted app-wide, it also hosts the background sync of
 * unsaved workout edits and the end-of-rest alarm, so both keep working while the
 * user browses elsewhere. Owned by the sessions feature.
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { activeElapsedSeconds, formatClock } from '@shared/training';
import { Icon, useToast } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n';
import { useRestAlarm } from './alarm';
import { serverNow } from './clock';
import { useActiveSession, useSessionSync } from './hooks';
import { sessionSync } from './sync';
import '../../styles/session.css';

export const ACTIVE_SESSION_PATH = '/workouts/session';

export function ActiveSessionIndicator() {
  const { t } = useI18n();
  const toast = useToast();
  const location = useLocation();
  useSessionSync();
  const query = useActiveSession({ refetchInterval: 60_000 });
  const session = query.data ?? null;
  useRestAlarm(session);
  const now = serverNow(useNow(1000, session?.status === 'in_progress'));

  useEffect(() => sessionSync.onDrop(() => toast.error(t('session.sync.dropped'))), [toast, t]);

  if (!session || location.pathname === ACTIVE_SESSION_PATH) return null;
  const time = formatClock(activeElapsedSeconds(session, now));
  const paused = session.status === 'paused';
  return (
    <Link
      to={ACTIVE_SESSION_PATH}
      className={`pill session-pill${paused ? ' session-pill-paused' : ''}`}
      aria-label={paused ? t('session.indicator.pausedLabel', { time }) : t('session.indicator.label', { time })}
    >
      <Icon name={paused ? 'pause' : 'dumbbell'} size={16} />
      <span className="num">{t('session.indicator.text', { time })}</span>
    </Link>
  );
}
