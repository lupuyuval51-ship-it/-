import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { isWorkoutFocus } from '@shared/schemas/workouts';
import type { PlanExerciseDTO, PlanWorkoutDTO } from '@shared/types';
import { Badge, Button, Card, EmptyState, IconButton } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { focusLabel, formatPrescription, formatRest } from './format';

export interface DayActions {
  onStart(): void;
  onEdit(): void;
  onDuplicate(): void;
  onRegenerate(): void;
  onDelete(): void;
  onMove(dir: -1 | 1): void;
}

/** Read-only view of one workout day with its exercises and day-level actions. */
export function WorkoutDayCard({
  workout,
  dayNumber,
  dayCount,
  isNext,
  startPending,
  busy,
  locked,
  maxDaysReached,
  focusEdit = false,
  onEditFocused,
  actions,
}: {
  workout: PlanWorkoutDTO;
  dayNumber: number;
  dayCount: number;
  isNext: boolean;
  startPending: boolean;
  /** Another plan mutation is running. */
  busy: boolean;
  /** Another day is being edited. */
  locked: boolean;
  maxDaysReached: boolean;
  /** Move keyboard focus to "Edit day" (after this day's editor closed). */
  focusEdit?: boolean;
  onEditFocused?(): void;
  actions: DayActions;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const editRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!focusEdit) return;
    editRef.current?.focus();
    onEditFocused?.();
  }, [focusEdit, onEditFocused]);
  const focus = focusLabel(workout.focus, i18n);
  const canRegenerate = isWorkoutFocus(workout.focus);
  const disabled = busy || locked;

  return (
    <Card
      as="article"
      className={`day-card${isNext ? ' day-card-next' : ''}`}
      title={workout.name}
      subtitle={
        <span className="row">
          <span>{t('workouts.detail.dayNumber', { n: dayNumber })}</span>
          {focus && focus !== workout.name && <Badge>{focus}</Badge>}
          {isNext && (
            <Badge tone="primary" icon="target">
              {t('workouts.detail.nextBadge')}
            </Badge>
          )}
          {workout.estimatedMinutes != null && (
            <Badge icon="clock">{t('workouts.detail.estimated', { minutes: workout.estimatedMinutes })}</Badge>
          )}
        </span>
      }
      actions={
        <div className="day-move">
          <IconButton icon="arrowUp" size="sm" label={t('workouts.actions.moveDayUp')} onClick={() => actions.onMove(-1)} disabled={disabled || dayNumber === 1} />
          <IconButton icon="arrowDown" size="sm" label={t('workouts.actions.moveDayDown')} onClick={() => actions.onMove(1)} disabled={disabled || dayNumber === dayCount} />
        </div>
      }
    >
      {workout.notes && <p className="day-notes">{workout.notes}</p>}
      {workout.exercises.length === 0 ? (
        <EmptyState compact icon="dumbbell" title={t('workouts.detail.noExercisesTitle')} body={t('workouts.detail.noExercisesBody')} />
      ) : (
        <ol className="exercise-list">
          {workout.exercises.map((x, i) => (
            <ExerciseRow key={x.id} x={x} index={i} />
          ))}
        </ol>
      )}
      <div className="day-actions">
        <Button variant="primary" icon="play" onClick={actions.onStart} loading={startPending} disabled={disabled || workout.exercises.length === 0}>
          {t('workouts.actions.startThis')}
        </Button>
        <Button ref={editRef} icon="edit" onClick={actions.onEdit} disabled={disabled}>
          {t('workouts.actions.editDay')}
        </Button>
        <Button icon="copy" variant="ghost" onClick={actions.onDuplicate} disabled={disabled || maxDaysReached}>
          {t('workouts.actions.duplicateDay')}
        </Button>
        <Button
          icon="refresh"
          variant="ghost"
          onClick={actions.onRegenerate}
          disabled={disabled || !canRegenerate}
          title={canRegenerate ? undefined : t('workouts.detail.regenerateUnavailable')}
        >
          {t('workouts.actions.regenerateDay')}
        </Button>
        <Button icon="trash" variant="ghost" className="btn-danger-text" onClick={actions.onDelete} disabled={disabled || dayCount <= 1}>
          {t('workouts.actions.deleteDay')}
        </Button>
      </div>
      {locked && <p className="small muted">{t('workouts.detail.editingOther')}</p>}
    </Card>
  );
}

function ExerciseRow({ x, index }: { x: PlanExerciseDTO; index: number }) {
  const i18n = useI18n();
  const { t, lt, formatNumber } = i18n;
  const { formatWeight } = useUnits();
  const name = lt(x.exercise.name);
  return (
    <li className="exercise-row">
      <span className="exercise-index" aria-hidden="true">
        {formatNumber(index + 1)}
      </span>
      <div className="exercise-body">
        <Link to={`/exercises/${encodeURIComponent(x.exerciseId)}`} className="exercise-name link" aria-label={t('workouts.exercise.openDetails', { name })}>
          {name}
        </Link>
        <div className="small muted">{x.exercise.primaryMuscles.map((m) => t(`enums.muscle.${m}`)).join(' · ')}</div>
        <div className="exercise-meta">
          <strong className="num">
            <span className="visually-hidden">{t('workouts.exercise.prescriptionLabel')}: </span>
            {formatPrescription(x, i18n)}
          </strong>
          <span>{t('workouts.exercise.rest', { rest: formatRest(x.restSeconds, i18n) })}</span>
          {x.targetRpe != null && <span>{t('workouts.exercise.rpe', { rpe: formatNumber(x.targetRpe) })}</span>}
          {x.targetWeightKg != null && <span>{t('workouts.exercise.weight', { weight: formatWeight(x.targetWeightKg) })}</span>}
        </div>
        {x.notes && <p className="exercise-notes small">{x.notes}</p>}
      </div>
    </li>
  );
}
