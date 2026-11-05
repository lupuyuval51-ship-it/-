import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ageBucket, EQUIPMENT, personalizeReadyWorkout, type Equipment, type ExerciseDef, type FinisherVariant, type ReadinessState, type Sport } from '@lupu-fit/shared';
import { api, ApiRequestError } from '../api/client.ts';
import { qk, useMe, useProfile } from '../app/session.ts';
import { EXERCISE_BY_ID, FINISHERS, READY_BY_ID, nameOfExercise } from '../data/content.ts';
import { useLang } from '../i18n/index.tsx';
import {
  buildSessionPayload, defaultVariant, localDateStr, lastWorkingLoad, missingFinisherGear, personProfile, pickFinisher, type ExerciseHistory,
} from '../lib/workoutCompose.ts';
import { Banner, Button, Card, ErrorState, LinkButton, Tag, errorMessage } from '../ui/kit.tsx';
import { Disclosure, PageHeader, SkeletonCard, SkeletonList, StatTile, StickyAction } from '../ui/patterns.tsx';
import { useToast } from '../ui/toast.tsx';
import { ExerciseLine, PrescriptionLine } from '../components/workouts/ExerciseLine.tsx';
import { FinisherPicker, readSport, writeSport } from '../components/workouts/FinisherPicker.tsx';
import { ReadinessCheckin, readinessKey, type Checkin } from '../components/workouts/ReadinessCheckin.tsx';
import '../styles/workouts.css';

const CATALOG = EXERCISE_BY_ID as ReadonlyMap<string, ExerciseDef>;

