import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../api/queryClient';
import { Button, Card, EmptyState, Icon, IconButton, PageHeader, QueryState, useConfirm, useToast } from '../../components/ui';
import { LIST_LIMIT, gamificationApi, notificationKeys } from '../../features/gamification/api';
import { NOTIFICATION_ICONS, notificationMessage } from '../../features/gamification/notificationText';
import { relativeTimeText, useFmt } from '../../features/progress/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/progress.css';

export default function NotificationsPage() {
  const i18n = useI18n();
  const { t, formatDate } = i18n;
  const fmt = useFmt();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const now = useNow(60_000);
  useDocumentTitle(t('notifications.title'));

  const query = useQuery({ queryKey: notificationKeys.list, queryFn: () => gamificationApi.notifications(LIST_LIMIT) });
  const refresh = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: qk.notifications }), queryClient.invalidateQueries({ queryKey: qk.dashboard })]);
  const onError = (err: unknown) => toast.error(errorMessage(err, i18n, 'notifications'));

  const markRead = useMutation({ mutationFn: gamificationApi.markRead, onSuccess: refresh, onError });
  const markAll = useMutation({
    mutationFn: gamificationApi.markAllRead,
    onSuccess: async () => {
      toast.success(t('notifications.allRead'));
      await refresh();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: gamificationApi.remove,
    onSuccess: async () => {
      toast.success(t('notifications.deleted'));
      await refresh();
    },
    onError,
  });

  const unread = query.data?.unreadCount ?? 0;

  return (
    <div className="notifications-page">
      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        actions={
          <Button icon="check" onClick={() => markAll.mutate()} loading={markAll.isPending} disabled={unread === 0}>
            {t('notifications.markAllRead')}
          </Button>
        }
      />
      <QueryState
        query={query}
        isEmpty={(d) => d.notifications.length === 0}
        empty={<EmptyState icon="bell" title={t('notifications.empty.title')} body={t('notifications.empty.body')} />}
      >
        {(data) => (
          <Card padded={false} className="notif-card">
            <p className="notif-summary muted small" aria-live="polite">
              {t('notifications.unreadCount', { count: data.unreadCount })}
            </p>
            <ul className="notif-list">
              {data.notifications.map((n) => {
                const isUnread = !n.readAt;
                const text = notificationMessage(n, fmt);
                const when = (
                  <time className="notif-time faint small" dateTime={n.createdAt}>
                    {relativeTimeText(n.createdAt, now, { ...fmt, formatDate })}
                  </time>
                );
                return (
                  <li key={n.id} className={`notif-item${isUnread ? ' notif-unread' : ''}`}>
                    <span className={`notif-icon notif-icon-${n.kind}`} aria-hidden="true">
                      <Icon name={NOTIFICATION_ICONS[n.kind]} size={18} />
                    </span>
                    {isUnread ? (
                      <button
                        type="button"
                        className="notif-main"
                        onClick={() => markRead.mutate(n.id)}
                        disabled={markRead.isPending && markRead.variables === n.id}
                        title={t('notifications.markRead')}
                      >
                        <span className="notif-text">{text}</span>
                        <span className="notif-meta">
                          <span className="notif-dot" aria-hidden="true" />
                          <span className="visually-hidden">{t('notifications.unread')}</span>
                          {when}
                        </span>
                      </button>
                    ) : (
                      <div className="notif-main">
                        <span className="notif-text">{text}</span>
                        <span className="notif-meta">{when}</span>
                      </div>
                    )}
                    <IconButton
                      icon="trash"
                      size="sm"
                      label={t('notifications.delete')}
                      loading={remove.isPending && remove.variables === n.id}
                      onClick={async () => {
                        if (await confirm({ title: t('notifications.deleteTitle'), body: text, confirmLabel: t('common.actions.delete'), danger: true })) {
                          remove.mutate(n.id);
                        }
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
