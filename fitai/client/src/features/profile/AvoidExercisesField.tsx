import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import type { LocalizedText } from '@shared/types';
import { qk } from '../../api/queryClient';
import { Button, Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { ExercisePicker } from '../exercises/ExercisePicker';
import { fetchExercise } from '../exercises/api';

/**
 * Exercises the user never wants in a plan: removable chips plus an "add" button that
 * opens the shared exercise picker. Names come from the picker selection or, for saved
 * ids, from the exercise library.
 */
/** Localized names for exercise ids (from `known`, else looked up in the library and cached). */
export function useExerciseNames(ids: string[], known: Record<string, LocalizedText> = {}): Record<string, LocalizedText> {
  const lookups = useQueries({
    queries: ids
      .filter((id) => !known[id])
      .map((id) => ({ queryKey: qk.exercise(id), queryFn: () => fetchExercise(id), staleTime: 60 * 60_000 })),
  });
  const names = { ...known };
  for (const q of lookups) if (q.data) names[q.data.id] ??= q.data.name;
  return names;
}

export function AvoidExercisesField({ value, onChange, error }: { value: string[]; onChange(ids: string[]): void; error?: string }) {
  const { t, lt } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [picked, setPicked] = useState<Record<string, LocalizedText>>({});
  const names = useExerciseNames(value, picked);

  return (
    <fieldset className={`field${error ? ' field-invalid' : ''}`}>
      <legend className="field-label">{t('onboarding.fields.avoid')}</legend>
      <p className="field-hint">{t('onboarding.fields.avoidHint')}</p>
      {value.length === 0 ? (
        <p className="empty-inline">{t('onboarding.fields.avoidEmpty')}</p>
      ) : (
        <ul className="chips profile-avoid-list" aria-live="polite">
          {value.map((id) => {
            const name = names[id] ? lt(names[id]) : null;
            return (
              <li key={id} className="chip chip-active profile-avoid-chip">
                <span>{name ?? id}</span>
                <button
                  type="button"
                  className="profile-chip-remove"
                  aria-label={t('onboarding.fields.avoidRemove', { name: name ?? id })}
                  onClick={() => onChange(value.filter((x) => x !== id))}
                >
                  <Icon name="close" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div>
        <Button size="sm" icon="plus" onClick={() => setPickerOpen(true)} disabled={value.length >= 50}>
          {t('onboarding.fields.avoidAdd')}
        </Button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t('onboarding.fields.avoidPickerTitle')}
        excludeIds={value}
        onSelect={(exercise) => {
          setPicked((m) => ({ ...m, [exercise.id]: exercise.name }));
          onChange([...value, exercise.id]);
        }}
      />
    </fieldset>
  );
}
