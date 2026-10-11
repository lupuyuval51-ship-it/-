import type { Equipment, ExperienceLevel, Goal, MuscleGroup, TrainingLocation } from '@shared/constants';
import { chooseSplit } from '@shared/split';
import { Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { focusLabel } from './format';

export interface PreviewInput {
  goal: Goal;
  daysPerWeek: number;
  sessionMinutes: number | null;
  location: TrainingLocation;
  equipment: Equipment[];
  focusMuscleGroups: MuscleGroup[];
}

/**
 * "What you are about to get": the settings the plan will be built from and the weekly
 * split the training engine will choose for them (same rule as the server).
 */
export function PlanPreview({ input, experience }: { input: PreviewInput; experience: ExperienceLevel | null }) {
  const i18n = useI18n();
  const { t, formatNumber } = i18n;
  const split = chooseSplit(input.daysPerWeek, experience ?? 'beginner', input.goal);
  const days = split.focuses.length;
  const focusNames = split.focuses.map((f) => focusLabel(f, i18n));
  const rows: { label: string; value: string }[] = [
    { label: t('workouts.generator.goal'), value: t(`enums.goal.${input.goal}`) },
    { label: t('workouts.preview.schedule'), value: t('workouts.preview.scheduleValue', { days: formatNumber(days), minutes: input.sessionMinutes != null ? formatNumber(input.sessionMinutes) : '–' }) },
    { label: t('workouts.preview.split'), value: `${t(`enums.splitType.${split.splitType}`)}: ${focusNames.join(' · ')}` },
    {
      label: t('workouts.preview.where'),
      value:
        input.equipment.length > 0
          ? t('workouts.preview.whereValue', { location: t(`enums.location.${input.location}`), count: formatNumber(input.equipment.length) })
          : t('workouts.preview.bodyweight', { location: t(`enums.location.${input.location}`) }),
    },
  ];
  if (input.focusMuscleGroups.length > 0) {
    rows.push({ label: t('workouts.generator.focus'), value: input.focusMuscleGroups.map((g) => t(`enums.muscleGroup.${g}`)).join(' · ') });
  }
  return (
    <div className="ux-preview" aria-live="polite">
      <dl className="ux-preview-list">
        {rows.map((r) => (
          <div key={r.label} className="ux-preview-row">
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="ux-preview-note small muted">
        <Icon name="info" size={16} />
        <span>{t('workouts.preview.note')}</span>
      </p>
    </div>
  );
}
