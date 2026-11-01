import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ageBucket, type MuscleGroup } from '@lupu-fit/shared';
import { api } from '../api/client.ts';
import { fmt, useLang } from '../i18n/index.tsx';
import { nameOfExercise } from '../data/content.ts';
import { useProfile } from '../app/session.ts';
import { Card, ErrorState, Loading, ProgressBar, Segmented, Tag } from '../ui/kit.tsx';
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

export default function Progress(): ReactNode {
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('range');
  const range: Range = RANGES.includes(raw as Range) ? (raw as Range) : '30d';
  const profile = useProfile().data?.profile ?? null;
  const minor = profile ? ageBucket(profile.age) === 'minor' : false;
  const progress = useQuery({ queryKey: ['progress', range], queryFn: () => api.get<ProgressResponse>('/api/progress', { range }) });
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api.get<StatsResponse>('/api/stats') });

  const p = progress.data;
  const rangeLabel = (r: Range) => t(`date.days.d${DAYS[r]}`);
  const goalTotal = p ? Math.max(p.consistency.sessions, p.consistency.weeklyGoal ? Math.round((p.consistency.weeklyGoal * DAYS[range]) / 7) : 0) : 0;

  return (
    <div className="stack-lg">
      <div className="row-between row-wrap">
        <h1>{t('nav.progress')}</h1>
        <Segmented label={t('progress.range')} value={range} options={RANGES.map((r) => ({ value: r, label: rangeLabel(r) }))} onChange={(r) => setSp({ range: r }, { replace: true })} />
      </div>

      {progress.isLoading ? <Loading /> : progress.isError ? <ErrorState error={progress.error} onRetry={() => void progress.refetch()} /> : p ? (
        <>
          <Card>
            <h2>{t('progress.consistency.title')}</h2>
            {p.consistency.sessions === 0 && goalTotal === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <div className="stack">
                <div className="row-wrap"><span className="num-lg">{p.consistency.sessions}</span><span>{t('progress.consistency.sessions', { n: p.consistency.sessions })}</span></div>
                <TallyMarks total={goalTotal} done={p.consistency.sessions} label={t('progress.consistency.aria', { done: p.consistency.sessions, total: goalTotal })} />
                {p.consistency.sessions === 0 ? <p className="small muted">{t('progress.consistency.none')}</p> : null}
                {p.consistency.weeklyGoal ? <p className="small muted">{t('progress.consistency.goal', { n: p.consistency.weeklyGoal })}</p> : null}
                <h3>{t('progress.consistency.weeks')}</h3>
                <BarChart items={p.consistency.weeks.map((w) => ({ id: w.week, label: w.week, value: w.count }))} ariaLabel={t('progress.consistency.weeksAria')} caption={t('progress.consistency.weeks')} labelHeader={t('progress.week')} valueHeader={t('progress.workouts')} />
              </div>
            )}
          </Card>

          <Card>
            <h2>{t('progress.volume.title')}</h2>
            <p className="small muted">{t('progress.volume.hint')}</p>
            <BarChart items={p.hasSets ? GROUPS.map((g) => ({ id: g, label: t(`label.group.${g}`), value: p.setsByGroup[g] ?? 0 })) : []} ariaLabel={t('progress.volume.aria')} caption={t('progress.volume.title')} labelHeader={t('progress.group')} valueHeader={t('unit.sets')} />
          </Card>

          <Card>
            <h2>{t('progress.strength.title')}</h2>
            {minor ? <p className="muted">{t('progress.strength.minor')}</p> : p.strength.length === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <div className="stack">
                <p className="small muted">{t('progress.strength.hint')}</p>
                {p.strength.map((s) => {
                  const nm = nameOfExercise(s.exerciseId, lang);
                  return (
                    <div key={s.exerciseId} className="stack-sm">
                      <Link to={`/exercises/${s.exerciseId}`} className="strong">{nm}</Link>
                      <LineChart series={[{ id: s.exerciseId, label: nm, points: s.points.map((x) => ({ x: x.date, y: x.est1rm })) }]} ariaLabel={t('progress.strength.aria', { name: nm, from: String(s.points[0]?.est1rm), to: String(s.points[s.points.length - 1]?.est1rm) })} caption={nm} xHeader={t('progress.date')} unit={t('unit.kg')} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      ) : null}

      <WeightCard rangeDays={DAYS[range]} />

      {p ? (
        <>
          <Card>
            <h2>{t('progress.nutrition.title')}</h2>
            {p.nutrition.loggedDays === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <div className="stack">
                <dl className="grid-2">
                  <div className="kpi"><dt className="label">{t('progress.nutrition.loggedDays')}</dt><dd><span className="num-lg">{p.nutrition.loggedDays}</span> <span className="small muted">/ <span className="num">{DAYS[range]}</span></span></dd></div>
                  <div className="kpi"><dt className="label">{t('progress.nutrition.proteinDays')}</dt><dd><span className="num-lg">{p.nutrition.daysOnProteinTarget}</span></dd></div>
                  <div className="kpi"><dt className="label">{t('progress.nutrition.avgKcal')}</dt><dd><span className="num-lg">{p.nutrition.avgKcal ?? '—'}</span>{p.nutrition.targetKcal ? <span className="small muted"> {t('progress.nutrition.target', { n: p.nutrition.targetKcal })}</span> : null}</dd></div>
                  <div className="kpi"><dt className="label">{t('progress.nutrition.avgProtein')}</dt><dd><span className="num-lg">{p.nutrition.avgProteinG ?? '—'}</span>{p.nutrition.targetProteinG ? <span className="small muted"> {t('progress.nutrition.target', { n: p.nutrition.targetProteinG })}</span> : null}</dd></div>
                </dl>
              </div>
            )}
          </Card>

          <Card>
            <h2>{t('progress.prs.title')}</h2>
            {p.prs.length === 0 ? <p className="muted">{t('state.noData')}</p> : (
              <ul className="list">
                {p.prs.map((r) => (
                  <li key={r.exerciseId} className="pr-row">
                    <Link to={`/exercises/${r.exerciseId}`} className="grow strong">{nameOfExercise(r.exerciseId, lang)}</Link>
                    <span className="row-wrap small">
                      {r.maxWeight !== null ? <Tag><span className="num">{fmt.num(r.maxWeight, 2)}</span>&nbsp;{t('unit.kg')}</Tag> : null}
                      {r.maxReps !== null ? <Tag><span className="num">{r.maxReps}</span>&nbsp;{t('unit.reps')}</Tag> : null}
                      {r.maxDuration !== null ? <Tag><span className="num">{r.maxDuration}</span>&nbsp;{t('unit.sec')}</Tag> : null}
                      {!minor && r.est1rm !== null ? <Tag>{t('progress.prs.est1rm')}&nbsp;<span className="num">{fmt.num(r.est1rm, 1)}</span></Tag> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      ) : null}

      <Card>
        <h2>{t('progress.xp.title')}</h2>
        {stats.isLoading ? <Loading /> : stats.isError ? <ErrorState error={stats.error} onRetry={() => void stats.refetch()} /> : stats.data ? (
          <div className="stack">
            <div className="row-between"><span><span className="muted">{t('progress.xp.level')}</span> <span className="num-lg">{stats.data.level.level}</span></span><span className="small"><span className="num">{stats.data.xp}</span> {t('progress.xp.xp')}</span></div>
            <ProgressBar value={stats.data.level.xpIntoLevel} max={stats.data.level.xpForNext} label={t('progress.xp.bar', { a: stats.data.level.xpIntoLevel, b: stats.data.level.xpForNext })} />
            <p className="small muted">{t('progress.xp.toNext', { n: Math.max(0, stats.data.level.xpForNext - stats.data.level.xpIntoLevel) })}</p>
            <h3>{t('progress.ach.title')}</h3>
            <ul className="ach-grid">
              {stats.data.allAchievementIds.map((id) => {
                const got = stats.data?.achievements.find((a) => a.id === id);
                return (
                  <li key={id} className={got ? 'ach unlocked' : 'ach'}>
                    <strong className="small">{t(`label.achievement.${id}`)}</strong>
                    <span className="tiny muted">{got ? fmt.date(got.unlockedAt, lang, { day: 'numeric', month: 'short', year: 'numeric' }) : t('progress.ach.locked')}</span>
                    <span className="sr-only">{got ? t('progress.ach.unlockedSr') : t('progress.ach.lockedSr')}</span>
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
