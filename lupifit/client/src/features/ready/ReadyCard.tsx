import { Link } from 'react-router';
import type { ReadyWorkoutSummaryDTO } from '@shared/types';
import { Badge, Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { formatList } from '../exercises/format';

/** Where the detail page's back link returns to (the list with its filters). */
export interface ReadyNavState {
  readyFrom?: string;
}

/**
 * One result. The whole card is a link: the title link is stretched over the card, so its accessible name is
 * just the workout name; the tags and the equipment line are read as part of the card text.
 */
export function ReadyCard({ workout, search, from, index }: { workout: ReadyWorkoutSummaryDTO; search: string; from: string; index: number }) {
  const { t, lt, formatNumber, intlLocale } = useI18n();
  const equipment =
    workout.equipment.length > 0 ? formatList(workout.equipment.map((q) => t(`enums.equipment.${q}`)), intlLocale) : t('ready.card.noEquipment');
  const state: ReadyNavState = { readyFrom: from };
  return (
    <article className="ready-card">
      <h3 className="ready-card-title">
        <Link to={`/workouts/ready/${encodeURIComponent(workout.id)}${search}`} state={state} className="ready-card-link" data-index={index}>
          {lt(workout.name)}
        </Link>
      </h3>
      <p className="ready-card-desc">{lt(workout.description)}</p>
      <ul className="ready-card-tags" aria-label={t('ready.card.details')}>
        <li>
          <Badge tone="primary">{t(`enums.readyFocus.${workout.focus}`)}</Badge>
        </li>
        <li>
          <Badge>{t(`enums.difficulty.${workout.level}`)}</Badge>
        </li>
        <li>
          <Badge icon="clock">
            <span className="num">{t('ready.minutes', { minutes: formatNumber(workout.estimatedMinutes) })}</span>
          </Badge>
        </li>
        <li>
          <Badge>
            <span className="num">{t('ready.card.exercises', { count: workout.exerciseCount })}</span>
          </Badge>
        </li>
        <li>
          <Badge>{t(`enums.trainingMode.${workout.mode}`)}</Badge>
        </li>
      </ul>
      <p className="ready-card-gear small muted">
        <Icon name="dumbbell" size={14} />
        <span>
          <span className="visually-hidden">{t('ready.card.equipment')}: </span>
          {equipment}
        </span>
      </p>
    </article>
  );
}
