import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { buildDailyMenu, filterReadyWorkouts, rankReadyWorkouts, type ProfileInput, type NutritionTargets, type ReadinessState } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { fmt, useLang } from '../../i18n/index.tsx';
import { DISHES, DISH_BY_ID, EXERCISE_BY_ID, READY_WORKOUTS, exName } from '../../data/content.ts';
import { qk } from '../../app/session.ts';
import { Banner, Button, Card, ErrorState, LinkButton, ProgressBar, Segmented, Toggle, errorMessage } from '../../ui/kit.tsx';
import { TallyMarks } from '../../ui/TallyMarks.tsx';
import { IconCheck, IconChevron } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { dayNumber } from './dates.ts';
import { activePlan, deriveChecklist, nextMenuItem, nextPlanDay, proteinTone, sessionsThisWeek, upperTone, type ChecklistItem, type PlanRow, type SessionRow } from './homeLogic.ts';
import '../../styles/home.css';

export interface ActiveSession { id: string; name: string; exercises: { id: string; sets: unknown[] }[] }
export const useActiveSession = () => useQuery({ queryKey: qk.activeSession, queryFn: () => api.get<{ session: ActiveSession | null }>('/api/sessions/active') });
export const useSessionList = () => useQuery({ queryKey: ['sessions', 'list'], queryFn: () => api.get<{ sessions: SessionRow[] }>('/api/sessions', { limit: 100 }) });
export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => api.get<{ plans: PlanRow[] }>('/api/plans') });
export interface FoodDay { date: string; entries: { slot: string }[]; totals: { kcal: number; proteinG: number; carbsG: number; fatG: number } }
export const useFoodDay = (date: string) => useQuery({ queryKey: ['food-log', date], queryFn: () => api.get<FoodDay>('/api/food-log', { date }) });

const Chev = (): ReactNode => <IconChevron className="flip-rtl" />;

