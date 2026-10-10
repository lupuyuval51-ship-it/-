import { Link } from 'react-router';
import { hasAnimation } from '@shared/animation/data/index';
import type { PlanExerciseDTO } from '@shared/types';
import { Button, Icon } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { ExerciseThumb } from '../animation/ExerciseAnimation';
import { formatPrescription, formatRest } from './format';

/** Animated (or placeholder) preview tile with the exercise number. Decorative: the name link carries the meaning. */
export function ExerciseTile({ exerciseId, muscles, index }: { exerciseId: string; muscles: PlanExerciseDTO['exercise']['primaryMuscles']; index?: number }) {
  const { formatNumber } = useI18n();
  return (
    <div className="exercise-tile" aria-hidden="true">
      {hasAnimation(exerciseId) ? (
        <ExerciseThumb exerciseId={exerciseId} muscles={muscles} />
      ) : (
        <span className="anim-thumb exercise-tile-fallback">
          <Icon name="dumbbell" size={26} />
        </span>
      )}
      {index != null && <span className="exercise-index">{formatNumber(index + 1)}</span>}
    </div>
  );
}

/** One prescribed exercise: demo thumbnail, name, muscle/equipment chips and the sets x reps prescription. */
export function ExerciseRow({ x, index, onSwap, swapDisabled = false }: { x: PlanExerciseDTO; index: number; onSwap?: () => void; swapDisabled?: boolean }) {
  const i18n = useI18n();
  const { t, lt, formatNumber } = i18n;
  const { formatWeight } = useUnits();
  const name = lt(x.exercise.name);
  return (
    <li className="exercise-row">
      <ExerciseTile exerciseId={x.exerciseId} muscles={x.exercise.primaryMuscles} index={index} />
      <div className="exercise-body">
        <Link to={`/exercises/${encodeURIComponent(x.exerciseId)}`} className="exercise-name link" aria-label={t('workouts.exercise.openDetails', { name })}>
          {name}
        </Link>
        <div className="wk-chips">
          {x.exercise.primaryMuscles.map((m) => (
            <span key={m} className="wk-chip wk-chip-muscle">
              {t(`enums.muscle.${m}`)}
            </span>
          ))}
          <span className="wk-chip">
            {x.exercise.equipment.length > 0 ? x.exercise.equipment.map((q) => t(`enums.equipment.${q}`)).join(' · ') : t('exercises.card.noEquipment')}
          </span>
        </div>
        <div className="exercise-meta">
          <strong className="num exercise-rx">
            <span className="visually-hidden">{t('workouts.exercise.prescriptionLabel')}: </span>
            {formatPrescription(x, i18n)}
          </strong>
          <span>{t('workouts.exercise.rest', { rest: formatRest(x.restSeconds, i18n) })}</span>
          {x.targetRpe != null && <span>{t('workouts.exercise.rpe', { rpe: formatNumber(x.targetRpe) })}</span>}
          {x.targetWeightKg != null && <span>{t('workouts.exercise.weight', { weight: formatWeight(x.targetWeightKg) })}</span>}
        </div>
        {x.notes && <p className="exercise-notes small">{x.notes}</p>}
      </div>
      {onSwap && (
        <Button size="sm" variant="ghost" icon="swap" className="ux-swap" onClick={onSwap} disabled={swapDisabled} aria-label={t('workouts.exercise.swapLabel', { name })}>
          {t('workouts.exercise.swap')}
        </Button>
      )}
    </li>
  );
}
