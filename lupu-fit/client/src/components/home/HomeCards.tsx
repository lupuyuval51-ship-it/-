import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { filterReadyWorkouts, rankReadyWorkouts, type ProfileInput, type NutritionTargets, type ReadinessState } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { fmt, useLang } from '../../i18n/index.tsx';
import { DISHES, DISH_BY_ID, EXERCISE_BY_ID, READY_WORKOUTS, exName } from '../../data/content.ts';
import { qk } from '../../app/session.ts';
import { Button, Card, ErrorState, LinkButton, ProgressBar, Segmented, Tag, Toggle, errorMessage } from '../../ui/kit.tsx';
import { Disclosure, SkeletonCard } from '../../ui/patterns.tsx';
import { TallyMarks } from '../../ui/TallyMarks.tsx';
import { IconCheck, IconChevron } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';
import { menuFor } from '../nutrition/logic.ts';
import { loadChoice } from '../nutrition/menuStore.ts';
import { activePlan, deriveChecklist, nextMenuItem, nextPlanDay, proteinTone, sessionsThisWeek, upperTone, type ChecklistItem, type PlanRow, type SessionRow, type Tone } from './homeLogic.ts';
import '../../styles/home.css';

export interface ActiveSession { id: string; name: string; exercises: { id: string; sets: unknown[] }[] }
export const useActiveSession = () => useQuery({ queryKey: qk.activeSession, queryFn: () => api.get<{ session: ActiveSession | null }>('/api/sessions/active') });
export const useSessionList = () => useQuery({ queryKey: ['sessions', 'list'], queryFn: () => api.get<{ sessions: SessionRow[] }>('/api/sessions', { limit: 100 }) });
/** Same key AND shape as the workouts screens' `usePlans` (an array), so a cache entry written by one screen is valid in the other. */
export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: async () => (await api.get<{ plans: PlanRow[] }>('/api/plans')).plans });
export interface FoodDay { date: string; entries: { slot: string }[]; totals: { kcal: number; proteinG: number; carbsG: number; fatG: number } }
export const useFoodDay = (date: string) => useQuery({ queryKey: ['food-log', date], queryFn: () => api.get<FoodDay>('/api/food-log', { date }) });

const Chev = (): ReactNode => <IconChevron className="flip-rtl" />;

/** The ONE thing to do now: resume the open workout. Owns the screen's orange button. */
export function ResumeCard({ session }: { session: ActiveSession }): ReactNode {
  const { t } = useLang();
  const done = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  return (
    <Card className="hero-card home-hero">
      <div className="stack">
        <div className="stack-sm"><span className="home-eyebrow">{t('home.resume.title')}</span><h2>{session.name}</h2><span className="small muted">{t('home.resume.sets', { n: done })}</span></div>
        <LinkButton to="/workouts/session" variant="primary" block>{t('home.resume.cta')}</LinkButton>
      </div>
    </Card>
  );
}

function Thumbs({ ids }: { ids: readonly string[] }): ReactNode {
  const { lang } = useLang();
  if (ids.length === 0) return null;
  return (
    <ul className="home-thumbs list-reset">
      {ids.slice(0, 4).map((id) => { const e = EXERCISE_BY_ID.get(id); return e ? <li key={id}><ExerciseVideoThumb exerciseId={id} alt={exName(e, lang)} /></li> : null; })}
    </ul>
  );
}

