import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Icon, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useFmt } from '../progress/format';
import { BELL_LIMIT, gamificationApi, notificationKeys } from './api';
import { notificationMessage } from './notificationText';
import '../../styles/progress.css';

const POLL_MS = 60_000;

/**
 * Header bell with unread count. Owned by the gamification/progress feature.
 * Polls every minute and on window focus; when new unread notifications arrive while the
 * app is open (milestones: achievements, records, level-ups, weekly goals) they are shown
 * as toasts.
 */
export function NotificationBell() {
  const { t } = useI18n();
  const fmt = useFmt();
  const toast = useToast();
  const query = useQuery({
    queryKey: notificationKeys.bell,
    queryFn: () => gamificationApi.notifications(BELL_LIMIT),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
  const seen = useRef<{ unread: number; newest: string } | null>(null);
  const fmtRef = useRef(fmt);
  fmtRef.current = fmt;

  useEffect(() => {
    const data = query.data;
    if (!data) return;
    const newest = data.notifications[0]?.createdAt ?? '';
    const prev = seen.current;
    seen.current = { unread: data.unreadCount, newest: prev && prev.newest > newest ? prev.newest : newest };
    if (!prev || data.unreadCount <= prev.unread) return;
    const fresh = data.notifications.filter((n) => !n.readAt && n.createdAt > prev.newest).slice(0, 3).reverse();
    for (const n of fresh) toast.show(notificationMessage(n, fmtRef.current), 'success');
  }, [query.data, toast]);

  const count = query.data?.unreadCount ?? 0;
  const label = t('notifications.bellLabel', { count });
  return (
    <Link to="/notifications" className="btn btn-ghost btn-icon notif-bell" aria-label={label} title={label}>
      <Icon name="bell" />
      {count > 0 && (
        <span className="notif-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
