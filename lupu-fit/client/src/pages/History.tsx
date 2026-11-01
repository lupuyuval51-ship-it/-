import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.ts';
import { qk } from '../app/session.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { localDateStr } from '../lib/workoutCompose.ts';
import { Button, Card, EmptyState, ErrorState, IconButton, LinkButton, Sheet, Tag, errorMessage } from '../ui/kit.tsx';
import { IconChevron, IconDumbbell, IconTrash } from '../ui/icons.tsx';
import { SkeletonList } from '../ui/patterns.tsx';
import { useToast } from '../ui/toast.tsx';
import { groupByWeek, weeksAgo } from '../components/workouts/weekUtil.ts';
import '../styles/workouts.css';

export interface HistoryRow { id: string; name: string; sport: string | null; startedAt: string; finishedAt: string | null; durationSec: number | null; localDate: string; xpAwarded: number; sets: number; hasFinisher: boolean }
const STEP = 20;
const MAX = 200;

export default function History(): ReactNode {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const toast = useToast();
  const [limit, setLimit] = useState(STEP);
  const [del, setDel] = useState<HistoryRow | null>(null);
  const q = useQuery({ queryKey: ['sessions', 'history', limit], queryFn: async () => (await api.get<{ sessions: HistoryRow[] }>('/api/sessions', { limit })).sessions, placeholderData: (prev) => prev });
  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/sessions/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['sessions'] }); void qc.invalidateQueries({ queryKey: qk.stats }); toast(t('workouts.history.deleted'), 'ok'); setDel(null); },
    onError: (e) => { toast(errorMessage(e, t), 'error'); setDel(null); },
  });

  const rows = q.data ?? [];
  const weeks = useMemo(() => groupByWeek(rows, lang), [rows, lang]);

  if (q.isLoading) return <SkeletonList rows={5} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const sportLabel = (s: string | null) => (s ? t(`label.sport.${s}`) : null);
  const today = localDateStr();
  const weekTitle = (start: string, end: string): string => {
    const ago = weeksAgo(start, today, lang);
    if (ago === 0) return t('workouts.history.thisWeek');
    if (ago === 1) return t('workouts.history.lastWeek');
    return `${fmt.date(start, lang, { day: 'numeric', month: 'short' })} – ${fmt.date(end, lang, { day: 'numeric', month: 'short' })}`;
  };

  return (
    <div className="stack">
      <Link to="/workouts" className="wk-back"><IconChevron className="flip-rtl-back" />{t('workouts.history.back')}</Link>
      <h1>{t('workouts.history.title')}</h1>
      {rows.length === 0 ? (
        <EmptyState icon={<IconDumbbell />} title={t('workouts.history.emptyTitle')} hint={t('workouts.history.emptyHint')} action={<LinkButton to="/workouts" variant="primary">{t('workouts.history.toWorkouts')}</LinkButton>} />
      ) : (
        <div className="stack-lg">
          {weeks.map((w) => {
            const minutes = w.rows.reduce((a, r) => a + (r.durationSec !== null ? Math.max(1, Math.round(r.durationSec / 60)) : 0), 0);
            const sets = w.rows.reduce((a, r) => a + r.sets, 0);
            const xp = w.rows.reduce((a, r) => a + r.xpAwarded, 0);
            return (
              <section key={w.start} className="stack-sm" aria-label={weekTitle(w.start, w.end)}>
                <div className="wk-week-head">
                  <h2>{weekTitle(w.start, w.end)}</h2>
                  <div className="wk-week-stats small">
                    <span><span className="num">{w.rows.length}</span> {t('workouts.history.workoutsWord')}</span>
                    <span><span className="num">{sets}</span> {t('workouts.history.setsWord')}</span>
                    {minutes > 0 ? <span><span className="num">{minutes}</span> {t('unit.min')}</span> : null}
                    <span><span className="num">{xp}</span> {t('workouts.summary.xpUnit')}</span>
                  </div>
                </div>
                <Card className="wk-hist-card">
                  <ul className="wk-hist-list">
                    {w.rows.map((r) => (
                      <li key={r.id} className="wk-hist-row">
                        <div className="wk-date" aria-hidden="true">
                          <span className="num">{new Date(`${r.localDate}T12:00:00`).getDate()}</span>
                          <span className="tiny muted">{fmt.date(r.localDate, lang, { weekday: 'short' })}</span>
                        </div>
                        <div className="wk-hist-main">
                          <Link to={`/workouts/sessions/${r.id}`} className="wk-plan-name" aria-label={t('workouts.history.openSummary', { name: r.name })}>{r.name}</Link>
                          <div className="wk-meta">
                            <span className="sr-only">{fmt.date(r.localDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            {r.durationSec !== null ? <span>{t('workouts.history.duration', { n: Math.max(1, Math.round(r.durationSec / 60)) })}</span> : null}
                            <span>{t('workouts.history.sets', { n: r.sets })}</span>
                            <span>{t('workouts.history.xp', { n: r.xpAwarded })}</span>
                          </div>
                          {r.hasFinisher ? <div className="wk-tags"><Tag>{r.sport ? t('workouts.history.finisherChip', { sport: sportLabel(r.sport) ?? '' }) : t('workouts.history.finisherNoSport')}</Tag></div> : null}
                        </div>
                        <IconButton label={`${t('workouts.history.delete')}: ${r.name}`} onClick={() => setDel(r)}><IconTrash /></IconButton>
                      </li>
                    ))}
                  </ul>
                </Card>
              </section>
            );
          })}
          {rows.length >= limit && limit < MAX ? <div><Button block disabled={q.isFetching} onClick={() => setLimit((n) => Math.min(MAX, n + STEP))}>{t('workouts.history.more')}</Button></div> : null}
        </div>
      )}
      <Sheet open={del !== null} onClose={() => setDel(null)} title={t('workouts.history.deleteTitle')}>
        <p>{del ? t('workouts.history.deleteWarn', { name: del.name }) : null}</p>
        <div className="wk-actions">
          <Button variant="danger" disabled={remove.isPending} onClick={() => del && remove.mutate(del.id)}>{t('workouts.history.delete')}</Button>
          <Button onClick={() => setDel(null)}>{t('workouts.history.cancel')}</Button>
        </div>
      </Sheet>
    </div>
  );
}
