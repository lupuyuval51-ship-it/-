import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { Banner, Button, Card, EmptyState, ErrorState, Loading, errorMessage } from '../ui/kit.tsx';
import { useToast } from '../ui/toast.tsx';
import { IconBell, IconStar } from '../ui/icons.tsx';
import '../styles/progress.css';

interface Notification { id: string; kind: string; payload: unknown; read: boolean; createdAt: string }

function titleOf(n: Notification, t: (k: string) => string): string {
  const id = (n.payload as { id?: unknown } | null)?.id;
  if (n.kind === 'achievement' && typeof id === 'string') {
    const k = `label.achievement.${id}`; const v = t(k);
    if (v !== k) return v;
  }
  return t('notifications.generic');
}

export default function Notifications(): ReactNode {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => api.get<{ notifications: Notification[] }>('/api/notifications') });
  const markAll = useMutation({
    mutationFn: () => api.post('/api/notifications/read'),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['notifications'] }); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const list = q.data?.notifications ?? [];
  const unread = list.filter((n) => !n.read).length;
  return (
    <div className="stack">
      <div className="row-between">
        <h1>{t('nav.notifications')}</h1>
        {unread > 0 ? <Button size="sm" disabled={markAll.isPending} onClick={() => markAll.mutate()}>{t('notifications.markAll')}</Button> : null}
      </div>
      {list.length === 0 ? <EmptyState icon={<IconBell />} title={t('notifications.empty')} hint={t('notifications.emptyHint')} /> : (
        <Card>
          <ul className="list">
            {list.map((n) => (
              <li key={n.id} className={n.read ? 'notif' : 'notif unread'}>
                <IconStar />
                <span className="grow stack-sm">
                  <strong>{titleOf(n, t)}</strong>
                  <span className="tiny muted num">{fmt.date(n.createdAt, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>
                {!n.read ? <span className="notif-dot" role="img" aria-label={t('notifications.unread')} /> : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Banner>{t('notifications.localReminders')}</Banner>
    </div>
  );
}
