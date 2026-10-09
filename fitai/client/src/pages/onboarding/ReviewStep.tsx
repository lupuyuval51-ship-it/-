import type { ReactNode } from 'react';
import { computeNutritionTargets } from '@shared/nutrition';
import { onboardingSchema } from '@shared/schemas/profile';
import { Button } from '../../components/ui';
import { useExerciseNames } from '../../features/profile/AvoidExercisesField';
import { ONBOARDING_STEPS, toPayload, type ProfileDraft } from '../../features/profile/draft';
import { EnergyFacts, TargetNotes, TargetStats } from '../../features/profile/TargetsSummary';
import { formatHeight } from '../../features/profile/units';
import { useUnits } from '../../hooks/useUnits';
import { useI18n, type TKey } from '../../i18n';

const targetInputSchema = onboardingSchema.pick({ ageYears: true, sex: true, heightCm: true, weightKg: true, activityLevel: true, goal: true });

/** Live preview of the daily targets the server will compute from these answers. */
export function previewTargets(draft: ProfileDraft) {
  const parsed = targetInputSchema.safeParse(toPayload(draft));
  return parsed.success ? computeNutritionTargets(parsed.data) : null;
}

type StepId = Exclude<(typeof ONBOARDING_STEPS)[number]['id'], 'review'>;

