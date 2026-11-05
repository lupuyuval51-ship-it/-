import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ageBucket, type TrendSuggestion } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { callOrQueue } from '../../lib/outbox.ts';
import { fmt, useLang } from '../../i18n/index.tsx';
import { useProfile } from '../../app/session.ts';
import { Banner, Button, Card, ErrorState, NumberStepper, Sheet, errorMessage } from '../../ui/kit.tsx';
import { Disclosure, SkeletonCard } from '../../ui/patterns.tsx';
import { IconTrash } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { addDaysIso, localIso } from '../home/dates.ts';
import { LineChart } from './LineChart.tsx';
import '../../styles/progress.css';

interface WeightEntry { id: string; loggedDate: string; weightKg: number; note: string | null }
interface WeightsResponse { entries: WeightEntry[]; smoothed: { date: string; weightKg: number }[]; suggestion: TrendSuggestion | null }

/** Body-weight card: add (offline-safe), delete, smoothed trend chart and the suggest-only calorie nudge. */
export function WeightCard({ rangeDays }: { rangeDays: number }): ReactNode {
  const { t, lang } = useLang();
  const toast = useToast();
  const qc = useQueryClient();
  const profile = useProfile().data;
  const fetchDays = Math.max(rangeDays, 30);
  const q = useQuery({ queryKey: ['weights', fetchDays], queryFn: () => api.get<WeightsResponse>('/api/weights', { days: fetchDays }) });
  const [kg, setKg] = useState<number | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<WeightEntry | null>(null);
  const today = localIso();
  const from = addDaysIso(today, -rangeDays);

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['weights'] }); void qc.invalidateQueries({ queryKey: ['progress'] }); void qc.invalidateQueries({ queryKey: ['stats'] }); };
  const add = useMutation({
    mutationFn: (w: number) => callOrQueue({ method: 'POST', path: '/api/weights', body: { loggedDate: today, weightKg: w }, label: `${w} ${t('unit.kg')}` }),
    onSuccess: (r) => { toast(r.queued ? t('outbox.queued') : t('progress.weight.saved'), 'ok'); if (!r.queued) refresh(); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const del = useMutation({
    mutationFn: (e: WeightEntry) => callOrQueue({ method: 'DELETE', path: `/api/weights/${e.id}`, label: `${e.loggedDate} ${e.weightKg} ${t('unit.kg')}` }),
    onSuccess: (r) => { setToDelete(null); toast(r.queued ? t('outbox.queued') : t('state.deleted'), 'ok'); if (!r.queued) refresh(); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });

  if (q.isLoading) return <SkeletonCard />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const all = q.data?.entries ?? [];
  const entries = all.filter((e) => e.loggedDate >= from);
  const smoothed = (q.data?.smoothed ?? []).filter((p) => p.date >= from);
  const start = kg === undefined ? (all[all.length - 1]?.weightKg ?? profile?.profile.weightKg ?? 70) : kg;
  const minor = profile ? ageBucket(profile.profile.age) === 'minor' : false;
  const sug = q.data?.suggestion ?? null;
  const showSug = sug !== null && !(minor && sug.deltaKcal < 0);
  const kcal = profile?.targets.kcal;
  const trend = smoothed.length >= 2 ? Math.round(((smoothed[smoothed.length - 1]?.weightKg ?? 0) - (smoothed[0]?.weightKg ?? 0)) * 10) / 10 : null;
  const summary = entries.length >= 2 ? t('progress.weight.aria', { n: entries.length, from: String(entries[0]?.weightKg), to: String(entries[entries.length - 1]?.weightKg) }) : t('state.noData');

  return (
    <Card>
      <h2>{t('progress.weight.title')}</h2>
      {trend !== null ? <p className="prog-sec-take">{t('progress.take.weightTrend', { d: `\u2066${trend > 0 ? '+' : ''}${fmt.num(trend, 1)}\u2069` })}</p> : null}
      <div className="stack">
        <form className="weight-add" onSubmit={(e) => { e.preventDefault(); if (start !== null && !add.isPending) add.mutate(start); }}>
          <NumberStepper label={t('progress.weight.today')} value={start} onChange={setKg} step={0.1} decimals={1} min={30} max={300} suffix={t('unit.kg')} />
          <Button type="submit" disabled={add.isPending || start === null}>{t('progress.weight.add')}</Button>
        </form>
        <LineChart
          series={[{ id: 'raw', label: t('progress.weight.raw'), tone: 'accent', dotsOnly: true, points: entries.map((e) => ({ x: e.loggedDate, y: e.weightKg })) }, { id: 'trend', label: t('progress.weight.trend'), points: smoothed.map((p) => ({ x: p.date, y: p.weightKg })) }]}
          ariaLabel={summary} caption={t('progress.weight.title')} xHeader={t('progress.date')} unit={t('unit.kg')} decimals={1} formatX={(x) => fmt.date(x, lang)}
        />
        {entries.length < 2 ? <p className="small muted">{t('progress.weight.needMore')}</p> : null}
        {showSug && sug ? (
          <Banner tone="warn">
            <div className="stack-sm">
              <strong>{t('progress.weight.suggestionTitle')}</strong>
              <span>{t(`progress.weight.reason.${sug.reason}`)}</span>
              {kcal !== undefined ? <span className="small">{t('progress.weight.suggestionKcal', { from: String(kcal), to: String(kcal + sug.deltaKcal), delta: `${sug.deltaKcal > 0 ? '+' : ''}${sug.deltaKcal}` })}</span> : <span className="num">{sug.deltaKcal > 0 ? '+' : ''}{sug.deltaKcal} {t('unit.kcal')}</span>}
              <span className="small muted">{t('progress.weight.suggestionOnly')} <Link to="/profile">{t('progress.weight.editTarget')}</Link></span>
            </div>
          </Banner>
        ) : null}
        {entries.length > 0 ? (() => {
          const rev = [...entries].reverse();
          const row = (e: WeightEntry, i: number) => {
            const prev = rev[i + 1]; const d = prev ? Math.round((e.weightKg - prev.weightKg) * 10) / 10 : null;
            return (
              <li key={e.id}>
                <span className="grow"><span className="num">{fmt.date(e.loggedDate, lang)}</span></span>
                {d !== null && d !== 0 ? <span className="tiny muted num">{d > 0 ? '+' : ''}{fmt.num(d, 1)}</span> : null}
                <span className="strong"><span className="num">{fmt.num(e.weightKg, 1)}</span> {t('unit.kg')}</span>
                <button type="button" className="icon-btn" aria-label={t('progress.weight.deleteEntry', { date: e.loggedDate })} onClick={() => setToDelete(e)}><IconTrash /></button>
              </li>
            );
          };
          return (
            <>
              <ul className="list">{rev.slice(0, 3).map((e, i) => row(e, i))}</ul>
              {rev.length > 3 ? <Disclosure summary={t('progress.moreWeighIns', { n: rev.length - 3 })}><ul className="list">{rev.slice(3, 12).map((e, i) => row(e, i + 3))}</ul></Disclosure> : null}
            </>
          );
        })() : null}
      </div>
      <Sheet open={toDelete !== null} onClose={() => setToDelete(null)} title={t('progress.weight.deleteTitle')}>
        <p>{toDelete ? t('progress.weight.deleteBody', { date: toDelete.loggedDate, kg: String(toDelete.weightKg) }) : null}</p>
        <div className="row-wrap">
          <Button variant="danger" disabled={del.isPending} onClick={() => toDelete && del.mutate(toDelete)}>{t('action.delete')}</Button>
          <Button onClick={() => setToDelete(null)}>{t('action.cancel')}</Button>
        </div>
      </Sheet>
    </Card>
  );
}
