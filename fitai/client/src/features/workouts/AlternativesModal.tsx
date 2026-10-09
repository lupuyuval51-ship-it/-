import { useQuery } from '@tanstack/react-query';
import type { ExerciseAlternativeDTO, ExerciseSummaryDTO } from '@shared/types';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Modal } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fetchAlternatives, workoutKeys } from './api';

const RELATIONS: ExerciseAlternativeDTO['relation'][] = ['easier', 'harder', 'similar'];

/**
 * Replacement picker for one exercise of a day being edited: easier / harder variations
 * and similar exercises from the library, each with its suitability for the user.
 */
export function AlternativesModal({
  open,
  onClose,
  planId,
  workoutId,
  planExerciseId,
  exercise,
  excludeIds,
  onSelect,
  onBrowse,
}: {
  open: boolean;
  onClose(): void;
  planId: string;
  workoutId: string;
  /** Saved row id, or null for a row that is not saved yet. */
  planExerciseId: string | null;
  exercise: ExerciseSummaryDTO;
  /** Exercises already in the day (cannot be chosen twice). */
  excludeIds: string[];
  onSelect(e: ExerciseSummaryDTO): void;
  onBrowse(): void;
}) {
  const { t, lt } = useI18n();
  const query = useQuery({
    queryKey: workoutKeys.alternatives(planId, exercise.id),
    queryFn: ({ signal }) => fetchAlternatives({ planId, workoutId, planExerciseId, exerciseId: exercise.id }, signal),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const name = lt(exercise.name);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('workouts.alternatives.title', { name })}
      size="lg"
      footer={
        <Button icon="search" onClick={onBrowse}>
          {t('workouts.alternatives.browse')}
        </Button>
      }
    >
      <p className="muted small alt-intro">{t('workouts.alternatives.intro')}</p>
      {query.isPending ? (
        <LoadingState compact />
      ) : query.isError ? (
        <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState compact icon="search" title={t('workouts.alternatives.none')} />
      ) : (
        <div className="stack">
          {RELATIONS.map((relation) => {
            const items = query.data.filter((a) => a.relation === relation);
            if (!items.length) return null;
            return (
              <section key={relation} aria-labelledby={`alt-${relation}`}>
                <h3 className="section-title" id={`alt-${relation}`}>
                  {t(`workouts.alternatives.${relation}`)}
                </h3>
                <ul className="list">
                  {items.map((a) => {
                    const altName = lt(a.exercise.name);
                    const taken = excludeIds.includes(a.exercise.id);
                    return (
                      <li key={a.exercise.id} className="list-item alt-item">
                        <div className="picker-item-body">
                          <strong>{altName}</strong>
                          <div className="row small muted">
                            <span>{a.exercise.primaryMuscles.map((m) => t(`enums.muscle.${m}`)).join(' · ')}</span>
                            <Badge tone={a.exercise.difficulty === 'beginner' ? 'success' : a.exercise.difficulty === 'intermediate' ? 'info' : 'warning'}>
                              {t(`enums.difficulty.${a.exercise.difficulty}`)}
                            </Badge>
                          </div>
                          <div className="row small">
                            {a.suitable ? (
                              <Badge tone="success" icon="check">
                                {t('workouts.alternatives.suitable')}
                              </Badge>
                            ) : (
                              <Badge tone="warning" icon="warning">
                                {t('workouts.alternatives.unsuitable')}
                              </Badge>
                            )}
                            {a.missingEquipment.length > 0 && (
                              <span className="muted">{t('workouts.alternatives.missing', { items: a.missingEquipment.map((q) => t(`enums.equipment.${q}`)).join(', ') })}</span>
                            )}
                            {!a.suitable && a.missingEquipment.length === 0 && <span className="muted">{t('workouts.alternatives.injury')}</span>}
                          </div>
                        </div>
                        {taken ? (
                          <span className="small muted">{t('workouts.alternatives.inWorkout')}</span>
                        ) : (
                          <Button size="sm" variant={a.suitable ? 'primary' : 'secondary'} onClick={() => onSelect(a.exercise)} aria-label={t('workouts.alternatives.useLabel', { name: altName })}>
                            {t('workouts.alternatives.use')}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