export function TodayWorkoutCard({ profile, primary, today }: { profile: ProfileInput; primary: boolean; today: string }): ReactNode {
  const { t, lang } = useLang();
  const plans = usePlans(); const sessions = useSessionList();
  const suggestion = useMemo(() => {
    const pool = filterReadyWorkouts(READY_WORKOUTS, { place: profile.place, ownedEquipment: profile.equipment });
    const ranked = rankReadyWorkouts(pool, EXERCISE_BY_ID, { age: profile.age, goal: profile.goal, experience: profile.experience, sessionMinutes: profile.sessionMinutes, injuries: profile.injuries, avoidIds: [], equipment: profile.equipment });
    return ranked.ranked[0] ?? null;
  }, [profile]);

  if (plans.isLoading || sessions.isLoading) return <SkeletonCard />;
  // Offline / server down: the plan list is unavailable, but a ready workout is computed locally from the profile, so keep the hero useful.
  if (plans.isError && !suggestion) return <Card><ErrorState error={plans.error} onRetry={() => void plans.refetch()} /></Card>;
  const plan = activePlan(plans.data ?? []);
  const next = plan ? nextPlanDay(plan, sessions.data?.sessions ?? [], today) : null;
  const doneToday = (sessions.data?.sessions ?? []).some((s) => s.localDate === today);
  const variant = primary && !doneToday ? ({ variant: 'primary' as const }) : {};
  const eyebrow = <div className="row-between"><span className="home-eyebrow">{t('home.today.title')}</span>{doneToday ? <Tag tone="success">{t('home.hero.doneToday')}</Tag> : null}</div>;

  if (plan && next) {
    return (
      <Card className="hero-card home-hero">
        <div className="stack">
          <div className="stack-sm">
            {eyebrow}
            <h2>{t(`home.splitDay.${next.day.day}`)}</h2>
            <span className="small muted">{plan.name} · {t('home.today.planDay', { a: next.index + 1, b: next.total })}</span>
            <span className="row-wrap small"><span><span className="num">{next.day.exercises.length}</span> {t('home.today.exercises')}</span><span aria-hidden="true">·</span><span><span className="num">{next.day.estimatedMinutes}</span> {t('unit.min')}</span></span>
          </div>
          <Thumbs ids={next.day.exercises.map((e) => e.exerciseId)} />
          <LinkButton to={`/workouts/plans/${plan.id}`} {...variant} block>{t('home.today.open')}</LinkButton>
        </div>
      </Card>
    );
  }
  if (suggestion) {
    return (
      <Card className="hero-card home-hero">
        <div className="stack">
          <div className="stack-sm">
            {eyebrow}
            <h2>{lang === 'he' ? suggestion.workout.nameHe : suggestion.workout.nameEn}</h2>
            <span className="small muted">{t('home.today.noPlan')}</span>
            <span className="row-wrap small"><span><span className="num">{suggestion.personal.items.length}</span> {t('home.today.exercises')}</span><span aria-hidden="true">·</span><span><span className="num">{suggestion.personal.estimatedMinutes}</span> {t('unit.min')}</span><span aria-hidden="true">·</span><span>{t(`label.focus.${suggestion.workout.focus}`)}</span></span>
          </div>
          <Thumbs ids={suggestion.personal.items.map((i) => i.exerciseId)} />
          <LinkButton to={`/workouts/ready/${suggestion.workout.id}`} {...variant} block>{t('home.today.open')}</LinkButton>
        </div>
      </Card>
    );
  }
  return (
    <Card className="hero-card home-hero">
      <div className="stack"><div className="stack-sm">{eyebrow}<p className="muted">{t('home.today.none')}</p></div><LinkButton to="/workouts" block>{t('home.today.browse')}</LinkButton></div>
    </Card>
  );
}

/**
 * This week's training at a glance: one card with workouts vs the weekly goal, the tally marks and a one-line takeaway.
 * Today's calories and protein live only in the nutrition card, so the same numbers are not shown twice.
 */
export function WeekCard({ goal, sessions, today }: { goal: number; sessions: readonly SessionRow[] | undefined; today: string }): ReactNode {
  const { t } = useLang();
  const done = sessions ? sessionsThisWeek(sessions, today).length : 0;
  return (
    <Card className="stack-sm home-week">
      <span className="small muted">{t('home.kpi.workouts')}</span>
      <div className="home-week-row">
        {/* "done / goal" is one numeric LTR run, so it reads 1 / 4 in both directions. */}
        <span className={done >= goal ? 'num-lg success' : 'num-lg'}>{done}<small className="muted small"> / {goal}</small></span>
        <TallyMarks total={Math.max(goal, done)} done={done} label={t('home.week.aria', { done, total: goal })} />
      </div>
      <p className="small muted">{sessions === undefined ? t('app.loading') : done === 0 ? t('home.week.none') : done >= goal ? t('home.week.goalHit') : t('home.week.left', { n: goal - done })}</p>
    </Card>
  );
}

const PRESETS = { great: { sleep: 4, energy: 4, soreness: 1 }, ok: { sleep: 3, energy: 3, soreness: 2 }, tired: { sleep: 2, energy: 2, soreness: 4 } } as const;

