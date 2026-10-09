import type { MouseEventHandler } from 'react';
import { Link } from 'react-router';
import type { Difficulty } from '@shared/constants';
import type { ExerciseListItemDTO } from '@shared/types';
import { Badge, Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { formatList } from './format';
import type { LibraryNavState } from './navigation';

export const DIFFICULTY_TONE: Record<Difficulty, 'success' | 'info' | 'warning'> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'warning',
};

/**
 * Library result card. The whole card is clickable through the title link (stretched
 * over the card), so the link's accessible name is just the exercise name.
 */
export function ExerciseCard({
  exercise,
  navState,
  index,
  onNavigate,
  headingLevel = 'h3',
}: {
  exercise: ExerciseListItemDTO;
  navState?: LibraryNavState;
  /** Position in the result list (used to move focus to newly loaded results). */
  index?: number;
  onNavigate?: MouseEventHandler<HTMLAnchorElement>;
  headingLevel?: 'h3' | 'h4';
}) {
  const { t, lt, intlLocale } = useI18n();
  const Heading = headingLevel;
  const ctx = exercise.userContext;
  const equipment =
    exercise.equipment.length > 0 ? formatList(exercise.equipment.map((q) => t(`enums.equipment.${q}`)), intlLocale) : t('exercises.card.noEquipment');
  const injuries = ctx ? formatList(ctx.injuryConflicts.map((a) => t(`enums.injury.${a}`)), intlLocale) : '';
  return (
    <article className="card ex-card">
      <div className="ex-card-head">
        <Heading className="ex-card-title">
          <Link to={`/exercises/${exercise.id}`} state={navState} className="ex-card-link" data-index={index} onClick={onNavigate}>
            {lt(exercise.name)}
          </Link>
        </Heading>
        <Badge tone={DIFFICULTY_TONE[exercise.difficulty]}>{t(`enums.difficulty.${exercise.difficulty}`)}</Badge>
      </div>
      <p className="ex-card-muscles">{exercise.primaryMuscles.map((m) => t(`enums.muscle.${m}`)).join(' · ')}</p>
      <dl className="ex-card-meta">
        <div className="ex-card-meta-item">
          <dt>
            <Icon name="dumbbell" size={14} />
            <span className="visually-hidden">{t('exercises.card.equipment')}</span>
          </dt>
          <dd>{equipment}</dd>
        </div>
        <div className="ex-card-meta-item">
          <dt>
            <Icon name="target" size={14} />
            <span className="visually-hidden">{t('exercises.card.category')}</span>
          </dt>
          <dd>{t(`enums.category.${exercise.category}`)}</dd>
        </div>
      </dl>
      {ctx && (!ctx.hasRequiredEquipment || ctx.injuryConflicts.length > 0) && (
        <div className="ex-card-fit">
          {!ctx.hasRequiredEquipment && <Badge icon="info">{t('exercises.card.missingEquipment')}</Badge>}
          {ctx.injuryConflicts.length > 0 && (
            <Badge tone="warning" icon="warning">
              {t('exercises.card.injuryCaution', { areas: injuries })}
            </Badge>
          )}
        </div>
      )}
    </article>
  );
}
