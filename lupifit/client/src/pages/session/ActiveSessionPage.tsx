import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { idleTimer, pauseTimer, resumeTimer, startTimer, timerStatus } from '@shared/timer';
import { activeElapsedSeconds, formatClock } from '@shared/training';
import type { SessionExerciseDTO, SessionSetDTO, WorkoutSessionDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Icon,
  LinkButton,
  LoadingState,
  Modal,
  Notice,
  PageHeader,
  ProgressBar,
  useConfirm,
  useToast,
} from '../../components/ui';
import { ExercisePicker } from '../../features/exercises/ExercisePicker';
import { primeAudio } from '../../features/sessions/alarm';
import {
  abandonSession,
  addExercise,
  addSet,
  deleteSet,
  finishSession,
  pauseSession,
  removeExercise,
  replaceExercise,
  resumeSession,
  sessionKeys,
  startEmptySession,
} from '../../features/sessions/api';
import { serverNow } from '../../features/sessions/clock';
import { ExerciseCard, type SetDefaults } from '../../features/sessions/ExerciseCard';
import { ExerciseInfoModal } from '../../features/sessions/ExerciseInfoModal';
import { FinishDialog } from '../../features/sessions/FinishDialog';
import { closeActiveSession, setActiveSession, useActiveSession, useSyncStatus } from '../../features/sessions/hooks';
import type { ExercisePatch, SetPatch } from '../../features/sessions/queue';
import { RestTimerBar, RestTimerCard } from '../../features/sessions/RestTimer';
import { completionOutcome, countSets, nextOpenExercise, unfinishedExercises, volumeKg } from '../../features/sessions/logic';
import { useSessionPrefs } from '../../features/sessions/prefs';
import { SessionPrefsPanel } from '../../features/sessions/SessionPrefs';
import { useWorkoutShortcuts } from '../../features/sessions/shortcuts';
import { sessionSync } from '../../features/sessions/sync';
import { useWakeLock } from '../../features/sessions/wakeLock';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useNow } from '../../hooks/useNow';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import '../../styles/session.css';
import '../../styles/ux-session.css';

class UnsyncedChangesError extends Error {}

export default function ActiveSessionPage() {
  const { t } = useI18n();
  useDocumentTitle(t('session.title'));
  const query = useActiveSession();

  if (query.data === undefined) {
    if (query.isError) {
      return (
        <>
          <PageHeader title={t('session.title')} />
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </>
      );
    }
    return <LoadingState />;
  }
  if (query.data === null) return <NoActiveSession />;
  return <LiveWorkout key={query.data.id} session={query.data} />;
}

function NoActiveSession() {
  const i18n = useI18n();
  const { t } = i18n;
  const qc = useQueryClient();
  const toast = useToast();
  const start = useIdempotentMutation((_: void, key: string) => startEmptySession(t('session.empty.defaultName'), key), {
    onSuccess: (session) => {
      setActiveSession(qc, session);
      toast.success(t('session.empty.started'));
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'session_already_active') void qc.invalidateQueries({ queryKey: qk.activeSession });
      toast.error(errorMessage(err, i18n, 'session'));
    },
  });
  return (
    <>
      <PageHeader title={t('session.title')} />
      <EmptyState
        icon="dumbbell"
        title={t('session.empty.title')}
        body={t('session.empty.body')}
        action={
          <div className="row session-empty-actions">
            <LinkButton to="/workouts" variant="primary" icon="list">
              {t('session.empty.choose')}
            </LinkButton>
            <Button icon="plus" onClick={() => start.mutate()} loading={start.isPending}>
              {t('session.empty.startEmpty')}
            </Button>
            <LinkButton to="/workouts/history" variant="ghost" icon="clock">
              {t('session.empty.history')}
            </LinkButton>
          </div>
        }
      />
    </>
  );
}

function SyncIndicator() {
  const { t } = useI18n();
  const s = useSyncStatus();
  const state = s.offline ? 'offline' : s.retrying ? 'retrying' : s.pending > 0 || s.saving ? 'saving' : 'saved';
  const icon = state === 'saved' ? 'check' : state === 'saving' ? 'refresh' : 'warning';
  return (
    <p className={`sync-status sync-${state}`} role="status" aria-live="polite">
      <Icon name={icon} size={14} />
      <span>{t(`session.sync.${state}`)}</span>
    </p>
  );
}

