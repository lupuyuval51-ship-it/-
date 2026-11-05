import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ageBucket, type MuscleGroup } from '@lupu-fit/shared';
import { addDaysIso, localIso } from '../components/home/dates.ts';
import { api } from '../api/client.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { nameOfExercise } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { Card, ErrorState, ProgressBar, Segmented } from '../ui/kit.tsx';
import { Disclosure, PageHeader, SkeletonCard, StatTile } from '../ui/patterns.tsx';
import { IconCheck, IconChevron } from '../ui/icons.tsx';
import { TallyMarks } from '../ui/TallyMarks.tsx';
import { BarChart } from '../components/charts/BarChart.tsx';
import { LineChart } from '../components/charts/LineChart.tsx';
import { WeightCard } from '../components/charts/WeightCard.tsx';
import '../styles/progress.css';

type Range = '7d' | '30d' | '90d';
const RANGES: readonly Range[] = ['7d', '30d', '90d'];
const DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };
const GROUPS: readonly MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'];
const GLOSSARY = ['rpe', 'oneRm', 'pr', 'deload', 'tdee', 'bmr', 'volume', 'tally'] as const;

export interface ProgressResponse {
  range: string; from: string; to: string;
  consistency: { sessions: number; weeks: { week: string; count: number }[]; weeklyGoal: number | null };
  setsByGroup: Record<MuscleGroup, number>; hasSets: boolean;
  strength: { exerciseId: string; points: { date: string; est1rm: number }[] }[];
  nutrition: { loggedDays: number; avgKcal: number | null; avgProteinG: number | null; targetKcal: number | null; targetProteinG: number | null; daysOnProteinTarget: number };
  prs: { exerciseId: string; maxWeight: number | null; est1rm: number | null; maxReps: number | null; maxDuration: number | null; updatedAt: string }[];
}
export interface StatsResponse { xp: number; level: { level: number; xpIntoLevel: number; xpForNext: number }; achievements: { id: string; unlockedAt: string }[]; allAchievementIds: string[] }

interface WeightsLite { entries: { loggedDate: string; weightKg: number }[] }
const weekLabel = (w: string): string => w.replace(/^\d{4}-/, '').replace(/-\d{4}$/, '');
/** Numbers inside Hebrew sentences are isolated so signs and decimals keep their left-to-right order. */
const ltr = (s: string): string => `\u2066${s}\u2069`;
const signed = (n: number, d = 1): string => ltr(`${n > 0 ? '+' : ''}${fmt.num(n, d)}`);