export function ReviewStep({ draft, onEdit }: { draft: ProfileDraft; onEdit(stepIndex: number): void }) {
  const i18n = useI18n();
  const { t, tx, lt, formatNumber, intlLocale } = i18n;
  const { imperial, formatWeight } = useUnits();
  const exerciseNames = useExerciseNames(draft.avoidExerciseIds);

  const notAnswered = <span className="muted">{t('onboarding.review.notAnswered')}</span>;
  const list = (items: string[]) =>
    items.length === 0 ? <span className="muted">{t('onboarding.review.none')}</span> : new Intl.ListFormat(intlLocale, { type: 'conjunction' }).format(items);
  const text = (s: string) => (s.trim() ? s : <span className="muted">{t('onboarding.review.none')}</span>);
  const num = (n: number | null, unit?: string) => (n == null ? notAnswered : `${formatNumber(n)}${unit ? ` ${unit}` : ''}`);
  const enumLabel = (group: string, value: string | null) => (value == null ? notAnswered : tx(`enums.${group}.${value}`));
  const days = (d: number[]) => list(d.map((x) => tx(`common.time.weekdaysShort.${x}`)));

  const a = draft.ability;
  const abilityItems = [
    a.pushUpsMax != null && `${t('onboarding.fields.pushUps')}: ${formatNumber(a.pushUpsMax)}`,
    a.pullUpsMax != null && `${t('onboarding.fields.pullUps')}: ${formatNumber(a.pullUpsMax)}`,
    a.plankSeconds != null && `${t('onboarding.fields.plankSeconds')}: ${formatNumber(a.plankSeconds)} ${t('common.units.sec')}`,
    a.squat1rmKg != null && `${t('onboarding.fields.squat1rm')}: ${formatWeight(a.squat1rmKg)}`,
    a.bench1rmKg != null && `${t('onboarding.fields.bench1rm')}: ${formatWeight(a.bench1rmKg)}`,
    a.deadlift1rmKg != null && `${t('onboarding.fields.deadlift1rm')}: ${formatWeight(a.deadlift1rmKg)}`,
  ].filter((x): x is string => Boolean(x));

  const sections: Record<StepId, [TKey, ReactNode][]> = {
    about: [
      ['onboarding.fields.age', num(draft.ageYears)],
      ['onboarding.fields.sex', enumLabel('sex', draft.sex)],
      ['onboarding.fields.height', draft.heightCm == null ? notAnswered : formatHeight(draft.heightCm, imperial, t('common.units.cm'))],
      ['onboarding.fields.weight', draft.weightKg == null ? notAnswered : formatWeight(draft.weightKg)],
    ],
    experience: [
      ['onboarding.fields.experience', enumLabel('experience', draft.experienceLevel)],
      ['onboarding.fields.abilityTitle', list(abilityItems)],
    ],
    goal: [['onboarding.fields.goal', enumLabel('goal', draft.goal)]],
    training: [
      ['onboarding.fields.location', enumLabel('location', draft.trainingLocation)],
      ['onboarding.fields.equipment', list(draft.equipment.map((e) => t(`enums.equipment.${e}`)))],
      ['onboarding.fields.daysPerWeek', num(draft.daysPerWeek)],
      ['onboarding.fields.sessionMinutes', num(draft.sessionMinutes, t('common.units.min'))],
      ['onboarding.fields.preferredDays', days(draft.preferredDays)],
      ['onboarding.fields.weeklyGoal', num(draft.weeklyWorkoutGoal)],
    ],
    preferences: [
      ['onboarding.fields.focusGroups', list(draft.focusMuscleGroups.map((g) => t(`enums.muscleGroup.${g}`)))],
      ['onboarding.fields.likes', text(draft.exerciseLikes)],
      ['onboarding.fields.dislikes', text(draft.exerciseDislikes)],
      ['onboarding.fields.avoid', list(draft.avoidExerciseIds.map((id) => (exerciseNames[id] ? lt(exerciseNames[id]) : id)))],
      ['onboarding.fields.injuries', list(draft.injuries.map((i) => t(`enums.injury.${i}`)))],
      ['onboarding.fields.injuryNotes', text(draft.injuryNotes)],
      ['onboarding.fields.limitations', text(draft.limitations)],
    ],
    nutrition: [
      ['onboarding.fields.dietType', enumLabel('diet', draft.dietType)],
      ['onboarding.fields.allergies', list(draft.allergies.map((x) => t(`enums.allergen.${x}`)))],
      ['onboarding.fields.restrictions', list(draft.dietaryRestrictions.map((x) => t(`enums.restriction.${x}`)))],
      ['onboarding.fields.dislikedFoods', text(draft.dislikedFoods)],
      ['onboarding.fields.mealsPerDay', num(draft.mealsPerDay)],
      ['onboarding.fields.activity', enumLabel('activity', draft.activityLevel)],
      ['onboarding.fields.occupation', enumLabel('occupation', draft.occupationActivity)],
      ['onboarding.fields.sleepHours', num(draft.sleepHours, t('common.units.hours'))],
      ['onboarding.fields.stress', draft.stressLevel ? t(`enums.stress.${draft.stressLevel}`) : <span className="muted">{t('onboarding.fields.stressUnset')}</span>],
    ],
  };

  const computed = previewTargets(draft);

  return (
    <div className="stack">
      <p className="muted">{t('onboarding.review.intro')}</p>
      <div className="onboarding-review">
        {(Object.keys(sections) as StepId[]).map((id) => {
          const index = ONBOARDING_STEPS.findIndex((s) => s.id === id);
          const title = t(`onboarding.steps.${id}.title`);
          return (
            <section key={id} className="onboarding-review-section" aria-labelledby={`review-${id}`}>
              <div className="row-between">
                <h3 className="section-title" id={`review-${id}`}>
                  {title}
                </h3>
                <Button size="sm" variant="ghost" icon="edit" onClick={() => onEdit(index)} aria-label={t('onboarding.actions.editStep', { step: title })}>
                  {t('onboarding.actions.edit')}
                </Button>
              </div>
              <dl className="kv">
                {sections[id].map(([label, value]) => (
                  <div key={label} className="profile-kv-row">
                    <dt>{t(label)}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      <section className="onboarding-targets" aria-labelledby="review-targets" aria-live="polite">
        <h3 className="section-title" id="review-targets">
          {t('onboarding.review.targetsTitle')}
        </h3>
        {computed ? (
          <div className="stack">
            <p className="muted small">{t('onboarding.review.targetsIntro')}</p>
            <TargetStats targets={computed} />
            <EnergyFacts computed={computed} />
            <div>
              <h4 className="profile-subheading">{t('onboarding.review.howCalculated')}</h4>
              <TargetNotes notes={computed.notes} />
            </div>
          </div>
        ) : (
          <p className="muted">{t('onboarding.review.targetsUnavailable')}</p>
        )}
      </section>
    </div>
  );
}
