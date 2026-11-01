import '../styles/live.css';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ageBucket, isExerciseSafe, type ProfileInput } from '@lupu-fit/shared';
import { api, ApiRequestError, NetworkError } from '../api/client.ts';
import { ExerciseListSheet, type ListItem } from '../components/live/ExerciseListSheet.tsx';
import { ExercisePanel } from '../components/live/ExercisePanel.tsx';
import { PrescriptionChips } from '../components/live/ExercisePanel.tsx';
import { FinisherTimer } from '../components/live/FinisherTimer.tsx';
import { OfflineBanner, useOnline } from '../components/live/OfflineBanner.tsx';
import { AddExerciseSheet, ReplaceSheet } from '../components/live/Pickers.tsx';
import { RestTimerCard } from '../components/live/RestTimerCard.tsx';
import { SetLogger, SetRows, type LoggedValues, type RowData } from '../components/live/SetLogger.tsx';
import { setSummary } from '../components/live/format.ts';
import { EXERCISES, EXERCISE_BY_ID, exById, exName } from '../data/content.ts';
import { useProfile, qk } from '../app/session.ts';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import {
  defaultPlanned, defaultsFor, deletedSetIds, finisherMinutes, isTimedExercise, lastPerformance, maxRpeFor, pendingSets, progressionFor,
  readinessOf, replacementOptions, safeBucket, sessionOutboxItems, setsPath, swapContextFor,
  type HistoryResponse, type LiveExercise, type LiveSessionData, type LiveSet,
} from '../lib/liveSession.ts';
import { callOrQueue, outbox, useOutbox } from '../lib/outbox.ts';
import { alertRestEnd, saveRestEnd, useRestTimer } from '../lib/restTimer.ts';
import { useWakeLock } from '../lib/wakeLock.ts';
import { IconChevron, IconSettings } from '../ui/icons.tsx';
import { Banner, Button, EmptyState, ErrorState, IconButton, Loading, LinkButton, Tag, errorMessage } from '../ui/kit.tsx';
import { useToast } from '../ui/toast.tsx';

type ActiveResponse = { session: LiveSessionData | null };

export default function LiveSession(): ReactNode {
  const t = useT();
  const q = useQuery({ queryKey: qk.activeSession, queryFn: () => api.get<ActiveResponse>('/api/sessions/active'), networkMode: 'always', staleTime: 0 });
  const profileQ = useProfile();
  if (q.isLoading) return <Loading />;
  if (q.isError && !q.data) return <ErrorState error={q.error} onRetry={() => { void q.refetch(); }} />;
  const session = q.data?.session ?? null;
  if (!session) {
    return <EmptyState title={t('live.empty.title')} hint={t('live.empty.hint')} action={<LinkButton to="/workouts">{t('live.empty.cta')}</LinkButton>} />;
  }
  return <LiveWorkout session={session} profile={profileQ.data?.profile ?? null} />;
}

interface FinishResponse { sessionId: string }

