import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { dateInTimeZone, startOfWeek, weekStartsOn } from '@shared/dates';
import type { SessionHistoryItemDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Badge, Button, Card, EmptyState, ErrorState, Icon, IconButton, LinkButton, LoadingState, PageHeader, useConfirm, useToast } from '../../components/ui';
import { deleteSession, fetchSessionHistory, sessionKeys } from '../../features/sessions/api';
import { formatDuration } from '../../features/sessions/format';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { browserTimeZone, today } from '../../lib/dates';
import { errorMessage } from '../../lib/errors';
import '../../styles/session.css';

const PAGE_SIZE = 20;

interface WeekGroup {
  weekStart: string;
  items: SessionHistoryItemDTO[];
  volumeKg: number;
}

/** Groups sessions (already newest first) by calendar week in the browser's time zone. */
export function groupByWeek(items: SessionHistoryItemDTO[], weekStart: 0 | 1, timeZone: string): WeekGroup[] {
  const groups: WeekGroup[] = [];
  for (const item of items) {
    const ws = startOfWeek(dateInTimeZone(item.startedAt, timeZone), weekStart);
    let g = groups[groups.length - 1];
    if (!g || g.weekStart !== ws) {
      g = { weekStart: ws, items: [], volumeKg: 0 };
      groups.push(g);
    }
    g.items.push(item);
    g.volumeKg += item.totalVolumeKg;
  }
  return groups;
}

export default function SessionHistoryPage() {
  const i18n = useI18n();
  const { t, locale, formatDate, formatTime } = i18n;
  const { formatWeight } = useUnits();
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  useDocumentTitle(t('session.history.title'));
  const params = { status: 'completed', limit: PAGE_SIZE };
  const query = useInfiniteQuery({
    queryKey: qk.sessionHistory(params),
    queryFn: ({ pageParam, signal }) => fetchSessionHistory({ limit: PAGE_SIZE, before: pageParam ?? undefined }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: sessionKeys.summary(id) });
      for (const key of [['sessions'], qk.dashboard, ['progress'], qk.gamification, ['exercise']]) void qc.invalidateQueries({ queryKey: key });
      toast.success(t('session.history.deleted'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'session')),
  });

  const header = <PageHeader title={t('session.history.title')} subtitle={t('session.history.subtitle')} backTo="/workouts" backLabel={t('nav.workouts')} />;
  if (query.isPending) {
    return (
      <>
        {header}
        <LoadingState />
      </>
    );
  }
  if (!query.data) {
    return (
      <>
        {header}
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }
  const items = query.data.pages.flatMap((p) => p.sessions);
  if (items.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon="calendar"
          title={t('session.history.empty')}
          body={t('session.history.emptyBody')}
          action={
            <LinkButton to="/workouts/session" variant="primary" icon="play">
              {t('session.history.start')}
            </LinkButton>
          }
        />
      </>
    );
  }
  const tz = browserTimeZone();
  const ws = weekStartsOn(locale);
  const currentWeek = startOfWeek(today(tz), ws);
  const groups = groupByWeek(items, ws, tz);

  return (
    <div className="stack-lg">
      {header}
      {groups.map((g) => (
        <Card
          key={g.weekStart}
          title={g.weekStart === currentWeek ? t('session.history.thisWeek') : t('session.history.weekOf', { date: formatDate(g.weekStart) })}
          subtitle={t('session.history.weekStats', { count: g.items.length, volume: formatWeight(g.volumeKg) })}
          padded
        >
          <ul className="list history-list">
            {g.items.map((s) => (
              <li key={s.id} className="list-item history-item">
                <Link to={`/workouts/sessions/${s.id}`} className="history-link" aria-label={t('session.history.open', { name: s.name })}>
                  <span className="history-date">
                    <span className="history-day num">{formatDate(s.startedAt, { day: 'numeric' })}</span>
                    <span className="small muted">{formatDate(s.startedAt, { weekday: 'short' })}</span>
                  </span>
                  <span className="history-body">
                    <strong className="history-name">{s.name}</strong>
                    <span className="small muted history-meta">
                      <span>{formatTime(s.startedAt)}</span>
                      {s.durationSeconds != null && (
                        <span>
                          <Icon name="clock" size={12} /> {formatDuration(s.durationSeconds, i18n)}
                        </span>
                      )}
                      <span>{t('session.history.exercises', { count: s.exerciseCount })}</span>
                      <span>{t('session.history.sets', { count: s.totalSets })}</span>
                      {s.totalVolumeKg > 0 && <span>{formatWeight(s.totalVolumeKg)}</span>}
                    </span>
                  </span>
                  {s.prCount > 0 && (
                    <Badge tone="warning" icon="trophy">
                      {t('session.history.prs', { count: s.prCount })}
                    </Badge>
                  )}
                </Link>
                <IconButton
                  icon="trash"
                  size="sm"
                  label={t('session.history.delete', { name: s.name })}
                  loading={del.isPending && del.variables === s.id}
                  onClick={async () => {
                    const ok = await confirm({ title: t('session.history.deleteConfirm'), body: t('session.history.deleteBody'), confirmLabel: t('common.actions.delete'), danger: true });
                    if (ok) del.mutate(s.id);
                  }}
                />
              </li>
            ))}
          </ul>
        </Card>
      ))}
      {query.hasNextPage && (
        <Button onClick={() => void query.fetchNextPage()} loading={query.isFetchingNextPage} block>
          {t('common.actions.loadMore')}
        </Button>
      )}
      {query.isFetchNextPageError && <ErrorState compact error={query.error} onRetry={() => void query.fetchNextPage()} />}
    </div>
  );
}
