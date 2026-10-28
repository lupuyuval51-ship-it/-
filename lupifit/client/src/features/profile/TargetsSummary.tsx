import type { ComputedTargets, TargetNoteCode } from '@shared/nutrition';
import { Stat } from '../../components/ui';
import { useI18n } from '../../i18n';

export interface TargetValues {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

/** Calories and macro targets as a row of stats. */
export function TargetStats({ targets }: { targets: TargetValues }) {
  const { t, formatNumber } = useI18n();
  const g = t('common.units.g');
  return (
    <div className="profile-target-stats">
      <Stat icon="flame" tone="primary" label={t('common.macros.calories')} value={`${formatNumber(targets.calories)} ${t('common.units.kcal')}`} />
      <Stat label={t('common.macros.protein')} value={`${formatNumber(targets.proteinG)} ${g}`} />
      <Stat label={t('common.macros.carbs')} value={`${formatNumber(targets.carbsG)} ${g}`} />
      <Stat label={t('common.macros.fat')} value={`${formatNumber(targets.fatG)} ${g}`} />
      <Stat label={t('common.macros.fiber')} value={`${formatNumber(targets.fiberG)} ${g}`} />
    </div>
  );
}

/** BMR / TDEE (and optionally the safe minimum) behind the recommendation. */
export function EnergyFacts({ computed, showMinimum }: { computed: ComputedTargets; showMinimum?: boolean }) {
  const { t, formatNumber } = useI18n();
  const kcal = t('common.units.kcal');
  return (
    <dl className="kv profile-energy">
      <dt>{t('onboarding.review.bmr')}</dt>
      <dd className="tabular">
        {formatNumber(computed.bmr)} {kcal}
      </dd>
      <dt>{t('onboarding.review.tdee')}</dt>
      <dd className="tabular">
        {formatNumber(computed.tdee)} {kcal}
      </dd>
      {showMinimum && (
        <>
          <dt>{t('settings.targets.minimum')}</dt>
          <dd className="tabular">
            {formatNumber(computed.minimumCalories)} {kcal}
          </dd>
        </>
      )}
    </dl>
  );
}

/** Plain-language explanation of every adjustment made to the computed targets. */
export function TargetNotes({ notes }: { notes: TargetNoteCode[] }) {
  const { t } = useI18n();
  if (notes.length === 0) return null;
  return (
    <ul className="profile-notes">
      {notes.map((code) => (
        <li key={code}>{t(`enums.targetNote.${code}`)}</li>
      ))}
    </ul>
  );
}