export default function Progress(): ReactNode {
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('range');
  const range: Range = RANGES.includes(raw as Range) ? (raw as Range) : '30d';
  const profile = useProfile().data?.profile ?? null;
  const minor = profile ? ageBucket(profile.age) === 'minor' : false;
  const progress = useQuery({ queryKey: ['progress', range], queryFn: () => api.get<ProgressResponse>('/api/progress', { range }) });
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get<StatsResponse>('/api/stats') });
  const fetchDays = Math.max(DAYS[range], 30);
  const weights = useQuery({ queryKey: ['weights', fetchDays], queryFn: () => api.get<WeightsLite>('/api/weights', { days: fetchDays }) });

  const p = progress.data;
  const from = addDaysIso(localIso(), -DAYS[range]);
  const rangeLabel = (r: Range) => t(`date.days.d${DAYS[r]}`);
  const goalTotal = p ? Math.max(p.consistency.sessions, p.consistency.weeklyGoal ? Math.round((p.consistency.weeklyGoal * DAYS[range]) / 7) : 0) : 0;
  const plannedTotal = p?.consistency.weeklyGoal ? Math.round((p.consistency.weeklyGoal * DAYS[range]) / 7) : 0;
  const wEntries = (weights.data?.entries ?? []).filter((e) => e.loggedDate >= from);
  const wFirst = wEntries[0]?.weightKg; const wLast = wEntries[wEntries.length - 1]?.weightKg;
  const wDelta = wEntries.length >= 2 && wFirst !== undefined && wLast !== undefined ? Math.round((wLast - wFirst) * 10) / 10 : null;
  const totalSets = p ? GROUPS.reduce((n, g) => n + (p.setsByGroup[g] ?? 0), 0) : 0;
  const newPrs = p ? p.prs.filter((r) => r.updatedAt.slice(0, 10) >= from) : [];
  const topGroup = p && p.hasSets ? [...GROUPS].sort((a, b) => (p.setsByGroup[b] ?? 0) - (p.setsByGroup[a] ?? 0))[0] : undefined;

  const takeaway: string[] = [];
  if (p) {
    if (p.consistency.sessions > 0) takeaway.push(plannedTotal > 0 ? t('progress.take.sessions', { n: ltr(String(p.consistency.sessions)), g: ltr(String(plannedTotal)) }) : t('progress.take.sessionsNoGoal', { n: ltr(String(p.consistency.sessions)) }));
    if (wDelta !== null && wFirst !== undefined && wLast !== undefined) takeaway.push(t('progress.take.weight', { d: signed(wDelta), from: ltr(fmt.num(wFirst, 1)), to: ltr(fmt.num(wLast, 1)) }));
  }
  const headline = takeaway[0];
  const sorted = stats.data ? [...stats.data.allAchievementIds].sort((a, b) => {
    const ua = stats.data?.achievements.find((x) => x.id === a)?.unlockedAt ?? ''; const ub = stats.data?.achievements.find((x) => x.id === b)?.unlockedAt ?? '';
    return ua && ub ? ub.localeCompare(ua) : ua ? -1 : ub ? 1 : 0;
  }) : [];

  const strengthRows = p ? p.strength.map((s) => {
    const nm = nameOfExercise(s.exerciseId, lang);
    const first = s.points[0]?.est1rm ?? 0; const last = s.points[s.points.length - 1]?.est1rm ?? 0;
    const d = Math.round((last - first) * 10) / 10;
    return (
      <div key={s.exerciseId} className="stack-sm">
        <div className="prog-str"><Link to={`/exercises/${s.exerciseId}`} className="strong prog-link">{nm}</Link><span><span className="num-lg">{fmt.num(last, 1)}</span> <small className="muted small">{t('unit.kg')}</small></span></div>
        <p className="prog-sec-take">{t('progress.take.strength', { from: ltr(fmt.num(first, 1)), to: ltr(fmt.num(last, 1)), d: signed(d) })}</p>
        <LineChart series={[{ id: s.exerciseId, label: nm, points: s.points.map((x) => ({ x: x.date, y: x.est1rm })) }]} ariaLabel={t('progress.strength.aria', { name: nm, from: String(s.points[0]?.est1rm), to: String(s.points[s.points.length - 1]?.est1rm) })} caption={nm} xHeader={t('progress.date')} unit={t('unit.kg')} formatX={(x) => fmt.date(x, lang)} />
      </div>
    );
  }) : [];

  return (
    <div className="stack-lg">
      <PageHeader title={t('nav.progress')} />
      <div className="prog-bar"><Segmented label={t('progress.range')} value={range} options={RANGES.map((r) => ({ value: r, label: rangeLabel(r) }))} onChange={(r) => setSp({ range: r }, { replace: true })} /></div>

      {progress.isLoading ? <div className="stack" role="status" aria-busy="true"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div> : progress.isError ? <ErrorState error={progress.error} onRetry={() => void progress.refetch()} /> : p ? (
        <>
          <div className="stack-sm">
            <p className="prog-take">{headline ? takeaway.map((x, i) => <span key={i}>{x}</span>) : <span>{t('progress.take.empty')}</span>}</p>
            <div className="grid-stats prog-tiles">
              <StatTile label={t('progress.kpi.workouts')} value={p.consistency.sessions} />
              <StatTile label={t('progress.kpi.sets')} value={fmt.num(totalSets)} />
              <StatTile label={t('progress.kpi.prs')} value={newPrs.length} />
              <StatTile label={t('progress.kpi.weight')} value={wDelta === null ? '—' : signed(wDelta)} {...(wDelta === null ? {} : { unit: t('unit.kg') })} />
            </div>
          </div>

          <Card>
            <h2>{t('progress.consistency.title')}</h2>
            {p.consistency.sessions === 0 && goalTotal === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <div className="stack">
                <div className="row-wrap"><span className="num-lg">{p.consistency.sessions}</span><span>{t('progress.consistency.sessions')}</span></div>
                <TallyMarks total={goalTotal} done={p.consistency.sessions} label={t('progress.consistency.aria', { done: p.consistency.sessions, total: goalTotal })} />
                {p.consistency.sessions === 0 ? <p className="small muted">{t('progress.consistency.none')}</p> : null}
                {p.consistency.weeklyGoal ? <p className="small muted">{t('progress.consistency.goal', { n: p.consistency.weeklyGoal })}</p> : null}
                <h3>{t('progress.consistency.weeks')}</h3>
                <BarChart items={p.consistency.weeks.map((w) => ({ id: w.week, label: weekLabel(w.week), value: w.count }))} ariaLabel={t('progress.consistency.weeksAria')} caption={t('progress.consistency.weeks')} labelHeader={t('progress.week')} valueHeader={t('progress.workouts')} />
              </div>
            )}
          </Card>
        </>
      ) : null}

      <WeightCard rangeDays={DAYS[range]} />

      {p ? (
        <>
          <Card>
            <h2>{t('progress.strength.title')}</h2>
            {minor ? <p className="muted">{t('progress.strength.minor')}</p> : p.strength.length === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <div className="stack">
                <p className="small muted">{t('progress.strength.hint')}</p>
                {strengthRows.slice(0, 2)}
                {strengthRows.length > 2 ? <Disclosure summary={t('progress.showAll', { n: strengthRows.length })}>{strengthRows.slice(2)}</Disclosure> : null}
              </div>
            )}
          </Card>

          <Card>
            <h2>{t('progress.volume.title')}</h2>
            <p className="prog-sec-take">{topGroup ? t('progress.take.volume', { group: t(`label.group.${topGroup}`), n: ltr(String(p.setsByGroup[topGroup] ?? 0)) }) : t('progress.volume.hint')}</p>
            <BarChart items={p.hasSets ? [...GROUPS].sort((a, b) => (p.setsByGroup[b] ?? 0) - (p.setsByGroup[a] ?? 0)).map((g) => ({ id: g, label: t(`label.group.${g}`), value: p.setsByGroup[g] ?? 0 })) : []} ariaLabel={t('progress.volume.aria')} caption={t('progress.volume.title')} labelHeader={t('progress.group')} valueHeader={t('unit.sets')} unit={t('unit.sets')} />
          </Card>

          <Card>
            <h2>{t('progress.nutrition.title')}</h2>
            {p.nutrition.loggedDays === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <div className="grid-stats prog-tiles">
                <StatTile label={t('progress.nutrition.loggedDays')} value={<>{p.nutrition.loggedDays}<small className="muted small"> / {DAYS[range]}</small></>} />
                <StatTile label={t('progress.nutrition.proteinDays')} value={p.nutrition.daysOnProteinTarget} />
                <StatTile label={t('progress.nutrition.avgKcal')} value={p.nutrition.avgKcal ?? '—'} {...(p.nutrition.targetKcal ? { hint: t('progress.nutrition.target', { n: p.nutrition.targetKcal }) } : {})} />
                <StatTile label={t('progress.nutrition.avgProtein')} value={p.nutrition.avgProteinG ?? '—'} {...(p.nutrition.targetProteinG ? { hint: t('progress.nutrition.target', { n: p.nutrition.targetProteinG }) } : {})} />
              </div>
            )}
          </Card>

          <Card>
            <h2>{t('progress.prs.title')}</h2>
            {p.prs.length === 0 ? <p className="muted">{t('state.noData')}</p> : (() => {
              const row = (r: ProgressResponse['prs'][number]): ReactNode => {
                const main = r.maxWeight !== null ? <><span>{fmt.num(r.maxWeight, 2)}</span> <small>{t('unit.kg')}</small></> : r.maxReps !== null ? <><span>{r.maxReps}</span> <small>{t('unit.reps')}</small></> : r.maxDuration !== null ? <><span>{r.maxDuration}</span> <small>{t('unit.sec')}</small></> : null;
                const subs = [r.maxWeight !== null && r.maxReps !== null ? t('progress.prsReps', { n: ltr(String(r.maxReps)) }) : null, r.maxReps === null && r.maxDuration !== null && r.maxWeight !== null ? t('progress.prsHold', { n: ltr(String(r.maxDuration)) }) : null, !minor && r.est1rm !== null ? `${t('progress.prs.est1rm')} ${ltr(fmt.num(r.est1rm, 1))}` : null].filter(Boolean) as string[];
                return (
                  <Link key={r.exerciseId} to={`/exercises/${r.exerciseId}`} className="list-link pr-row">
                    <span className="grow stack-sm"><span className="strong">{nameOfExercise(r.exerciseId, lang)}</span>{subs.length ? <span className="row-wrap tiny muted prog-subs">{subs.map((x) => <span key={x}>{x}</span>)}</span> : null}</span>
                    {r.updatedAt.slice(0, 10) >= from ? <span className="tag">{t('progress.prsRecent')}</span> : null}
                    {main ? <span className="pr-main">{main}</span> : null}
                    <span className="chev"><IconChevron /></span>
                  </Link>
                );
              };
              return <div>{p.prs.slice(0, 5).map(row)}{p.prs.length > 5 ? <Disclosure summary={t('progress.showAll', { n: p.prs.length })}><div>{p.prs.slice(5).map(row)}</div></Disclosure> : null}</div>;
            })()}
          </Card>
        </>
      ) : null}

      <Card>
        <h2>{t('progress.xp.title')}</h2>
        {stats.isLoading ? <SkeletonCard /> : stats.isError ? <ErrorState error={stats.error} onRetry={() => void stats.refetch()} /> : stats.data ? (
          <div className="stack">
            <div className="row-between"><span><span className="muted">{t('progress.xp.level')}</span> <span className="num-lg">{stats.data.level.level}</span></span><span className="small"><span className="num">{stats.data.xp}</span> {t('progress.xp.xp')}</span></div>
            <ProgressBar value={stats.data.level.xpIntoLevel} max={stats.data.level.xpForNext} label={t('progress.xp.bar', { a: stats.data.level.xpIntoLevel, b: stats.data.level.xpForNext })} />
            <p className="small muted">{t('progress.xp.toNext', { n: Math.max(0, stats.data.level.xpForNext - stats.data.level.xpIntoLevel) })}</p>
            <div className="row-between"><h3>{t('progress.ach.title')}</h3><span className="small muted num">{t('progress.unlocked', { a: stats.data.achievements.length, b: stats.data.allAchievementIds.length })}</span></div>
            <ul className="ach-grid">
              {sorted.map((id) => {
                const got = stats.data?.achievements.find((a) => a.id === id);
                return (
                  <li key={id} className={got ? 'ach unlocked' : 'ach'}>
                    <span className="ach-badge" aria-hidden="true">{got ? <IconCheck /> : null}</span>
                    <span className="stack-sm">
                      <strong className="small">{t(`label.achievement.${id}`)}</strong>
                      <span className="tiny muted">{got ? fmt.date(got.unlockedAt, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : t('progress.ach.locked')}</span>
                    </span>
                    {got ? <span className="sr-only">{t('progress.ach.unlockedSr')}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </Card>

      <Card>
        <details className="glossary">
          <summary className="strong">{t('progress.glossary.title')}</summary>
          <dl className="stack-sm">
            {GLOSSARY.map((k) => <div key={k}><dt className="strong">{t(`progress.glossary.${k}.term`)}</dt><dd className="small muted">{t(`progress.glossary.${k}.def`)}</dd></div>)}
          </dl>
        </details>
      </Card>
    </div>
  );
}