/** One-tap readiness (strong / okay / tired), with the full five-point form tucked into a disclosure. */
export function ReadinessCard({ today }: { today: string }): ReactNode {
  const { t } = useLang();
  const toast = useToast(); const qc = useQueryClient();
  const [sleep, setSleep] = useState(3); const [energy, setEnergy] = useState(3); const [soreness, setSoreness] = useState(2); const [pain, setPain] = useState(false);
  const [editing, setEditing] = useState(false);
  const existing = useQuery({ queryKey: ['readiness', today], queryFn: () => api.get<{ checkin: { state: ReadinessState } | null }>('/api/readiness', { date: today }) });
  const save = useMutation({
    mutationFn: (v: { sleep: number; energy: number; soreness: number; pain: boolean }) => api.post<{ state: ReadinessState }>('/api/readiness', { localDate: today, ...v }),
    onSuccess: (r) => { qc.setQueryData(['readiness', today], { checkin: { state: r.state } }); setEditing(false); toast(t('home.readiness.set'), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const state = save.data?.state ?? existing.data?.checkin?.state ?? null;
  const opts = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: fmt.num(n) }));
  const quick = (k: keyof typeof PRESETS) => save.mutate({ ...PRESETS[k], pain });

  if (existing.isLoading) return <SkeletonCard />;
  if (state && !editing) {
    return (
      <Card>
        <div className="row-between">
          <div className="stack-sm"><span className="small muted">{t('home.readiness.today')}</span><strong className={state === 'normal' ? 'success' : 'warning'}>{t(`label.readiness.${state}`)}</strong></div>
          <Button size="sm" onClick={() => setEditing(true)}>{t('home.readiness.update')}</Button>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="stack">
        <div className="stack-sm"><h2>{t('home.readiness.title')}</h2><p className="small muted">{t('home.readiness.hint')}</p></div>
        <div className="grid-3" role="group" aria-label={t('home.readiness.title')}>
          {(['great', 'ok', 'tired'] as const).map((k) => <Button key={k} disabled={save.isPending} onClick={() => quick(k)}>{t(`home.readiness.${k}`)}</Button>)}
        </div>
        <Disclosure summary={t('home.readiness.details')}>
          <div className="stack-sm"><span className="small strong">{t('home.readiness.sleep')}</span><Segmented label={t('home.readiness.sleep')} value={String(sleep)} options={opts} onChange={(v) => setSleep(Number(v))} /></div>
          <div className="stack-sm"><span className="small strong">{t('home.readiness.energy')}</span><Segmented label={t('home.readiness.energy')} value={String(energy)} options={opts} onChange={(v) => setEnergy(Number(v))} /></div>
          <div className="stack-sm"><span className="small strong">{t('home.readiness.soreness')}</span><Segmented label={t('home.readiness.soreness')} value={String(soreness)} options={opts} onChange={(v) => setSoreness(Number(v))} /></div>
          <Toggle label={t('home.readiness.pain')} checked={pain} onChange={setPain} />
          <Button disabled={save.isPending} onClick={() => save.mutate({ sleep, energy, soreness, pain })}>{state ? t('home.readiness.update') : t('home.readiness.save')}</Button>
        </Disclosure>
      </div>
    </Card>
  );
}

export function NutritionCard({ today, targets, children }: { today: string; targets: NutritionTargets; children?: ReactNode }): ReactNode {
  const { t } = useLang();
  const q = useFoodDay(today);
  const totals = q.data?.totals ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const rows: { key: string; value: number; target: number; tone: Tone; unit: string }[] = [
    { key: 'kcal', value: totals.kcal, target: targets.kcal, tone: upperTone(totals.kcal, targets.kcal), unit: t('unit.kcal') },
    { key: 'protein', value: totals.proteinG, target: targets.proteinG, tone: proteinTone(totals.proteinG, targets.proteinG), unit: t('unit.g') },
  ];
  const empty = !!q.data && q.data.entries.length === 0;
  return (
    <Card>
      <div className="stack">
        <div className="row-between"><h2>{t('home.nutrition.title')}</h2><LinkButton to="/nutrition/log" variant="ghost" size="sm" className="accent">{t('home.logMeal')}<Chev /></LinkButton></div>
        {q.isError ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : (
          <div className="stack">
            {empty ? <p className="small muted">{t('home.nutrition.none')}</p> : null}
            {rows.map((r) => (
              <div key={r.key} className="stack-sm">
                <div className="row-between"><span className="small strong">{t(`home.nutrition.${r.key}`)}</span><span className="small"><span className="num">{fmt.num(r.value)} / {fmt.num(r.target)}</span> {r.unit}</span></div>
                <ProgressBar value={r.value} max={r.target} label={t(`home.nutrition.${r.key}`)} {...(r.tone ? { tone: r.tone } : {})} />
              </div>
            ))}
            <p className="tiny muted">{t('home.macros', { c: fmt.num(totals.carbsG), f: fmt.num(totals.fatG) })}</p>
          </div>
        )}
        {children}
      </div>
    </Card>
  );
}

export function MenuTeaser({ today, profile, targets, embedded }: { today: string; profile: ProfileInput; targets: NutritionTargets; embedded?: boolean }): ReactNode {
  const { t, lang } = useLang();
  const food = useFoodDay(today);
  // Same builder, seed and stored choice (meal count, 'generate again', swaps) as /nutrition/menu, so both name the same dishes.
  const menu = useMemo(() => menuFor(DISHES, targets.kcal, today, loadChoice(today), { diet: profile.diet, restrictions: profile.restrictions, allergies: profile.allergies }), [today, profile, targets.kcal]);
  const logged = new Set((food.data?.entries ?? []).map((e) => e.slot));
  const next = nextMenuItem(menu.items, logged, new Date().getHours());
  const dish = next ? DISH_BY_ID.get(next.dishId) : undefined;
  const body = (
    <div className="stack-sm">
      <div className="row-between"><h3>{t('home.menu.title')}</h3><LinkButton to="/nutrition/menu" variant="ghost" size="sm" className="accent">{t('home.menu.open')}<Chev /></LinkButton></div>
      {menu.items.length === 0 ? <p className="muted">{t('home.menu.none')}</p> : next && dish ? (
        <>
          <span className="small muted">{t('home.menu.next')}: {t(`label.slot.${next.slot}`)}</span>
          <strong>{lang === 'he' ? dish.nameHe : dish.nameEn}</strong>
          <span className="small muted"><span className="num">{next.kcal}</span> {t('unit.kcal')} · <span className="num">{next.proteinG}</span> {t('unit.g')} {t('home.nutrition.protein')}</span>
        </>
      ) : <p className="muted">{t('home.menu.allLogged')}</p>}
    </div>
  );
  return embedded ? <div className="home-menu">{body}</div> : <Card>{body}</Card>;
}

export function XpStrip(): ReactNode {
  const { t } = useLang();
  const q = useQuery({ queryKey: qk.stats, queryFn: () => api.get<{ xp: number; level: { level: number; xpIntoLevel: number; xpForNext: number } }>('/api/stats') });
  if (!q.data) return null;
  const { level } = q.data;
  return (
    <Link to="/progress" className="card card-link home-xp">
      <div className="row-between"><span><span className="muted small">{t('progress.xp.level')}</span> <span className="num-lg">{level.level}</span></span><span className="small"><span className="num">{q.data.xp}</span> {t('progress.xp.xp')}</span></div>
      <ProgressBar value={level.xpIntoLevel} max={level.xpForNext} label={t('progress.xp.bar', { a: level.xpIntoLevel, b: level.xpForNext })} />
    </Link>
  );
}

export function QuickActions(): ReactNode {
  const { t } = useLang();
  return (
    <Card>
      <h2>{t('home.quick.title')}</h2>
      <nav className="home-quick" aria-label={t('home.quick.title')}>
        <Link className="list-link" to="/progress">{t('home.quick.weigh')}<span className="chev"><IconChevron /></span></Link>
        <Link className="list-link" to="/coach">{t('home.quick.coach')}<span className="chev"><IconChevron /></span></Link>
      </nav>
    </Card>
  );
}

const CHECK_LINK: Record<ChecklistItem['id'], string> = { profile: '/profile', workout: '/workouts', food: '/nutrition/log', weigh: '/progress', coach: '/coach' };
export function Checklist({ items }: { items: ChecklistItem[] }): ReactNode {
  const { t } = useLang();
  if (items.every((i) => i.done)) return null;
  const doneN = items.filter((i) => i.done).length;
  return (
    <Card>
      <div className="row-between"><h2>{t('home.start.title')}</h2><span className="small muted">{t('home.start.progress', { a: doneN, b: items.length })}</span></div>
      <ul className="list">
        {items.map((i) => (
          <li key={i.id}>
            <span className={i.done ? 'check done' : 'check'} role="img" aria-label={i.done ? t('home.start.done') : t('home.start.todo')}>{i.done ? <IconCheck /> : null}</span>
            {i.done ? <span className="grow muted">{t(`home.start.${i.id}`)}</span> : <Link className="grow" to={CHECK_LINK[i.id]}>{t(`home.start.${i.id}`)}</Link>}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** `isNew`: the checklist is onboarding help, so it disappears once the user has a few finished workouts. */
export function useChecklist(profileDone: boolean, today: string): { items: ChecklistItem[]; ready: boolean; isNew: boolean } {
  const sessions = useSessionList();
  const food = useFoodDay(today);
  const weights = useQuery({ queryKey: ['weights', 'count'], queryFn: () => api.get<{ entries: unknown[] }>('/api/weights', { days: 3650 }) });
  const threads = useQuery({ queryKey: ['coach-threads'], queryFn: () => api.get<{ threads: unknown[] }>('/api/coach/threads') });
  const stats = useQuery({ queryKey: qk.stats, queryFn: () => api.get<{ achievements: { id: string }[] }>('/api/stats') });
  const ready = [sessions, food, weights, threads, stats].every((q) => q.isSuccess);
  const items = deriveChecklist({
    profileDone, sessionCount: sessions.data?.sessions.length ?? 0, foodEntriesToday: food.data?.entries.length ?? 0,
    weighIns: weights.data?.entries.length ?? 0, coachThreads: threads.data?.threads.length ?? 0, achievementIds: stats.data?.achievements.map((a) => a.id) ?? [],
  });
  return { items, ready, isNew: (sessions.data?.sessions.length ?? 0) < 3 };
}
