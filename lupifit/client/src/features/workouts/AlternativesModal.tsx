import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ExerciseAlternativeDTO, ExerciseSummaryDTO } from '@shared/types';
import { Badge, Button, EmptyState, ErrorState, LoadingState, Modal, Segmented } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fetchAlternatives, workoutKeys } from './api';

const RELATIONS: ExerciseAlternativeDTO['relation'][] = ['easier', 'harder', 'similar'];

type AltFilter = 'all' | 'easier' | 'harder' | 'fits';

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
  const { t, lt, formatNumber } = useI18n();
  const [filter, setFilter] = useState<AltFilter>('all');
  const query = useQuery({
    queryKey: workoutKeys.alternatives(planId, exercise.id),
    queryFn: ({ signal }) => fetchAlternatives({ planId, workoutId, planExerciseId, exerciseId: exercise.id }, signal),
    enabled: open,
    staleTime: 5 * 60_000,
  });
  const name = lt(exercise.name);
  const all = query.data ?? [];
  const count = (f: AltFilter) => all.filter((a) => (f === 'all' ? true : f === 'fits' ? a.suitable : a.relation === f)).length;
  // Suitable options first inside every group; the filter narrows by difficulty or by fit.
  const visible = all
    .filter((a) => (filter === 'all' ? true : filter === 'fits' ? a.suitable : a.relation === filter))
    .sort((a, b) => Number(b.suitable) - Number(a.suitable));

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
          <Segmented<AltFilter>
            label={t('workouts.alternatives.filter')}
            size="sm"
            value={filter}
            onChange={setFilter}
            options={(['all', 'easier', 'harder', 'fits'] as const).map((f) => ({
              value: f,
              label: `${t(`workouts.alternatives.filters.${f}`)} (${formatNumber(count(f))})`,
            }))}
          />
          <p className="visually-hidden" role="status" aria-live="polite">
            {t('workouts.alternatives.shown', { count: visible.length })}
          </p>
          {visible.length === 0 && <EmptyState compact icon="search" title={t('workouts.alternatives.noneInFilter')} />}
          {RELATIONS.map((relation) => {
            const items = visible.filter((a) => a.relation === relation);
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
