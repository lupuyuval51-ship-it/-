import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ageBucket, EQUIPMENT, LIMITS, type ExerciseDef, type GeneratedPlan, type SwapContext } from '@lupu-fit/shared';
import { api, ApiRequestError } from '../api/client.ts';
import { qk, useProfile } from '../app/session.ts';
import { EXERCISE_BY_ID, nameOfExercise } from '../data/content.ts';
import { useLang } from '../i18n/index.tsx';
import {
  addExercise, applyProgression, buildSessionPayload, editPrescription, localDateStr, moveExercise, planToSessionItems, prescriptionForSwap, removeExercise, swapExercise,
  type ExerciseHistory, type ProgressionChange,
} from '../lib/workoutCompose.ts';
import { Banner, Button, Card, EmptyState, ErrorState, IconButton, Loading, Tabs, Tag, errorMessage } from '../ui/kit.tsx';
import { IconChevron, IconTrash } from '../ui/icons.tsx';
import { useToast } from '../ui/toast.tsx';
import { ExerciseLine, PrescriptionLine } from '../components/workouts/ExerciseLine.tsx';
import { PlanNotes } from '../components/workouts/PlanPreview.tsx';
import { AddSheet, EditSheet, SwapSheet } from '../components/workouts/PlanSheets.tsx';
import { PLANS_KEY, usePlans } from '../components/workouts/plansApi.ts';
import '../styles/workouts.css';

const CATALOG = EXERCISE_BY_ID as ReadonlyMap<string, ExerciseDef>;