export default function ReadyDetail(): ReactNode {
  const { t, lang } = useLang();
  const { readyId = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const workout = READY_BY_ID.get(readyId);
  const me = useMe();
  const prof = useProfile();
  const date = useMemo(() => localDateStr(), []);
  const userId = me.data?.user.id ?? '_';

  const checkinQ = useQuery({ queryKey: readinessKey(date), queryFn: async () => (await api.get<{ checkin: Checkin | null }>('/api/readiness', { date })).checkin, retry: false });
  const checkin = checkinQ.data ?? null;
  const readiness: ReadinessState = checkin?.state ?? 'normal';

  const profile = prof.data?.profile ?? null;
  const owned: Equipment[] = useMemo(() => (!profile ? [] : profile.place === 'gym' ? [...EQUIPMENT] : [...profile.equipment]), [profile]);
  const person = useMemo(() => (profile && workout ? personProfile(profile, workout.place === 'gym' ? [...EQUIPMENT] : [...new Set([...profile.equipment, ...workout.equipment])]) : null), [profile, workout]);

  // First pass without loads only decides which (possibly swapped) exercises need a last-weight lookup.
  const firstPass = useMemo(() => (workout && person ? personalizeReadyWorkout(workout, CATALOG, person, { readiness }) : null), [workout, person, readiness]);
  const loadIds = useMemo(() => {
    if (!workout || !firstPass) return [];
    return [...new Set([...workout.exerciseIds, ...firstPass.items.map((i) => i.exerciseId)])].filter((id) => EXERCISE_BY_ID.get(id)?.externallyLoaded);
  }, [workout, firstPass]);
  const histories = useQueries({
    queries: loadIds.map((id) => ({ queryKey: ['exercise-history', id], retry: false, staleTime: 60_000, queryFn: async () => (await api.get<{ history: ExerciseHistory[] }>(`/api/exercises/${id}/history`, { limit: 3 })).history })),
  });
  const lastLoads = useMemo(() => {
    const m = new Map<string, number>();
    loadIds.forEach((id, i) => { const l = lastWorkingLoad(histories[i]?.data ?? []); if (l !== null) m.set(id, l); });
    return m;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadIds, histories.map((h) => h.dataUpdatedAt).join(',')]);
  const personal = useMemo(() => (workout && person ? personalizeReadyWorkout(workout, CATALOG, person, { readiness, lastLoads }) : null), [workout, person, readiness, lastLoads]);

  const [sport, setSportState] = useState<Sport | null>(null);
  const [variantChoice, setVariantChoice] = useState<FinisherVariant | null>(null);
  useEffect(() => { if (me.data) setSportState(readSport(me.data.user.id)); }, [me.data]);
  const setSport = (s: Sport | null) => { setSportState(s); writeSport(userId, s); };

  const variant: FinisherVariant = useMemo(() => {
    const fallback = profile ? defaultVariant(profile.age, profile.injuries) : 'bodyweight';
    const v = variantChoice ?? fallback;
    if (v === 'gear' && sport) { const f = pickFinisher(FINISHERS, sport, 'gear'); if (f && missingFinisherGear(f, CATALOG, owned).length) return fallback; }
    return v;
  }, [variantChoice, profile, sport, owned]);
  const finisher = sport ? pickFinisher(FINISHERS, sport, variant) : null;

  const [conflict, setConflict] = useState(false);
  const start = useMutation({
    mutationFn: async () => {
      if (!workout || !personal) throw new Error('not_ready');
      const body = buildSessionPayload({
        name: lang === 'he' ? workout.nameHe : workout.nameEn, source: 'ready', sourceId: workout.id, localDate: localDateStr(), readiness: checkin ? checkin.state : null,
        items: personal.items.map((i) => ({ exerciseId: i.exerciseId, prescription: i.prescription })), finisher,
      });
      return api.post('/api/sessions', body);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: qk.activeSession }); nav('/workouts/session'); },
    onError: (e) => {
      if (e instanceof ApiRequestError && e.status === 409 && e.code === 'session_in_progress') setConflict(true);
      else toast(errorMessage(e, t), 'error');
    },
  });

  const BACK = '/workouts?tab=ready';
  if (!workout) return <div className="stack"><PageHeader back={BACK} title={t('workouts.tabs.ready')} /><ErrorState error={{ code: 'not_found' }} /></div>;
  const name = lang === 'he' ? workout.nameHe : workout.nameEn;
  // The name is static content, so the header is there from the first frame; the skeleton mirrors the stat row and exercise list.
  const header = <PageHeader back={BACK} title={name} />;
  if (prof.isLoading || me.isLoading) return <div className="stack">{header}<SkeletonCard /><SkeletonList rows={4} /></div>;
  if (prof.isError) return <div className="stack">{header}<ErrorState error={prof.error} onRetry={() => void prof.refetch()} /></div>;
  if (!profile || !personal) {
    return <div className="stack">{header}<Banner tone="warn">{t('workouts.detail.noProfile')}</Banner></div>;
  }
  const bucket = ageBucket(profile.age);

  if (!personal.visible) {
    return (
      <div className="stack">
        {header}
        <Banner tone="warn"><strong>{t('workouts.detail.notVisibleTitle')}</strong><div>{t('workouts.detail.notVisibleHint')}</div><span className="small muted">{t(`label.ageBucket.${bucket}`)}{profile.injuries.length ? ` · ${profile.injuries.map((i) => t(`label.injury.${i}`)).join(', ')}` : ''}</span></Banner>
        <div><LinkButton to="/workouts?tab=ready">{t('workouts.detail.notVisibleLink')}</LinkButton></div>
      </div>
    );
  }

  const finisherMinutes = finisher ? Math.round(finisher.items.reduce((a, it) => a + (it.workSec + it.restSec) * finisher.rounds, 0) / 60) : 0;
  const swappedFrom = new Map<string, string>();
  const topTags: string[] = [];
  for (const n of personal.notes) {
    if (n.code === 'exercise_swapped') swappedFrom.set(n.to, n.from);
    else if (n.code === 'exercise_dropped') topTags.push(t('workouts.detail.tagDropped', { from: nameOfExercise(n.from, lang) }));
    else if (n.code === 'time_trimmed') { if (n.removed > 0) topTags.push(t('workouts.detail.tagTrimmed', { n: profile.sessionMinutes })); }
  }
  const totalSets = personal.items.reduce((a, it) => a + it.prescription.sets, 0);
  const totalMin = personal.estimatedMinutes + finisherMinutes;

  return (
    <div className="stack">
      {header}

      <section className="card hero-card wk-hero stack" aria-label={name}>
        <div className="wk-tags"><Tag>{t(`label.focus.${workout.focus}`)}</Tag><Tag>{t(`label.difficulty.${workout.level}`)}</Tag><Tag>{t(`label.style.${workout.style}`)}</Tag></div>
        <div className="grid-stats wk-hero-stats">
          <StatTile label={t('workouts.detail.statTime')} value={<span className="num">{totalMin}</span>} unit={t('unit.min')} hint={finisherMinutes > 0 ? t('workouts.detail.statFinisher', { n: finisherMinutes }) : t('workouts.detail.estimate')} />
          <StatTile label={t('workouts.detail.exercises')} value={<span className="num">{personal.items.length}</span>} />
          <StatTile label={t('workouts.detail.statSets')} value={<span className="num">{totalSets}</span>} />
        </div>
        {topTags.length > 0 ? <div className="wk-tags" aria-label={t('workouts.detail.adaptations')}>{topTags.map((x) => <Tag key={x}>{x}</Tag>)}</div> : null}
      </section>

      <ReadinessCheckin key={checkin?.state ?? 'none'} date={date} current={checkin} />

      <Disclosure summary={t('workouts.detail.warmup')}><p className="small">{t('workouts.detail.warmupText')}</p></Disclosure>

      <Card className="stack">
        <div className="row-between"><h2>{t('workouts.detail.exercises')}</h2><span className="small muted">{t('workouts.detail.rpeHint')}</span></div>
        <ul className="wk-ex-list">
          {personal.items.map((it, i) => (
            <li key={`${it.exerciseId}-${i}`}>
              <ExerciseLine exerciseId={it.exerciseId} large index={i + 1}>
                <PrescriptionLine p={it.prescription} />
                {lastLoads.get(it.exerciseId) !== undefined && it.prescription.loadKg !== null ? <span className="small muted">{t('workouts.presc.lastLoad', { kg: lastLoads.get(it.exerciseId) as number })}</span> : null}
                {swappedFrom.has(it.exerciseId) ? <span className="wk-tags"><Tag tone="warning">{t('workouts.detail.tagSwapped', { from: nameOfExercise(swappedFrom.get(it.exerciseId) as string, lang) })}</Tag></span> : null}
              </ExerciseLine>
            </li>
          ))}
        </ul>
      </Card>

      <FinisherPicker sport={sport} onSport={setSport} variant={variant} onVariant={setVariantChoice} finishers={FINISHERS} owned={owned} injuries={profile.injuries} />

      {conflict ? <Banner tone="warn">{t('workouts.detail.inProgress')} <Link to="/workouts/session">{t('workouts.detail.resume')}</Link></Banner> : null}
      <StickyAction>
        <Button variant="primary" block disabled={start.isPending} onClick={() => { setConflict(false); start.mutate(); }}>{start.isPending ? t('workouts.detail.starting') : t('workouts.detail.start')}</Button>
      </StickyAction>
    </div>
  );
}
