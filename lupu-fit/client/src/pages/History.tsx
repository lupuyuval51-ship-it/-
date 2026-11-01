import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.ts';
import { qk } from '../app/session.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { Button, Card, EmptyState, ErrorState, LinkButton, Loading, Sheet, Tag, errorMessage } from '../ui/kit.tsx';
import { IconDumbbell } from '../ui/icons.tsx';
import { useToast } from '../ui/toast.tsx';
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

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const rows = q.data ?? [];
  const sportLabel = (s: string | null) => (s ? t(`label.sport.${s}`) : null);

  return (
    <div className="stack">
      <Link to="/workouts">{t('workouts.history.back')}</Link>
      <h1>{t('workouts.history.title')}</h1>
      {rows.length === 0 ? (
        <EmptyState icon={<IconDumbbell />} title={t('workouts.history.emptyTitle')} hint={t('workouts.history.emptyHint')} action={<LinkButton to="/workouts">{t('workouts.history.toWorkouts')}</LinkButton>} />
      ) : (
        <div className="stack">
          {rows.map((r) => (
            <Card key={r.id} as="article">
              <div className="wk-hist-row">
                <div className="wk-hist-main">
                  <Link to={`/workouts/sessions/${r.id}`} className="wk-plan-name" aria-label={t('workouts.history.openSummary', { name: r.name })}>{r.name}</Link>
                  <div className="wk-meta">
                    <span>{fmt.date(r.localDate, lang, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {r.durationSec !== null ? <span>{t('workouts.history.duration', { n: Math.max(1, Math.round(r.durationSec / 60)) })}</span> : null}
                    <span>{t('workouts.history.sets', { n: r.sets })}</span>
                    <span>{t('workouts.history.xp', { n: r.xpAwarded })}</span>
                  </div>
                  {r.hasFinisher ? <div className="wk-tags"><Tag>{r.sport ? t('workouts.history.finisherChip', { sport: sportLabel(r.sport) ?? '' }) : t('workouts.history.finisherNoSport')}</Tag></div> : null}
                </div>
                <Button size="sm" variant="danger" aria-label={`${t('workouts.history.delete')}: ${r.name}`} onClick={() => setDel(r)}>{t('workouts.history.delete')}</Button>
              </div>
            </Card>
          ))}
          {rows.length >= limit && limit < MAX ? <div><Button disabled={q.isFetching} onClick={() => setLimit((n) => Math.min(MAX, n + STEP))}>{t('workouts.history.more')}</Button></div> : null}
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