export default function PlanDetail(): ReactNode {
  const { t, lang } = useLang();
  const { planId = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const plans = usePlans();
  const prof = useProfile();
  const [dayIdx, setDayIdx] = useState(0);
  const [draft, setDraft] = useState<GeneratedPlan | null>(null);
  const [swap, setSwap] = useState<number | null>(null);
  const [edit, setEdit] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [progress, setProgress] = useState<{ changes: ProgressionChange[]; withoutHistory: number; checked: number } | null>(null);
  const [conflict, setConflict] = useState(false);

  const row = plans.data?.find((p) => p.id === planId) ?? null;
  const profile = prof.data?.profile ?? null;
  const plan: GeneratedPlan | null = draft ?? row?.plan ?? null;

  const ctx: SwapContext | null = useMemo(() => (profile ? {
    injuries: profile.injuries, avoidIds: [], available: profile.place === 'gym' ? [...EQUIPMENT] : profile.equipment, bucket: ageBucket(profile.age), mode: 'weights', maxDifficulty: profile.experience,
  } : null), [profile]);

  const persist = useMutation({
    mutationFn: async (next: GeneratedPlan) => { await api.put(`/api/plans/${planId}/plan`, { plan: next }); return next; },
    onSuccess: () => { setDraft(null); void qc.invalidateQueries({ queryKey: PLANS_KEY }); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const act = useMutation({
    mutationFn: async (kind: 'activate' | 'archive' | 'restore' | 'duplicate') => {
      if (kind === 'activate') await api.post(`/api/plans/${planId}/activate`);
      else if (kind === 'archive') await api.patch(`/api/plans/${planId}`, { archived: true });
      else if (kind === 'restore') await api.patch(`/api/plans/${planId}`, { archived: false });
      else return { kind, id: (await api.post<{ id: string }>(`/api/plans/${planId}/duplicate`)).id };
      return { kind, id: null };
    },
    onSuccess: ({ kind, id }) => {
      void qc.invalidateQueries({ queryKey: PLANS_KEY });
      toast(t({ activate: 'workouts.plan.activated', archive: 'workouts.plan.archivedToast', restore: 'workouts.plan.restored', duplicate: 'workouts.plan.duplicated' }[kind]), 'ok');
      if (id) nav(`/workouts/plans/${id}`);
    },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const prog = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error('no_plan');
      const ids = [...new Set(plan.days.flatMap((d) => d.exercises.map((e) => e.exerciseId)))].filter((id) => CATALOG.get(id)?.externallyLoaded);
      const histories = new Map<string, ExerciseHistory[]>();
      await Promise.all(ids.map(async (id) => { histories.set(id, (await api.get<{ history: ExerciseHistory[] }>(`/api/exercises/${id}/history`, { limit: 3 })).history); }));
      const out = applyProgression(plan, histories, CATALOG);
      if (out.changes.length > 0) await api.put(`/api/plans/${planId}/plan`, { plan: out.plan });
      return { out, checked: ids.length };
    },
    onSuccess: ({ out, checked }) => {
      setProgress({ changes: out.changes, withoutHistory: out.withoutHistory, checked });
      if (out.changes.length > 0) { setDraft(null); void qc.invalidateQueries({ queryKey: PLANS_KEY }); }
    },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const start = useMutation({
    mutationFn: async () => {
      if (!plan || !row) throw new Error('no_plan');
      const day = plan.days[dayIdx]!;
      return api.post('/api/sessions', buildSessionPayload({ name: `${row.name}: ${t(`workouts.day.${day.day}`)}`, source: 'plan', sourceId: `${row.id}:${dayIdx}`, localDate: localDateStr(), items: planToSessionItems(day) }));
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: qk.activeSession }); nav('/workouts/session'); },
    onError: (e) => { if (e instanceof ApiRequestError && e.status === 409 && e.code === 'session_in_progress') setConflict(true); else toast(errorMessage(e, t), 'error'); },
  });

  if (plans.isLoading || prof.isLoading) return <Loading />;
  if (plans.isError) return <ErrorState error={plans.error} onRetry={() => void plans.refetch()} />;
  if (!row || !plan) return <div className="stack"><Link to="/workouts">{t('workouts.plan.back')}</Link><ErrorState error={{ code: 'not_found' }} /></div>;

  const day = plan.days[Math.min(dayIdx, plan.days.length - 1)]!;
  const di = Math.min(dayIdx, plan.days.length - 1);
  const edit1 = (fn: (p: GeneratedPlan) => GeneratedPlan) => { setDraft(fn(plan)); setProgress(null); };
  const swapEx = swap !== null ? day.exercises[swap] : undefined;
  const editEx = edit !== null ? day.exercises[edit] : undefined;

  return (
    <div className="stack">
      <Link to="/workouts">{t('workouts.plan.back')}</Link>
      <div className="wk-head">
        <h1>{row.name}</h1>
        <div className="row-wrap">{row.active ? <Tag tone="success">{t('workouts.plan.activeBadge')}</Tag> : null}{row.archived ? <Tag>{t('workouts.plan.archivedBadge')}</Tag> : null}</div>
      </div>
      <div className="wk-actions">
        {row.archived ? <Button size="sm" disabled={act.isPending} onClick={() => act.mutate('restore')}>{t('workouts.plan.restore')}</Button> : (
          <>
            {row.active ? null : <Button size="sm" disabled={act.isPending} onClick={() => act.mutate('activate')}>{t('workouts.plan.activate')}</Button>}
            <Button size="sm" disabled={act.isPending} onClick={() => act.mutate('archive')}>{t('workouts.plan.archive')}</Button>
          </>
        )}
        <Button size="sm" disabled={act.isPending} onClick={() => act.mutate('duplicate')}>{t('workouts.plan.duplicate')}</Button>
        <Button size="sm" disabled={prog.isPending || !plan.days.length} onClick={() => prog.mutate()}>{prog.isPending ? t('workouts.plan.progressionBusy') : t('workouts.plan.progression')}</Button>
      </div>

      {progress ? <ProgressionResult progress={progress} /> : null}
      {!profile ? <Banner tone="warn">{t('workouts.plan.needProfile')}</Banner> : null}

      <Tabs label={t('workouts.plan.daysTab')} value={String(di)} onChange={(v) => setDayIdx(Number(v))} tabs={plan.days.map((_, i) => ({ value: String(i), label: t('workouts.day.n', { n: i + 1 }) }))} />
      <Card className="wk-day">
        <div className="wk-day-title">
          <h2>{t('workouts.plan.dayTitle', { n: di + 1, name: t(`workouts.day.${day.day}`) })}</h2>
          <span className="small muted">{t('workouts.plan.estimate', { n: day.estimatedMinutes })}</span>
        </div>
        {day.exercises.length === 0 ? <EmptyState title={t('workouts.plan.empty')} /> : (
          <ul className="wk-ex-list">
            {day.exercises.map((e, i) => (
              <li key={`${e.exerciseId}-${i}`}>
                <ExerciseLine exerciseId={e.exerciseId} actions={(
                  <div className="wk-ex-tools">
                    <IconButton label={`${t('workouts.plan.moveUp')}: ${nameOfExercise(e.exerciseId, lang)}`} disabled={i === 0} onClick={() => edit1((p) => moveExercise(p, di, i, i - 1))}><IconChevron className="rot-up" /></IconButton>
                    <IconButton label={`${t('workouts.plan.moveDown')}: ${nameOfExercise(e.exerciseId, lang)}`} disabled={i === day.exercises.length - 1} onClick={() => edit1((p) => moveExercise(p, di, i, i + 1))}><IconChevron className="rot-down" /></IconButton>
                    <Button size="sm" disabled={!ctx} onClick={() => setSwap(i)}>{t('workouts.plan.swap')}</Button>
                    <Button size="sm" onClick={() => setEdit(i)}>{t('workouts.plan.edit')}</Button>
                    <IconButton label={`${t('workouts.plan.remove')}: ${nameOfExercise(e.exerciseId, lang)}`} disabled={day.exercises.length <= 1} title={day.exercises.length <= 1 ? t('workouts.plan.removeLast') : t('workouts.plan.remove')} onClick={() => edit1((p) => removeExercise(p, di, i))}><IconTrash /></IconButton>
                  </div>
                )}>
                  <PrescriptionLine p={e.prescription} />
                </ExerciseLine>
              </li>
            ))}
          </ul>
        )}
        <div className="wk-actions">
          <Button disabled={!ctx || day.exercises.length >= LIMITS.maxExercisesPerWorkout} onClick={() => setAdding(true)}>{day.exercises.length >= LIMITS.maxExercisesPerWorkout ? t('workouts.plan.maxReached') : t('workouts.plan.addExercise')}</Button>
        </div>
      </Card>

      {conflict ? <Banner tone="warn">{t('workouts.detail.inProgress')} <Link to="/workouts/session">{t('workouts.detail.resume')}</Link></Banner> : null}
      <PlanNotes notes={plan.notes} />

      {draft ? (
        <div className="wk-savebar" role="status">
          <span>{t('workouts.plan.unsaved')}</span>
          <div className="wk-actions">
            <Button disabled={persist.isPending} onClick={() => persist.mutate(draft, { onSuccess: () => toast(t('workouts.plan.savedToast'), 'ok') })}>{t('workouts.plan.saveChanges')}</Button>
            <Button variant="ghost" disabled={persist.isPending} onClick={() => setDraft(null)}>{t('workouts.plan.discard')}</Button>
          </div>
        </div>
      ) : null}

      <div><Button variant="primary" block disabled={start.isPending || day.exercises.length === 0} onClick={() => { setConflict(false); start.mutate(); }}>{start.isPending ? t('workouts.plan.starting') : t('workouts.plan.startDay')}</Button></div>

      {ctx ? <SwapSheet open={swap !== null} onClose={() => setSwap(null)} exerciseId={swapEx?.exerciseId ?? null} ctx={ctx} onSwap={(id) => {
        const to = CATALOG.get(id); const from = swapEx;
        if (to && from && swap !== null) { edit1((p) => swapExercise(p, di, swap, id, prescriptionForSwap(from.prescription, to))); toast(t('workouts.plan.swapped'), 'ok'); }
        setSwap(null);
      }} /> : null}
      <EditSheet open={edit !== null} onClose={() => setEdit(null)} exerciseId={editEx?.exerciseId ?? null} value={editEx?.prescription ?? null} onChange={(patch) => edit !== null && edit1((p) => editPrescription(p, di, edit, patch))} />
      {ctx && profile ? <AddSheet open={adding} onClose={() => setAdding(false)} ctx={ctx} person={profile} onAdd={(id, presc) => { edit1((p) => addExercise(p, di, id, presc)); toast(t('workouts.plan.added'), 'ok'); setAdding(false); }} /> : null}
    </div>
  );
}

function ProgressionResult({ progress }: { progress: { changes: ProgressionChange[]; withoutHistory: number; checked: number } }): ReactNode {
  const { t, lang } = useLang();
  const { changes, withoutHistory, checked } = progress;
  const noHistoryAtAll = changes.length === 0 && withoutHistory >= checked;
  return (
    <Banner tone={changes.length ? 'ok' : undefined}>
      <div className="stack-sm">
        <strong>{changes.length ? t('workouts.plan.progressionApplied', { n: changes.length }) : noHistoryAtAll ? t('workouts.plan.progressionNone') : t('workouts.plan.progressionHold')}</strong>
        {changes.length ? (
          <ul className="wk-note-list small">
            {changes.map((c, i) => <li key={i}>{t('workouts.plan.progressionChange', { name: nameOfExercise(c.exerciseId, lang), from: c.from ?? t('workouts.plan.progressionNoPrev'), to: c.to })} ({t(c.action === 'increase' ? 'workouts.plan.increase' : 'workouts.plan.deload')})</li>)}
          </ul>
        ) : null}
        {withoutHistory > 0 && !noHistoryAtAll ? <span className="small">{t('workouts.plan.progressionNoHistory', { n: withoutHistory })}</span> : null}
      </div>
    </Banner>
  );
}
