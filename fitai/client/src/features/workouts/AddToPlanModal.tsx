import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LIMITS } from '@shared/constants';
import type { ExerciseSummaryDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Button, EmptyState, ErrorState, LinkButton, LoadingState, Modal, Notice, SelectField, useToast } from '../../components/ui';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { fetchPlan, fetchPlans, updateWorkout, workoutKeys } from './api';
import { draftFromWorkout, newDraftExercise, toUpdateInput } from './draft';
import { formatPrescription, formatRest, nextWorkoutIndex } from './format';

/**
 * "Add to plan" for one exercise (used from the exercise page): pick a plan and a day,
 * see the starting prescription and add it in one step. Defaults to the active plan and
 * its next workout.
 */
export function AddToPlanModal({
  open,
  onClose,
  exercise,
  warnings = [],
}: {
  open: boolean;
  onClose(): void;
  exercise: ExerciseSummaryDTO;
  /** Already-localized fit warnings (missing equipment, injuries) shown before adding. */
  warnings?: string[];
}) {
  const i18n = useI18n();
  const { t, lt } = i18n;
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chosenPlanId, setChosenPlanId] = useState<string | null>(null);
  const [chosenWorkoutId, setChosenWorkoutId] = useState<string | null>(null);

  const plans = useQuery({ queryKey: workoutKeys.plansList(false), queryFn: ({ signal }) => fetchPlans(false, signal), enabled: open });
  const defaultPlanId = plans.data?.find((p) => p.status === 'active')?.id ?? plans.data?.[0]?.id ?? '';
  const planId = chosenPlanId && plans.data?.some((p) => p.id === chosenPlanId) ? chosenPlanId : defaultPlanId;
  const plan = useQuery({ queryKey: qk.plan(planId), queryFn: ({ signal }) => fetchPlan(planId, signal), enabled: open && planId !== '' });
  const planData = plan.data?.id === planId ? plan.data : undefined;
  const defaultWorkoutId = planData ? (planData.workouts[nextWorkoutIndex(planData)]?.id ?? '') : '';
  const workout = planData?.workouts.find((w) => w.id === chosenWorkoutId) ?? planData?.workouts.find((w) => w.id === defaultWorkoutId);

  const starting = newDraftExercise(exercise);
  const already = workout?.exercises.some((x) => x.exerciseId === exercise.id) ?? false;
  const full = (workout?.exercises.length ?? 0) >= LIMITS.exercisesPerWorkoutMax;

  const add = useMutation({
    mutationFn: async () => {
      // Work from the freshest copy of the day: the cached plan may be stale.
      const fresh = await fetchPlan(planId);
      const day = fresh.workouts.find((w) => w.id === workout?.id);
      if (!day) throw new Error('day_missing');
      const draft = draftFromWorkout(day);
      if (draft.exercises.some((x) => x.exerciseId === exercise.id)) throw new Error('already_in_day');
      draft.exercises.push(newDraftExercise(exercise));
      return updateWorkout(planId, day.id, toUpdateInput(draft));
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(qk.plan(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: qk.plans });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.show(t('workouts.addToPlan.added', { name: lt(exercise.name), day: workout?.name ?? '' }), 'success', {
        label: t('workouts.addToPlan.viewPlan'),
        onClick: () => navigate(`/workouts/plans/${updated.id}`),
      });
      onClose();
    },
  });

  const noPlans = plans.isSuccess && plans.data.length === 0;
  const canSubmit = !!workout && !already && !full && !add.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('workouts.addToPlan.title', { name: lt(exercise.name) })}
      size="md"
      footer={
        noPlans ? undefined : (
          <>
            <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
            <Button variant="primary" icon="plus" loading={add.isPending} disabled={!canSubmit} onClick={() => add.mutate()}>
              {t('workouts.addToPlan.submit')}
            </Button>
          </>
        )
      }
    >
      {plans.isPending ? (
        <LoadingState compact />
      ) : plans.isError ? (
        <ErrorState compact error={plans.error} onRetry={() => void plans.refetch()} />
      ) : noPlans ? (
        <EmptyState
          compact
          icon="dumbbell"
          title={t('workouts.addToPlan.noPlansTitle')}
          body={t('workouts.addToPlan.noPlansBody')}
          action={
            <LinkButton to="/workouts?tab=generate" variant="primary" icon="sparkles">
              {t('workouts.list.generateFirst')}
            </LinkButton>
          }
        />
      ) : (
        <div className="stack">
          {warnings.map((w) => (
            <Notice key={w} tone="warning">
              {w}
            </Notice>
          ))}
          {add.isError && (
            <Notice tone="danger">
              {add.error instanceof Error && add.error.message === 'already_in_day' ? t('workouts.addToPlan.alreadyIn') : errorMessage(add.error, i18n, 'workouts')}
            </Notice>
          )}
          <SelectField
            label={t('workouts.addToPlan.plan')}
            value={planId}
            onChange={(e) => {
              setChosenPlanId(e.target.value);
              setChosenWorkoutId(null);
              add.reset();
            }}
            options={(plans.data ?? []).map((p) => ({ value: p.id, label: p.status === 'active' ? `${p.name} · ${t('workouts.list.activePlan')}` : p.name }))}
          />
          {plan.isPending || !planData ? (
            plan.isError ? (
              <ErrorState compact error={plan.error} onRetry={() => void plan.refetch()} />
            ) : (
              <LoadingState compact />
            )
          ) : (
            <>
              <SelectField
                label={t('workouts.addToPlan.day')}
                value={workout?.id ?? ''}
                onChange={(e) => {
                  setChosenWorkoutId(e.target.value);
                  add.reset();
                }}
                options={planData.workouts.map((w, i) => ({
                  value: w.id,
                  label: `${t('workouts.detail.dayNumber', { n: i + 1 })} · ${w.name}${planData.status === 'active' && i === nextWorkoutIndex(planData) ? ` (${t('workouts.detail.nextBadge')})` : ''}`,
                }))}
              />
              {already ? (
                <Notice tone="info">{t('workouts.addToPlan.alreadyIn')}</Notice>
              ) : full ? (
                <Notice tone="warning">{t('workouts.editor.limitReached', { max: LIMITS.exercisesPerWorkoutMax })}</Notice>
              ) : (
                <p className="muted small" aria-live="polite">
                  {t('workouts.addToPlan.startsWith', {
                    prescription: formatPrescription({ sets: starting.sets ?? 3, repMin: starting.repMin, repMax: starting.repMax, targetSeconds: starting.targetSeconds }, i18n),
                    rest: formatRest(starting.restSeconds ?? 90, i18n),
                  })}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