function LiveWorkout({ session, profile }: { session: LiveSessionData; profile: ProfileInput | null }): ReactNode {
  const t = useT(); const { lang } = useLang(); const qc = useQueryClient(); const nav = useNavigate(); const toast = useToast();
  const online = useOnline();
  const outboxItems = useOutbox();
  useWakeLock(true);

  const bucket = safeBucket(profile?.age, ageBucket);
  const minor = bucket === 'minor';
  const maxRpe = maxRpeFor(bucket);
  const readiness = readinessOf(session.readiness);

  const mains = useMemo(() => session.exercises.filter((e) => !e.isFinisher), [session.exercises]);
  const finishers = useMemo(() => session.exercises.filter((e) => e.isFinisher), [session.exercises]);
  const [idx, setIdx] = useState(0);
  const cur: LiveExercise | undefined = mains[Math.min(idx, Math.max(0, mains.length - 1))];

  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishMsg, setFinishMsg] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const rest = useRestTimer(session.id, () => { setAnnounce(t('live.rest.over')); alertRestEnd(t('live.rest.notifTitle'), t('live.rest.notifBody')); });

  /* ---- sets = server rows (minus queued deletions) + queued POSTs from the outbox ---- */
  const pend = useMemo(() => pendingSets(outboxItems, session.id), [outboxItems, session.id]);
  const deleted = useMemo(() => deletedSetIds(outboxItems, session.id), [outboxItems, session.id]);
  const rowsFor = (ex: LiveExercise): RowData[] => [
    ...ex.sets.filter((s) => !deleted.has(s.id)).map((s): RowData => ({ key: s.id, setNo: s.setNo, reps: s.reps, weightKg: s.weightKg, durationSec: s.durationSec, rpe: s.rpe, state: 'done' })),
    ...pend.filter((p) => p.sessionExerciseId === ex.id).map((p): RowData => ({ key: p.itemId, setNo: 0, reps: p.reps, weightKg: p.weightKg, durationSec: p.durationSec, rpe: p.rpe, state: p.status === 'rejected' ? 'rejected' : 'pending' })),
  ];
  const countFor = (ex: LiveExercise): number => rowsFor(ex).length;
  const totalSets = session.exercises.reduce((a, e) => a + countFor(e), 0);

  // When queued items leave the outbox (synced / discarded) reload the authoritative session.
  const queuedCount = pend.length + deleted.size;
  const prevQueued = useRef(queuedCount);
  useEffect(() => {
    if (queuedCount < prevQueued.current) void qc.invalidateQueries({ queryKey: qk.activeSession });
    prevQueued.current = queuedCount;
  }, [queuedCount, qc]);

  const history = useQuery({
    queryKey: ['exercise-history', cur?.exerciseId, 3], enabled: !!cur, retry: false, staleTime: 60_000, networkMode: 'always',
    queryFn: () => api.get<HistoryResponse>(`/api/exercises/${cur?.exerciseId}/history`, { limit: 3 }),
  });

  const curDef = cur ? exById(cur.exerciseId) : undefined;
  const timed = cur ? isTimedExercise(curDef?.category, cur.planned) : false;
  const hist = history.data?.history ?? [];
  const progression = cur ? progressionFor({ history: hist, planned: cur.planned, readiness, bucket, timed }) : { badge: { kind: 'none' as const }, loadKg: null };
  const last = lastPerformance(hist);
  const curRows = cur ? rowsFor(cur) : [];
  const defaults = cur ? defaultsFor({ planned: cur.planned, progression, last, ownSets: curRows, maxRpe }) : { weightKg: null, reps: 8, durationSec: 30, rpe: 7 };
  const showWeight = !!cur && !timed && (!!curDef?.externallyLoaded || cur.planned.loadKg !== null || (last?.weightKg ?? 0) > 0);

  const setData = (fn: (s: LiveSessionData) => LiveSessionData): void => {
    qc.setQueryData<ActiveResponse>(qk.activeSession, (old) => (old?.session ? { session: fn(old.session) } : old));
  };

  async function logSet(ex: LiveExercise, v: LoggedValues, startRest = true): Promise<void> {
    const name = exById(ex.exerciseId) ? exName(exById(ex.exerciseId) as { nameHe: string; nameEn: string }, lang) : ex.exerciseId;
    setBusy(true);
    try {
      const body = { sessionExerciseId: ex.id, ...v };
      const r = await callOrQueue<LiveSet>({ method: 'POST', path: setsPath(session.id), body, label: t('live.offline.queuedSet', { name, summary: setSummary({ reps: v.reps ?? null, weightKg: v.weightKg ?? null, durationSec: v.durationSec ?? null }, t) }) });
      if (r.queued) toast(t('outbox.queued'));
      else setData((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === ex.id ? { ...e, sets: [...e.sets, r.data] } : e)) }));
      if (startRest && ex.planned.restSec > 0) { rest.start(ex.planned.restSec); setAnnounce(t('live.rest.started', { sec: ex.planned.restSec })); }
    } catch (e) { toast(errorMessage(e, t), 'error'); } finally { setBusy(false); }
  }

  async function undo(ex: LiveExercise): Promise<void> {
    const queued = pend.filter((p) => p.sessionExerciseId === ex.id);
    const lastQueued = queued[queued.length - 1];
    if (lastQueued) { await outbox.remove(lastQueued.itemId); return; } // never sent: just drop it from the queue
    const real = ex.sets.filter((s) => !deleted.has(s.id));
    const lastSet = real.reduce<LiveSet | null>((a, s) => (!a || s.setNo > a.setNo ? s : a), null);
    if (!lastSet) return;
    setBusy(true);
    try {
      const r = await callOrQueue({ method: 'DELETE', path: `${setsPath(session.id)}/${lastSet.id}`, label: t('live.set.undo') });
      if (!r.queued) setData((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === ex.id ? { ...e, sets: e.sets.filter((x) => x.id !== lastSet.id) } : e)) }));
    } catch (e) { toast(errorMessage(e, t), 'error'); } finally { setBusy(false); }
  }

  /* ---- structure edits (need the server; offline they fail with a clear toast) ---- */
  async function edit(run: () => Promise<LiveSessionData>): Promise<void> {
    try { const s = await run(); qc.setQueryData<ActiveResponse>(qk.activeSession, { session: s }); }
    catch (e) { toast(e instanceof ApiRequestError && e.code === 'exercise_has_sets' ? t('live.structure.replaceLocked') : errorMessage(e, t), 'error'); }
  }
  const base = `/api/sessions/${session.id}`;
  const curLocked = cur ? countFor(cur) > 0 : true;
  const ctx = profile && bucket ? swapContextFor(profile, bucket) : null;
  const replaceOptions = useMemo(() => (cur && curDef && ctx ? replacementOptions(curDef, ctx, EXERCISE_BY_ID) : []), [cur, curDef, ctx]);
  const addCandidates = useMemo(() => EXERCISES.filter((e) => (ctx ? isExerciseSafe(e, ctx) : true) && !(minor && e.category === 'plyometric')), [ctx, minor]);

  const moveTo = (id: string, dir: -1 | 1): void => {
    const ids = session.exercises.map((e) => e.id); const i = ids.indexOf(id); const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j] as string, ids[i] as string];
    void edit(() => api.put<LiveSessionData>(`${base}/order`, { ids }));
  };
  const removeEx = (id: string): void => { if (window.confirm(t('live.structure.confirmRemove'))) void edit(() => api.delete<LiveSessionData>(`${base}/exercises/${id}`)); };
  const addEx = (exerciseId: string): void => {
    const d = EXERCISE_BY_ID.get(exerciseId);
    const planned = defaultPlanned(d ? isTimedExercise(d.category, defaultPlanned(false, minor)) : false, minor);
    setAddOpen(false);
    void edit(() => api.post<LiveSessionData>(`${base}/exercises`, { exerciseId, planned, isFinisher: false }));
  };
  const replaceEx = (exerciseId: string): void => { if (!cur) return; setReplaceOpen(false); void edit(() => api.patch<LiveSessionData>(`${base}/exercises/${cur.id}`, { exerciseId })); };

  /* ---- finish / discard ---- */
  async function finish(): Promise<void> {
    setFinishMsg(null);
    if (!online) { setFinishMsg(t('live.finishNeedsConnection')); return; }
    if (totalSets === 0 && !window.confirm(t('live.confirmFinishEmpty'))) return;
    setFinishing(true);
    try {
      await outbox.flush(); // queued sets must reach the server before it computes PRs / XP
      if (outbox.list().some((i) => i.status === 'pending' && i.path.startsWith(`/api/sessions/${session.id}`))) { setFinishMsg(t('live.finishNeedsConnection')); return; }
      const res = await api.post<FinishResponse>(`${base}/finish`, {});
      saveRestEnd(session.id, null);
      nav(`/workouts/sessions/${session.id}`, { state: { finish: res } });
      void qc.invalidateQueries({ queryKey: qk.activeSession });
      void qc.invalidateQueries({ queryKey: qk.stats });
    } catch (e) { setFinishMsg(e instanceof NetworkError ? t('live.finishNeedsConnection') : errorMessage(e, t)); } finally { setFinishing(false); }
  }
  async function discard(): Promise<void> {
    if (!window.confirm(t('live.confirmDiscard'))) return;
    try {
      await api.delete(base);
      for (const i of sessionOutboxItems(outbox.list(), session.id)) await outbox.remove(i.id);
      saveRestEnd(session.id, null);
      toast(t('live.discarded'));
      nav('/workouts');
      void qc.invalidateQueries({ queryKey: qk.activeSession });
    } catch (e) { toast(errorMessage(e, t), 'error'); }
  }

  const items: ListItem[] = session.exercises.map((e) => ({ id: e.id, name: nameOf(e, lang), done: countFor(e), total: e.planned.sets, current: e.id === cur?.id, isFinisher: e.isFinisher }));
  const sport = finishers.find((f) => f.sport)?.sport ?? session.sport;
  const doneSets = session.exercises.reduce((a, e) => a + Math.min(countFor(e), e.planned.sets), 0);
  const plannedSets = session.exercises.reduce((a, e) => a + e.planned.sets, 0);

  return (
    <div className="live stack">
      <header className="row-between">
        <div className="stack-sm">
          <h1 className="live-title">{session.name}</h1>
          <span className="small muted">{t('live.setsDone', { done: doneSets, total: plannedSets })}</span>
        </div>
        <IconButton label={t('live.allExercises')} onClick={() => setListOpen(true)}><IconSettings /></IconButton>
      </header>

      <OfflineBanner />
      <RestTimerCard remaining={rest.remaining} announce={announce} onAdjust={rest.adjust} onSkip={rest.skip} />
      {finishMsg ? <Banner tone="danger">{finishMsg}</Banner> : null}

      {cur ? (
        <section className="stack" aria-label={t('live.title')}>
          <div className="row-between">
            <IconButton label={t('live.previous')} disabled={idx <= 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}><IconChevron className="live-back" /></IconButton>
            <span className="small strong" data-testid="stepper-pos">{t('live.exerciseOf', { n: Math.min(idx, mains.length - 1) + 1, total: mains.length })}</span>
            <IconButton label={t('live.next')} disabled={idx >= mains.length - 1} onClick={() => setIdx((i) => Math.min(mains.length - 1, i + 1))}><IconChevron className="flip-rtl" /></IconButton>
          </div>
          <ExercisePanel
            ex={cur} rows={curRows} timed={timed} showWeight={showWeight} last={last} badge={progression.badge} defaults={defaults} maxRpe={maxRpe}
            primary busy={busy} canUndo={curRows.length > 0 && !busy} onLog={(v) => { void logSet(cur, v); }} onUndo={() => { void undo(cur); }}
          />
          <div className="row-wrap">
            <Button size="sm" disabled={curLocked} onClick={() => setReplaceOpen(true)}>{t('live.structure.replace')}</Button>
            <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>{t('live.structure.add')}</Button>
            <Button size="sm" variant="ghost" onClick={() => removeEx(cur.id)}>{t('live.structure.remove')}</Button>
          </div>
          {curLocked && countFor(cur) > 0 ? <span className="small muted" data-testid="replace-locked">{t('live.structure.replaceLocked')}</span> : null}
        </section>
      ) : null}

      {finishers.length > 0 ? (
        <section id="live-finisher" className="card live-finisher stack" aria-labelledby="live-finisher-h">
          <h2 id="live-finisher-h" className="live-finisher-h">{t('live.finisher.header', { sport: sport ? t(`label.sport.${sport}`) : t('label.sport.general'), min: finisherMinutes(finishers.map((f) => f.planned)) })}</h2>
          {finishers.map((f, k) => {
            const def = exById(f.exerciseId); const rows = rowsFor(f); const ftimed = isTimedExercise(def?.category, f.planned);
            return (
              <article key={f.id} className="stack live-finisher-row">
                <div className="row-between">
                  <h3><Link to={`/exercises/${f.exerciseId}`}>{nameOf(f, lang)}</Link></h3>
                  {f.sport ? <Tag>{t(`label.sport.${f.sport}`)}</Tag> : null}
                </div>
                <PrescriptionChips ex={f} timed={ftimed} />
                <SetRows rows={rows} plannedSets={f.planned.sets} plannedLabel={ftimed ? t('live.set.plannedSec', { sec: f.planned.durationSec ?? 0 }) : t('live.set.plannedReps', { reps: f.planned.repsMax })} />
                {f.planned.durationSec ? <FinisherTimer ex={{ ...f, sets: f.sets.filter((s) => !deleted.has(s.id)).concat(rows.filter((r) => r.state !== 'done').map((r) => ({ id: r.key, sessionExerciseId: f.id, setNo: 0, reps: r.reps, weightKg: r.weightKg, durationSec: r.durationSec, rpe: r.rpe }))) }} onRound={(sec) => logSet(f, { durationSec: sec, rpe: Math.min(f.planned.rpe, maxRpe) }, false)} />
                  : <SetLogger key={f.id} timed={ftimed} showWeight={false} defaults={defaultsFor({ planned: f.planned, progression: { badge: { kind: 'none' }, loadKg: null }, last: null, ownSets: rows, maxRpe })} maxRpe={maxRpe} primary={!cur && k === 0} busy={busy} canUndo={rows.length > 0 && !busy} onLog={(v) => { void logSet(f, v); }} onUndo={() => { void undo(f); }} />}
              </article>
            );
          })}
        </section>
      ) : null}

      <footer className="stack">
        <Button block disabled={finishing} onClick={() => { void finish(); }}>{finishing ? t('live.finishing') : t('live.finishWorkout')}</Button>
        <Button block variant="ghost" onClick={() => { void discard(); }}>{t('live.discard')}</Button>
      </footer>

      <ExerciseListSheet
        open={listOpen} onClose={() => setListOpen(false)} items={items}
        onSelect={(id) => { const i = mains.findIndex((m) => m.id === id); setListOpen(false); if (i >= 0) setIdx(i); else document.getElementById('live-finisher')?.scrollIntoView?.(); }}
        onMove={moveTo} onRemove={removeEx} onAdd={() => { setListOpen(false); setAddOpen(true); }}
      />
      <ReplaceSheet open={replaceOpen} onClose={() => setReplaceOpen(false)} options={replaceOptions} onPick={replaceEx} />
      <AddExerciseSheet open={addOpen} onClose={() => setAddOpen(false)} candidates={addCandidates} onPick={addEx} />
      <span className="sr-only">{fmt.num(totalSets)}</span>
    </div>
  );
}

function nameOf(e: LiveExercise, lang: 'he' | 'en'): string {
  const d = exById(e.exerciseId);
  return d ? exName(d, lang) : e.exerciseId;
}
