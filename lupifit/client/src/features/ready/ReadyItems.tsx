import { Link } from 'react-router';
import type { ReadyItemDTO } from '@shared/types';
import { Badge } from '../../components/ui';
import { useI18n } from '../../i18n';
import { ExerciseTile } from '../workouts/ExerciseRow';
import { formatPrescription, formatRest } from '../workouts/format';

/** The ordered exercises (or sport stations) of a ready workout. */
export function ReadyItemList({ items, label }: { items: ReadyItemDTO[]; label: string }) {
  return (
    <ol className="exercise-list ready-items" aria-label={label}>
      {items.map((item, i) => (
        <ReadyItemRow key={`${i}-${item.exercise.id}`} item={item} index={i} />
      ))}
    </ol>
  );
}

/** One exercise: name (a link to the exercise page), sets x reps or time, rest, RPE and the short cue. */
export function ReadyItemRow({ item, index }: { item: ReadyItemDTO; index: number }) {
  const i18n = useI18n();
  const { t, lt, formatNumber } = i18n;
  const { exercise } = item;
  return (
    <li className="exercise-row ready-item">
      <ExerciseTile exerciseId={exercise.id} muscles={exercise.primaryMuscles} index={index} />
      <div className="exercise-body">
        <div className="ready-item-head">
          <Link to={`/exercises/${encodeURIComponent(exercise.id)}`} className="exercise-name link">
            {lt(exercise.name)}
          </Link>
          {item.substitutedFrom && <Badge icon="swap">{t('ready.detail.swapped')}</Badge>}
        </div>
        <div className="exercise-meta">
          <strong className="num exercise-rx">
            <span className="visually-hidden">{t('workouts.exercise.prescriptionLabel')}: </span>
            {formatPrescription(item, i18n)}
          </strong>
          <span>{t('workouts.exercise.rest', { rest: formatRest(item.restSeconds, i18n) })}</span>
          {item.targetRpe != null && <span>{t('workouts.exercise.rpe', { rpe: formatNumber(item.targetRpe) })}</span>}
        </div>
        {item.cue && <p className="exercise-notes small">{lt(item.cue)}</p>}
      </div>
    </li>
  );
}