/** True while the viewport is narrower than the desktop sidebar layout. */
function useIsMobile(): boolean {
  const query = '(max-width: 899px)';
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

/** What the "Undo" strip can revert: the last set that was logged. */
interface UndoInfo {
  set: SessionSetDTO;
  /** Rest timer as it was before logging (restored on undo). */
  previousTimer: WorkoutSessionDTO['restTimer'];
  /** Exercise index to return to when logging auto-advanced to the next exercise. */
  returnIndex: number | null;
}

function LiveWorkout({ session }: { session: WorkoutSessionDTO }) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const qc = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const paused = session.status === 'paused';
  const now = serverNow(useNow(1000, !paused));
  const elapsed = activeElapsedSeconds(session, now);
  const exercises = session.exercises;
  const index = Math.max(0, Math.min(session.currentExerciseIndex, exercises.length - 1));
  const current = exercises[index] ?? null;
  const { done, total } = countSets(exercises);
  const nextOpenIndex = nextOpenExercise(exercises, index);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [swapFor, setSwapFor] = useState<SessionExerciseDTO | null>(null);
  const [undo, setUndo] = useState<UndoInfo | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const [prefs] = useSessionPrefs();
  useWakeLock(prefs.wakeLock);
  const timerRef = useRef<HTMLDivElement>(null);
  const [timerInView, setTimerInView] = useState(true);
  const isMobile = useIsMobile();
  const sessionId = session.id;
  const onError = (err: unknown) => {
    if (err instanceof ApiError && (err.code === 'session_not_active' || err.code === 'session_not_found')) void qc.invalidateQueries({ queryKey: qk.activeSession });
    toast.error(errorMessage(err, i18n, 'session'));
  };

  // Warn before leaving the page only while edits are still unsynced.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (sessionSync.getSnapshot().pending > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // The slim mobile rest bar is shown only while the full timer card is scrolled out of view.
  const hasTimer = session.restTimer != null;
  useEffect(() => {
    const el = timerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setTimerInView(entry?.isIntersecting ?? true));
    io.observe(el);
    return () => io.disconnect();
  }, [hasTimer]);

  const setIndex = (i: number) => sessionSync.enqueue({ type: 'state', sessionId, patch: { currentExerciseIndex: i } }, 300);
  const setTimer = (restTimer: WorkoutSessionDTO['restTimer']) => sessionSync.enqueue({ type: 'state', sessionId, patch: { restTimer } }, 800);
  const patchSet = (set: SessionSetDTO, patch: SetPatch, opts: { immediate: boolean }) =>
    sessionSync.enqueue({ type: 'set', sessionId, setId: set.id, patch }, opts.immediate ? 0 : 700);
  const patchExercise = (ex: SessionExerciseDTO, patch: ExercisePatch) =>
    sessionSync.enqueue({ type: 'exercise', sessionId, sessionExerciseId: ex.id, patch }, 900);

  // The undo strip disappears on its own, and a pending auto-advance never outlives the page.
  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), 10_000);
    return () => window.clearTimeout(id);
  }, [undo]);
  useEffect(
    () => () => {
      if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
    },
    [],
  );

  const onUndo = () => {
    if (!undo) return;
    if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    patchSet(undo.set, { completed: false }, { immediate: true });
    setTimer(undo.previousTimer ?? null);
    if (undo.returnIndex != null) setIndex(undo.returnIndex);
    setAnnouncement(t('session.sets.undone', { n: undo.set.setNumber }));
    setUndo(null);
  };

  const toggleComplete = (ex: SessionExerciseDTO, set: SessionSetDTO, defaults: SetDefaults) => {
    primeAudio();
    if (set.completed) {
      patchSet(set, { completed: false }, { immediate: true });
      return;
    }
    const outcome = completionOutcome(exercises, exercises.indexOf(ex), set.id);
    const tracking = ex.exercise.trackingType;
    const patch: SetPatch = { completed: true };
    // An untouched set is logged with the values shown as placeholders.
    if (tracking === 'time') {
      if (set.durationSeconds == null && defaults.durationSeconds != null) patch.durationSeconds = defaults.durationSeconds;
    } else if (set.reps == null && defaults.reps != null) {
      patch.reps = defaults.reps;
    }
    if (set.weightKg == null && defaults.weightKg != null) patch.weightKg = defaults.weightKg;
    patchSet(set, patch, { immediate: true });
    // Rest starts automatically (skip it after the very last set: nothing left to rest for).
    if (ex.restSeconds > 0 && !outcome.workoutDone) setTimer(startTimer(ex.restSeconds, serverNow(), ex.id));
    setAnnouncement(t('session.sets.completed', { n: set.setNumber }));
    const advanceTo = prefs.autoAdvance ? outcome.advanceTo : null;
    setUndo({ set, previousTimer: session.restTimer, returnIndex: advanceTo != null ? exercises.indexOf(ex) : null });
    if (advanceTo != null) {
      // Short pause so the tick animation and the rest timer register before the view moves on.
      if (advanceTimer.current != null) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        setIndex(advanceTo);
        setAnnouncement(t('session.exercise.movedOn', { name: lt(exercises[advanceTo]!.exercise.name) }));
      }, 1200);
    }
  };

  const addSetM = useIdempotentMutation(
    async (sessionExerciseId: string, key: string) => {
      await sessionSync.settle();
      return addSet(sessionId, sessionExerciseId, key);
    },
    { onSuccess: (s) => setActiveSession(qc, s), onError },
  );

  const deleteSetM = useMutation({
    mutationFn: async (setId: string) => {
      sessionSync.discard((op) => op.type === 'set' && op.setId === setId);
      await sessionSync.settle();
      return deleteSet(sessionId, setId);
    },
    onSuccess: (s) => setActiveSession(qc, s),
    onError,
  });

  const onDeleteSet = async (set: SessionSetDTO) => {
    const hasData = set.completed || set.reps != null || set.weightKg != null || set.durationSeconds != null;
    if (hasData) {
      const ok = await confirm({
        title: t('session.sets.deleteConfirm', { n: set.setNumber }),
        body: t('session.sets.deleteBody'),
        confirmLabel: t('common.actions.delete'),
        danger: true,
      });
      if (!ok) return;
    }
    deleteSetM.mutate(set.id);
  };

  const addExerciseM = useIdempotentMutation(
    async (exerciseId: string, key: string) => {
      await sessionSync.settle();
      return addExercise(sessionId, { exerciseId, sets: 3 }, key);
    },
    {
      onSuccess: (s) => {
        setActiveSession(qc, s);
        setIndex(s.exercises.length - 1);
        setOverviewOpen(false);
        toast.success(t('session.exercise.added'));
      },
      onError,
    },
  );

  const removeExerciseM = useMutation({
    mutationFn: async (ex: SessionExerciseDTO) => {
      const setIds = new Set(ex.sets.map((s) => s.id));
      sessionSync.discard((op) => (op.type === 'set' && setIds.has(op.setId)) || (op.type === 'exercise' && op.sessionExerciseId === ex.id));
      await sessionSync.settle();
      return removeExercise(sessionId, ex.id);
    },
    onSuccess: (s) => {
      setActiveSession(qc, s);
      toast.success(t('session.exercise.removed'));
    },
    onError,
  });

  const swapM = useIdempotentMutation(
    async (input: { ex: SessionExerciseDTO; exerciseId: string }, key: string) => {
      sessionSync.discard((op) => (op.type === 'set' && input.ex.sets.some((s) => s.id === op.setId)) || (op.type === 'exercise' && op.sessionExerciseId === input.ex.id));
      await sessionSync.settle();
      return replaceExercise(sessionId, input.ex.id, input.exerciseId, key);
    },
    {
      onSuccess: (s) => {
        setActiveSession(qc, s);
        setSwapFor(null);
        toast.success(t('session.exercise.swapped'));
      },
      onError,
    },
  );

  const onRemoveExercise = async (ex: SessionExerciseDTO) => {
    const ok = await confirm({
      title: t('session.exercise.removeConfirm', { name: lt(ex.exercise.name) }),
      body: t('session.exercise.removeBody'),
      confirmLabel: t('common.actions.remove'),
      danger: true,
    });
    if (ok) removeExerciseM.mutate(ex);
  };

  const pauseM = useMutation({
    mutationFn: async (action: 'pause' | 'resume') => {
      await sessionSync.settle(4000);
      const latest = qc.getQueryData<WorkoutSessionDTO | null>(qk.activeSession) ?? session;
      const timer = latest.restTimer;
      const at = serverNow();
      // Pausing the workout also pauses a running rest; resuming continues it.
      const body =
        timer && action === 'pause' && timerStatus(timer, at) === 'running'
          ? { restTimer: pauseTimer(timer, at) }
          : timer && action === 'resume' && timerStatus(timer, at) === 'paused'
            ? { restTimer: resumeTimer(timer, at) }
            : {};
      return action === 'pause' ? pauseSession(sessionId, body) : resumeSession(sessionId, body);
    },
    onSuccess: (s) => setActiveSession(qc, s),
    onError,
  });

  const finishM = useIdempotentMutation(
    async (input: { perceivedExertion: number | null; notes: string }, key: string) => {
      if (!(await sessionSync.settle(10_000))) throw new UnsyncedChangesError();
      return finishSession(sessionId, input, key);
    },
    {
      onSuccess: (summary) => {
        qc.setQueryData(sessionKeys.summary(summary.session.id), summary);
        closeActiveSession(qc, sessionId);
        toast.success(t('session.finish.finished'));
        navigate(`/workouts/sessions/${summary.session.id}`, { replace: true });
      },
      onError: (err) => (err instanceof UnsyncedChangesError ? toast.error(t('session.errors.unsynced')) : onError(err)),
    },
  );

  const discardM = useMutation({
    mutationFn: () => abandonSession(sessionId),
    onSuccess: () => {
      closeActiveSession(qc, sessionId);
      toast.success(t('session.discard.done'));
      navigate('/workouts', { replace: true });
    },
    onError,
  });

  const onDiscard = async () => {
    const body = done > 0 ? t('session.discard.bodyWithSets', { done, total, time: formatClock(elapsed) }) : t('session.discard.body');
    const ok = await confirm({ title: t('session.discard.title'), body, confirmLabel: t('session.discard.confirm'), danger: true });
    if (ok) {
      sessionSync.discard((op) => op.sessionId === sessionId);
      discardM.mutate();
    }
  };

  // Desktop keyboard shortcuts (ignored while typing or inside dialogs).
  useWorkoutShortcuts((action) => {
    if (action === 'complete') document.querySelector<HTMLButtonElement>('.set-row-current .set-check')?.click();
    else if (action === 'undo') onUndo();
    else if (action === 'previous') index > 0 && setIndex(index - 1);
    else if (action === 'next') index < exercises.length - 1 && setIndex(index + 1);
    else if (action === 'pause') pauseM.mutate(paused ? 'resume' : 'pause');
    else if (action === 'rest') {
      if (session.restTimer) setTimer(null);
      else setTimer(startTimer(current?.restSeconds ?? 90, serverNow(), current?.id ?? null));
    }
  });

  const overview = (
    <ol className="session-overview">
      {exercises.map((ex, i) => {
        const exDone = ex.sets.filter((s) => s.completed).length;
        const complete = ex.sets.length > 0 && exDone === ex.sets.length;
        return (
          <li key={ex.id}>
            <button
              type="button"
              className={`session-overview-item${i === index ? ' is-current' : ''}`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => {
                setIndex(i);
                setOverviewOpen(false);
              }}
            >
              <span className={`session-overview-dot${complete ? ' is-done' : ''}`} aria-hidden="true">
                {complete ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className="session-overview-name">{lt(ex.exercise.name)}</span>
              <span className="small muted num">{t('session.overview.setsDone', { done: exDone, total: ex.sets.length })}</span>
              {complete ? <Badge tone="success">{t('session.overview.complete')}</Badge> : i === index ? <Badge tone="primary">{t('session.overview.current')}</Badge> : null}
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <div className="session-page">
      <header className="card session-header">
        <div className="session-header-top">
          <div className="session-title-block">
            <h1 className="page-title">{session.name}</h1>
            <p className="small muted">{t('session.header.progress', { done, total })}</p>
          </div>
          <div className="session-clock">
            <span className="small muted">{t('session.header.elapsed')}</span>
            <span className="session-clock-value num" role="timer" aria-label={`${t('session.header.elapsed')}: ${formatClock(elapsed)}`}>
              {formatClock(elapsed)}
            </span>
            {paused && <Badge tone="warning">{t('enums.sessionStatus.paused')}</Badge>}
          </div>
        </div>
        <ProgressBar value={done} max={Math.max(1, total)} tone="success" label={t('session.header.progress', { done, total })} />
        <div className="session-actions" aria-label={t('session.header.actions')} role="group">
          <Button
            icon={paused ? 'play' : 'pause'}
            onClick={() => pauseM.mutate(paused ? 'resume' : 'pause')}
            loading={pauseM.isPending}
            aria-label={paused ? t('session.header.resumeLabel') : t('session.header.pauseLabel')}
          >
            {paused ? t('session.header.resume') : t('session.header.pause')}
          </Button>
          <Button
            icon="timer"
            disabled={hasTimer}
            onClick={() => {
              primeAudio();
              setTimer(idleTimer(current?.restSeconds ?? 90, current?.id ?? null));
            }}
          >
            {t('session.header.restTimer')}
          </Button>
          <Button variant="primary" icon="check" onClick={() => setFinishOpen(true)}>
            {t('session.header.finish')}
          </Button>
          <Button variant="ghost" icon="close" onClick={onDiscard} loading={discardM.isPending}>
            {t('session.header.discard')}
          </Button>
        </div>
        <SyncIndicator />
      </header>

      {paused && <Notice tone="warning">{t('session.header.paused')}</Notice>}

      <div className="session-layout">
        <div className="session-main">
          {session.restTimer && (
            <div ref={timerRef} className="session-timer-slot">
              <RestTimerCard timer={session.restTimer} onChange={setTimer} />
            </div>
          )}

          {current ? (
            <>
              <nav className="exercise-nav" aria-label={t('session.header.exercises')}>
                <Button icon="chevronLeft" onClick={() => setIndex(index - 1)} disabled={index === 0} aria-label={t('session.nav.previousLabel')}>
                  {t('session.nav.previous')}
                </Button>
                <Button variant="ghost" iconEnd="list" onClick={() => setOverviewOpen(true)} aria-haspopup="dialog" aria-label={`${t('session.nav.overview')} — ${t('session.nav.position', { current: index + 1, total: exercises.length })}`}>
                  {t('session.nav.position', { current: index + 1, total: exercises.length })}
                </Button>
                <Button iconEnd="chevronRight" onClick={() => setIndex(index + 1)} disabled={index >= exercises.length - 1} aria-label={t('session.nav.nextLabel')}>
                  {t('session.nav.next')}
                </Button>
              </nav>
              <ExerciseCard
                key={current.id}
                exercise={current}
                onSetPatch={patchSet}
                onToggleComplete={(set, defaults) => toggleComplete(current, set, defaults)}
                onDeleteSet={onDeleteSet}
                onAddSet={() => addSetM.mutate(current.id)}
                addSetPending={addSetM.isPending}
                onRemove={() => void onRemoveExercise(current)}
                removePending={removeExerciseM.isPending}
                onExercisePatch={(patch) => patchExercise(current, patch)}
                onShowInfo={() => setInfoId(current.exerciseId)}
                onSwap={() => setSwapFor(current)}
                swapDisabled={current.sets.some((s) => s.completed)}
                nextName={nextOpenIndex != null ? lt(exercises[nextOpenIndex]!.exercise.name) : null}
                onNext={() => nextOpenIndex != null && setIndex(nextOpenIndex)}
                onFinish={() => setFinishOpen(true)}
              />
            </>
          ) : (
            <EmptyState
              icon="dumbbell"
              title={t('session.exercise.noExercises')}
              body={t('session.exercise.noExercisesBody')}
              action={
                <Button variant="primary" icon="plus" onClick={() => setPickerOpen(true)} loading={addExerciseM.isPending}>
                  {t('session.overview.addExercise')}
                </Button>
              }
            />
          )}
          {current && (
            <Button icon="plus" variant="secondary" block onClick={() => setPickerOpen(true)} loading={addExerciseM.isPending}>
              {t('session.overview.addExercise')}
            </Button>
          )}
          <SessionPrefsPanel />
        </div>

        {exercises.length > 0 && (
          <aside className="session-aside" aria-label={t('session.overview.title')}>
            <section className="card">
              <h2 className="card-title">{t('session.overview.title')}</h2>
              {overview}
            </section>
          </aside>
        )}
      </div>

      {undo && (
        <div className="undo-strip" role="status" data-testid="undo-strip">
          <span>{t('session.sets.logged', { n: undo.set.setNumber })}</span>
          <Button size="sm" icon="refresh" onClick={onUndo}>
            {t('session.sets.undo')}
          </Button>
        </div>
      )}
      {session.restTimer && isMobile && !timerInView && <RestTimerBar timer={session.restTimer} onChange={setTimer} />}

      <Modal
        open={overviewOpen}
        onClose={() => setOverviewOpen(false)}
        title={t('session.overview.title')}
        footer={
          <Button icon="plus" onClick={() => setPickerOpen(true)}>
            {t('session.overview.addExercise')}
          </Button>
        }
      >
        {overview}
      </Modal>
      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(e) => addExerciseM.mutate(e.id)} title={t('session.exercise.addTitle')} />
      <ExerciseInfoModal exerciseId={infoId} onClose={() => setInfoId(null)} />
      <ExercisePicker
        open={swapFor != null}
        onClose={() => setSwapFor(null)}
        onSelect={(e) => swapFor && swapM.mutate({ ex: swapFor, exerciseId: e.id })}
        excludeIds={exercises.map((e) => e.exerciseId)}
        title={t('session.exercise.swapTitle', { name: swapFor ? lt(swapFor.exercise.name) : '' })}
      />
      <FinishDialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        pending={finishM.isPending}
        done={done}
        total={total}
        elapsedSeconds={elapsed}
        volumeKg={volumeKg(exercises)}
        lines={unfinishedExercises(exercises).map((l) => ({ id: l.id, name: lt(l.exercise.exercise.name), done: l.done, total: l.total }))}
        onConfirm={(input) => finishM.mutate(input)}
      />
      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
