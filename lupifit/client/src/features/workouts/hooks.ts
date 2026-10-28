import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import { useConfirm, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { startSession } from './api';

/**
 * Starts a live session for a plan day and opens it. If a session is already running the
 * user is taken to it instead (the server answers 409 `session_already_active`).
 */
export function useStartWorkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const i18n = useI18n();
  const queryClient = useQueryClient();
  const m = useIdempotentMutation((planWorkoutId: string, key) => startSession(planWorkoutId, key), {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.activeSession });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      navigate('/workouts/session');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'session_already_active') {
        navigate('/workouts/session');
        return;
      }
      toast.error(errorMessage(err, i18n, 'workouts'));
    },
  });
  return {
    start: (planWorkoutId: string) => m.mutate(planWorkoutId),
    pendingId: m.isPending ? (m.variables?.vars ?? null) : null,
  };
}

/**
 * Unsaved-changes guard: in-app navigation asks for confirmation (react-router blocker)
 * and closing/reloading the tab triggers the browser's native prompt.
 */
export function useUnsavedChangesGuard(dirty: boolean) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && `${currentLocation.pathname}${currentLocation.search}` !== `${nextLocation.pathname}${nextLocation.search}`);
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let active = true;
    void confirm({ title: t('workouts.confirm.leaveTitle'), body: t('workouts.confirm.leaveBody'), confirmLabel: t('workouts.confirm.leaveConfirm'), danger: true }).then((ok) => {
      if (!active) return;
      const b = blockerRef.current;
      if (b.state !== 'blocked') return;
      if (ok) b.proceed();
      else b.reset();
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocker.state]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);
}
