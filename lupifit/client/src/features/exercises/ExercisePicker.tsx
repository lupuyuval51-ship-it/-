import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { MUSCLE_GROUPS, type MuscleGroup } from '@shared/constants';
import type { ExerciseSummaryDTO } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Badge, Button, EmptyState, ErrorState, Icon, LoadingState, Modal, Segmented, Switch } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fetchExercises } from './api';

/**
 * Modal for choosing an exercise from the library (used by plan editing and live
 * sessions). Searches in Hebrew and English, filters by muscle group, and can restrict
 * results to the user's own equipment.
 */
export function ExercisePicker({
  open,
  onClose,
  onSelect,
  excludeIds = [],
  title,
}: {
  open: boolean;
  onClose(): void;
  onSelect(exercise: ExerciseSummaryDTO): void;
  excludeIds?: string[];
  title?: string;
}) {
  const { t, lt } = useI18n();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<MuscleGroup | 'all'>('all');
  const [availableOnly, setAvailableOnly] = useState(true);
  const deferredQ = useDeferredValue(q.trim());
  const params = { q: deferredQ || undefined, muscleGroup: group === 'all' ? undefined : group, availableOnly, pageSize: 60 };
  const query = useQuery({
    queryKey: qk.exercises(params),
    queryFn: ({ signal }) => fetchExercises(params, signal),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const items = (query.data?.items ?? []).filter((e) => !excludeIds.includes(e.id));

  return (
    <Modal open={open} onClose={onClose} title={title ?? t('exercises.picker.title')} size="lg">
      <div className="stack">
        <div className="input-group">
          <input
            className="input"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label={t('exercises.picker.searchLabel')}
            placeholder={t('exercises.picker.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
        <Segmented<MuscleGroup | 'all'>
          label={t('exercises.picker.muscleGroup')}
          size="sm"
          value={group}
          onChange={setGroup}
          options={[{ value: 'all' as const, label: t('exercises.picker.allGroups') }, ...MUSCLE_GROUPS.map((g) => ({ value: g, label: t(`enums.muscleGroup.${g}`) }))]}
        />
        <Switch label={t('exercises.picker.availableOnly')} checked={availableOnly} onChange={setAvailableOnly} />
        {query.isPending ? (
          <LoadingState compact />
        ) : query.isError ? (
          <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState compact icon="search" title={t('exercises.picker.noResults')} />
        ) : (
          <>
            <p className="muted small" aria-live="polite">
              {t('exercises.picker.results', { count: items.length })}
            </p>
            <ul className="list picker-list">
              {items.map((e) => (
                <li key={e.id} className="list-item">
                  <div className="picker-item-body">
                    <strong>{lt(e.name)}</strong>
                    <div className="row small muted">
                      {e.primaryMuscles.slice(0, 2).map((m) => t(`enums.muscle.${m}`)).join(' · ')}
                      <Badge tone={e.difficulty === 'beginner' ? 'success' : e.difficulty === 'intermediate' ? 'info' : 'warning'}>{t(`enums.difficulty.${e.difficulty}`)}</Badge>
                      {e.equipment.length === 0 && <Badge>{t('enums.noEquipment')}</Badge>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      onSelect(e);
                      onClose();
                    }}
                    aria-label={`${t('exercises.picker.select')}: ${lt(e.name)}`}
                  >
                    <Icon name="plus" size={16} />
                    {t('exercises.picker.select')}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Modal>
  );
}