export function ResumeCard({ session }: { session: ActiveSession }): ReactNode {
  const { t } = useLang();
  const done = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  return (
    <Card className="home-resume">
      <div className="row-between row-wrap">
        <div className="stack-sm"><span className="small muted">{t('home.resume.title')}</span><strong>{session.name}</strong><span className="small muted">{t('home.resume.sets', { n: done })}</span></div>
        <LinkButton to="/workouts/session" variant="primary">{t('home.resume.cta')}</LinkButton>
      </div>
    </Card>
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

  if (plans.isLoading || sessions.isLoading) return <Card><p className="muted">{t('app.loading')}</p></Card>;
  if (plans.isError) return <Card><ErrorState error={plans.error} onRetry={() => void plans.refetch()} /></Card>;
  const plan = activePlan(plans.data?.plans ?? []);
  const next = plan ? nextPlanDay(plan, sessions.data?.sessions ?? [], today) : null;

  return (
    <Card>
      <h2>{t('home.today.title')}</h2>
      {plan && next ? (
        <div className="stack">
          <div className="stack-sm">
            <strong>{t(`home.splitDay.${next.day.day}`)}</strong>
            <span className="small muted">{plan.name}</span>
            <span className="row-wrap small"><span><span className="num">{next.day.exercises.length}</span> {t('home.today.exercises')}</span><span><span className="num">{next.day.estimatedMinutes}</span> {t('unit.min')}</span></span>
            <span className="tiny muted">{t('home.today.planDay', { a: next.index + 1, b: next.total })}</span>
          </div>
          <LinkButton to={`/workouts/plans/${plan.id}`} {...(primary ? { variant: 'primary' as const } : {})} block>{t('home.today.open')}</LinkButton>
        </div>
      ) : suggestion ? (
        <div className="stack">
          <p className="small muted">{t('home.today.noPlan')}</p>
          <div className="stack-sm">
            <strong>{lang === 'he' ? suggestion.workout.nameHe : suggestion.workout.nameEn}</strong>
            <span className="row-wrap small"><span><span className="num">{suggestion.personal.items.length}</span> {t('home.today.exercises')}</span><span><span className="num">{suggestion.personal.estimatedMinutes}</span> {t('unit.min')}</span><span>{t(`label.focus.${suggestion.workout.focus}`)}</span></span>
            <span className="tiny muted">{suggestion.personal.items.slice(0, 3).map((i) => { const e = EXERCISE_BY_ID.get(i.exerciseId); return e ? exName(e, lang) : i.exerciseId; }).join(' · ')}</span>
          </div>
          <LinkButton to={`/workouts/ready/${suggestion.workout.id}`} {...(primary ? { variant: 'primary' as const } : {})} block>{t('home.today.open')}</LinkButton>
        </div>
      ) : (
        <div className="stack"><p className="muted">{t('home.today.none')}</p><LinkButton to="/workouts" block>{t('home.today.browse')}</LinkButton></div>
      )}
    </Card>
  );
}

export function ReadinessCard({ today }: { today: string }): ReactNode {
  const { t } = useLang();
  const toast = useToast(); const qc = useQueryClient();
  const [sleep, setSleep] = useState(3); const [energy, setEnergy] = useState(3); const [soreness, setSoreness] = useState(2); const [pain, setPain] = useState(false);
  const existing = useQuery({ queryKey: ['readiness', today], queryFn: () => api.get<{ checkin: { state: ReadinessState } | null }>('/api/readiness', { date: today }) });
  const save = useMutation({
    mutationFn: () => api.post<{ state: ReadinessState }>('/api/readiness', { localDate: today, sleep, energy, soreness, pain }),
    onSuccess: (r) => { qc.setQueryData(['readiness', today], { checkin: { state: r.state } }); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const state = save.data?.state ?? existing.data?.checkin?.state ?? null;
  const opts = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: fmt.num(n) }));
  return (
    <Card>
      <h2>{t('home.readiness.title')}</h2>
      <div className="stack">
        {state ? <Banner tone={state === 'normal' ? 'ok' : 'warn'}><strong>{t(`label.readiness.${state}`)}</strong> <span className="small muted">{t('home.readiness.today')}</span></Banner> : <p className="small muted">{t('home.readiness.hint')}</p>}
        <div className="stack-sm"><span className="small strong">{t('home.readiness.sleep')}</span><Segmented label={t('home.readiness.sleep')} value={String(sleep)} options={opts} onChange={(v) => setSleep(Number(v))} /></div>
        <div className="stack-sm"><span className="small strong">{t('home.readiness.energy')}</span><Segmented label={t('home.readiness.energy')} value={String(energy)} options={opts} onChange={(v) => setEnergy(Number(v))} /></div>
        <div className="stack-sm"><span className="small strong">{t('home.readiness.soreness')}</span><Segmented label={t('home.readiness.soreness')} value={String(soreness)} options={opts} onChange={(v) => setSoreness(Number(v))} /></div>
        <Toggle label={t('home.readiness.pain')} checked={pain} onChange={setPain} />
        <Button disabled={save.isPending} onClick={() => save.mutate()}>{state ? t('home.readiness.update') : t('home.readiness.save')}</Button>
      </div>
    </Card>
  );
}

export function WeekCard({ goal, sessions, today }: { goal: number; sessions: readonly SessionRow[] | undefined; today: string }): ReactNode {
  const { t } = useLang();
  const done = sessions ? sessionsThisWeek(sessions, today).length : 0;
  return (
    <Card>
      <h2>{t('home.week.title')}</h2>
      <div className="stack">
        <div className="row-wrap"><span className="num-lg">{done}</span><span className="muted">/ <span className="num">{goal}</span></span></div>
        <TallyMarks total={Math.max(goal, done)} done={done} label={t('home.week.aria', { done, total: goal })} />
        <p className="small muted">{sessions === undefined ? t('app.loading') : done === 0 ? t('home.week.none') : done >= goal ? t('home.week.goalHit') : t('home.week.left', { n: goal - done })}</p>
      </div>
    </Card>
  );
}

export function NutritionCard({ today, targets }: { today: string; targets: NutritionTargets }): ReactNode {
  const { t } = useLang();
  const q = useFoodDay(today);
  const totals = q.data?.totals ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const rows: { key: string; value: number; target: number; tone: ReturnType<typeof upperTone>; unit: string }[] = [
    { key: 'kcal', value: totals.kcal, target: targets.kcal, tone: upperTone(totals.kcal, targets.kcal), unit: t('unit.kcal') },
    { key: 'protein', value: totals.proteinG, target: targets.proteinG, tone: proteinTone(totals.proteinG, targets.proteinG), unit: t('unit.g') },
    { key: 'carbs', value: totals.carbsG, target: targets.carbsG, tone: upperTone(totals.carbsG, targets.carbsG), unit: t('unit.g') },
    { key: 'fat', value: totals.fatG, target: targets.fatG, tone: upperTone(totals.fatG, targets.fatG), unit: t('unit.g') },
  ];
  return (
    <Card>
      <h2>{t('home.nutrition.title')}</h2>
      {q.isError ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : (
        <div className="stack">
          {q.data && q.data.entries.length === 0 ? <p className="small muted">{t('home.nutrition.none')}</p> : null}
          {rows.map((r) => (
            <div key={r.key} className="stack-sm">
              <div className="row-between"><span className="small strong">{t(`home.nutrition.${r.key}`)}</span><span className="small"><span className="num">{fmt.num(r.value)}</span> / <span className="num">{fmt.num(r.target)}</span> {r.unit}</span></div>
              <ProgressBar value={r.value} max={r.target} label={t(`home.nutrition.${r.key}`)} {...(r.tone ? { tone: r.tone } : {})} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function MenuTeaser({ today, profile, targets }: { today: string; profile: ProfileInput; targets: NutritionTargets }): ReactNode {
  const { t, lang } = useLang();
  const food = useFoodDay(today);
  const menu = useMemo(() => buildDailyMenu(DISHES, { kcal: targets.kcal }, { mealCount: 4, seed: dayNumber(today), diet: profile.diet, restrictions: profile.restrictions, allergies: profile.allergies }), [today, profile, targets.kcal]);
  const logged = new Set((food.data?.entries ?? []).map((e) => e.slot));
  const next = nextMenuItem(menu.items, logged, new Date().getHours());
  const dish = next ? DISH_BY_ID.get(next.dishId) : undefined;
  return (
    <Card>
      <div className="row-between"><h2>{t('home.menu.title')}</h2><LinkButton to="/nutrition/menu" variant="ghost" size="sm">{t('home.menu.open')}<Chev /></LinkButton></div>
      {menu.items.length === 0 ? <p className="muted">{t('home.menu.none')}</p> : next && dish ? (
        <div className="stack-sm">
          <span className="small muted">{t('home.menu.next')}: {t(`label.slot.${next.slot}`)}</span>
          <strong>{lang === 'he' ? dish.nameHe : dish.nameEn}</strong>
          <span className="small muted"><span className="num">{next.kcal}</span> {t('unit.kcal')} · <span className="num">{next.proteinG}</span> {t('unit.g')} {t('home.nutrition.protein')}</span>
        </div>
      ) : <p className="muted">{t('home.menu.allLogged')}</p>}
    </Card>
  );
}

export function XpStrip(): ReactNode {
  const { t } = useLang();
  const q = useQuery({ queryKey: qk.stats, queryFn: () => api.get<{ xp: number; level: { level: number; xpIntoLevel: number; xpForNext: number } }>('/api/stats') });
  if (!q.data) return null;
  const { level } = q.data;
  return (
    <Card>
      <div className="row-between"><span><span className="muted">{t('progress.xp.level')}</span> <span className="num-lg">{level.level}</span></span><span className="small"><span className="num">{q.data.xp}</span> {t('progress.xp.xp')}</span></div>
      <ProgressBar value={level.xpIntoLevel} max={level.xpForNext} label={t('progress.xp.bar', { a: level.xpIntoLevel, b: level.xpForNext })} />
    </Card>
  );
}

export function QuickActions(): ReactNode {
  const { t } = useLang();
  return (
    <Card>
      <h2>{t('home.quick.title')}</h2>
      <div className="grid-2">
        <LinkButton to="/workouts">{t('home.quick.workout')}</LinkButton>
        <LinkButton to="/nutrition/log">{t('home.quick.meal')}</LinkButton>
        <LinkButton to="/progress">{t('home.quick.weigh')}</LinkButton>
        <LinkButton to="/coach">{t('home.quick.coach')}</LinkButton>
      </div>
    </Card>
  );
}

const CHECK_LINK: Record<ChecklistItem['id'], string> = { profile: '/profile', workout: '/workouts', food: '/nutrition/log', weigh: '/progress', coach: '/coach' };
export function Checklist({ items }: { items: ChecklistItem[] }): ReactNode {
  const { t } = useLang();
  if (items.every((i) => i.done)) return null;
  return (
    <Card>
      <h2>{t('home.start.title')}</h2>
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

export function useChecklist(profileDone: boolean, today: string): { items: ChecklistItem[]; ready: boolean } {
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
  return { items, ready };
}
