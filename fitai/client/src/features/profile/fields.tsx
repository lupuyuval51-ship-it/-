/**
 * Profile questionnaire fields, shared by the onboarding wizard and the profile page so
 * both always offer the same choices, units and validation messages. Every control sits in
 * a `data-field` container so the first invalid field can be focused.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  ACTIVITY_LEVELS,
  ADULT_AGE,
  ALLERGENS,
  DIET_TYPES,
  DIETARY_RESTRICTIONS,
  EQUIPMENT,
  EXPERIENCE_LEVELS,
  GOALS,
  INJURY_AREAS,
  LIMITS,
  LOCATIONS,
  MUSCLE_GROUPS,
  OCCUPATION_ACTIVITY,
  SEXES,
  STRESS_LEVELS,
  type StressLevel,
} from '@shared/constants';
import { weekStartsOn } from '@shared/dates';
import { Button, ChipGroup, Notice, NumberField, RadioCards, Segmented, SelectField, TextAreaField } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { withDaysPerWeek, withLocation, type ProfileDraft } from './draft';
import { AvoidExercisesField } from './AvoidExercisesField';
import { cmToFeetInches, displayToKg, feetInchesToCm, kgToDisplay } from './units';
import type { FieldErrors } from './validation';

export interface FieldsProps<K extends keyof ProfileDraft> {
  values: Pick<ProfileDraft, K>;
  onChange(patch: Partial<Pick<ProfileDraft, K>>): void;
  errors: FieldErrors;
}

/**
 * Container used to find and focus the first invalid control. With `error`, the group control
 * inside (radiogroup / fieldset of a segmented control, chips or cards, which have no error slot
 * of their own) is marked invalid and described by the error text.
 */
export function FieldSlot({ name, children, className, error }: { name: string; children: ReactNode; className?: string; error?: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    const group = root?.querySelector<HTMLElement>('[role="radiogroup"], fieldset');
    if (!root || !group) return;
    const errorEl = error ? root.querySelector<HTMLElement>('.field-error') : null;
    if (errorEl) {
      errorEl.id ||= `${name}-error`;
      if (group.dataset.prevDescribedby === undefined) group.dataset.prevDescribedby = group.getAttribute('aria-describedby') ?? '';
      group.setAttribute('aria-invalid', 'true');
      group.setAttribute('aria-describedby', errorEl.id);
    } else if (group.dataset.prevDescribedby !== undefined) {
      group.removeAttribute('aria-invalid');
      if (group.dataset.prevDescribedby) group.setAttribute('aria-describedby', group.dataset.prevDescribedby);
      else group.removeAttribute('aria-describedby');
      delete group.dataset.prevDescribedby;
    }
  }, [error, name]);
  return (
    <div data-field={name} className={className} ref={ref}>
      {children}
    </div>
  );
}

/** Error line for controls that have no built-in error slot (segmented controls). */
export function InlineError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <p className="field-error" role="alert">
      {error}
    </p>
  );
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Weekday chip options in the locale's week order (Sunday first in Hebrew). */
export function useWeekdayOptions(format: 'short' | 'long' = 'short') {
  const { tx, locale } = useI18n();
  const start = weekStartsOn(locale);
  return range(0, 6)
    .map((i) => (i + start) % 7)
    .map((d) => ({ value: String(d), label: tx(`common.time.${format === 'short' ? 'weekdaysShort' : 'weekdays'}.${d}`) }));
}

// ---------------------------------------------------------------- Height & weight

export function HeightField({ value, onChange, error }: { value: number | null; onChange(cm: number | null): void; error?: string }) {
  const { t } = useI18n();
  const { imperial } = useUnits();
  const groupId = useId();
  const initial = value == null ? { ft: null, in: null } : cmToFeetInches(value);
  const [ft, setFt] = useState<number | null>(initial.ft);
  const [inches, setInches] = useState<number | null>(initial.in);

  // Re-sync the feet/inches inputs when the stored value changes from outside (e.g. reset).
  useEffect(() => {
    if (!imperial) return;
    if (feetInchesToCm(ft, inches) === value) return;
    const next = value == null ? { ft: null, in: null } : cmToFeetInches(value);
    setFt(next.ft);
    setInches(next.in);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, imperial]);

  if (!imperial) {
    return (
      <FieldSlot name="heightCm">
        <NumberField
          label={t('onboarding.fields.height')}
          value={value}
          onChange={onChange}
          unit={t('common.units.cm')}
          step={0.1}
          min={LIMITS.heightCmMin}
          max={LIMITS.heightCmMax}
          error={error}
          required
          name="heightCm"
        />
      </FieldSlot>
    );
  }
  return (
    <FieldSlot name="heightCm">
      <fieldset className={`field${error ? ' field-invalid' : ''}`} aria-describedby={error ? `${groupId}-error` : undefined}>
        <legend className="field-label">
          {t('onboarding.fields.height')}
          <span className="field-required" aria-hidden="true">
            {' '}
            *
          </span>
        </legend>
        <div className="profile-height-imperial">
          <NumberField
            label={t('onboarding.fields.heightFeet')}
            value={ft}
            onChange={(v) => {
              setFt(v);
              onChange(feetInchesToCm(v, inches));
            }}
            unit={t('onboarding.units.ft')}
            min={3}
            max={7}
            name="heightFt"
          />
          <NumberField
            label={t('onboarding.fields.heightInches')}
            value={inches}
            onChange={(v) => {
              setInches(v);
              onChange(feetInchesToCm(ft, v));
            }}
            unit={t('onboarding.units.in')}
            min={0}
            max={11}
            name="heightIn"
          />
        </div>
        {error && (
          <p className="field-error" id={`${groupId}-error`} role="alert">
            {error}
          </p>
        )}
      </fieldset>
    </FieldSlot>
  );
}

/** Weight input in the user's unit; reports kg. */
export function WeightInput({
  label,
  valueKg,
  onChange,
  error,
  required,
  name,
  hint,
}: {
  label: ReactNode;
  valueKg: number | null;
  onChange(kg: number | null): void;
  error?: string;
  required?: boolean;
  name: string;
  hint?: ReactNode;
}) {
  const { imperial, weightUnit } = useUnits();
  return (
    <NumberField
      label={label}
      value={kgToDisplay(valueKg, imperial)}
      onChange={(v) => onChange(displayToKg(v, imperial))}
      unit={weightUnit}
      step={0.1}
      error={error}
      required={required}
      name={name}
      hint={hint}
    />
  );
}

// ---------------------------------------------------------------- About you

export function AboutFields({ values, onChange, errors }: FieldsProps<'ageYears' | 'sex' | 'heightCm' | 'weightKg'>) {
  const { t } = useI18n();
  return (
    <div className="grid-2">
      <FieldSlot name="ageYears">
        <NumberField label={t('onboarding.fields.age')} value={values.ageYears} onChange={(v) => onChange({ ageYears: v })} min={LIMITS.ageMin} max={LIMITS.ageMax} error={errors.ageYears} required name="ageYears" inputMode="numeric" />
      </FieldSlot>
      <FieldSlot name="sex" error={errors.sex}>
        <Segmented label={t('onboarding.fields.sex')} value={values.sex} onChange={(v) => onChange({ sex: v })} options={SEXES.map((s) => ({ value: s, label: t(`enums.sex.${s}`) }))} />
        <InlineError error={errors.sex} />
      </FieldSlot>
      <HeightField value={values.heightCm} onChange={(v) => onChange({ heightCm: v })} error={errors.heightCm} />
      <FieldSlot name="weightKg">
        <WeightInput label={t('onboarding.fields.weight')} valueKg={values.weightKg} onChange={(v) => onChange({ weightKg: v })} error={errors.weightKg} required name="weightKg" />
      </FieldSlot>
    </div>
  );
}

// ---------------------------------------------------------------- Experience & ability

export function ExperienceField({ values, onChange, errors }: FieldsProps<'experienceLevel'>) {
  const { t } = useI18n();
  return (
    <FieldSlot name="experienceLevel" error={errors.experienceLevel}>
      <RadioCards
        label={t('onboarding.fields.experience')}
        columns={3}
        value={values.experienceLevel}
        onChange={(v) => onChange({ experienceLevel: v })}
        error={errors.experienceLevel}
        options={EXPERIENCE_LEVELS.map((e) => ({ value: e, label: t(`enums.experience.${e}`), description: t(`enums.experienceDescription.${e}`) }))}
      />
    </FieldSlot>
  );
}

export function AbilityFields({ values, onChange, errors }: FieldsProps<'ability'>) {
  const { t } = useI18n();
  const a = values.ability;
  const set = (patch: Partial<ProfileDraft['ability']>) => onChange({ ability: { ...a, ...patch } });
  return (
    <FieldSlot name="ability">
      <fieldset className="field profile-subsection">
        <legend className="field-label">{t('onboarding.fields.abilityTitle')}</legend>
        <p className="field-hint">{t('onboarding.fields.abilityHint')}</p>
        <div className="grid-3">
          <NumberField label={t('onboarding.fields.pushUps')} value={a.pushUpsMax} onChange={(v) => set({ pushUpsMax: v })} unit={t('common.units.reps')} error={errors['ability.pushUpsMax']} name="pushUpsMax" />
          <NumberField label={t('onboarding.fields.pullUps')} value={a.pullUpsMax} onChange={(v) => set({ pullUpsMax: v })} unit={t('common.units.reps')} error={errors['ability.pullUpsMax']} name="pullUpsMax" />
          <NumberField label={t('onboarding.fields.plankSeconds')} value={a.plankSeconds} onChange={(v) => set({ plankSeconds: v })} unit={t('common.units.sec')} error={errors['ability.plankSeconds']} name="plankSeconds" />
          <WeightInput label={t('onboarding.fields.squat1rm')} valueKg={a.squat1rmKg} onChange={(v) => set({ squat1rmKg: v })} error={errors['ability.squat1rmKg']} name="squat1rm" />
          <WeightInput label={t('onboarding.fields.bench1rm')} valueKg={a.bench1rmKg} onChange={(v) => set({ bench1rmKg: v })} error={errors['ability.bench1rmKg']} name="bench1rm" />
          <WeightInput label={t('onboarding.fields.deadlift1rm')} valueKg={a.deadlift1rmKg} onChange={(v) => set({ deadlift1rmKg: v })} error={errors['ability.deadlift1rmKg']} name="deadlift1rm" />
        </div>
      </fieldset>
    </FieldSlot>
  );
}

// ---------------------------------------------------------------- Goal

/** Supportive notice for teens who choose fat loss (no calorie deficit under 18). */
export function MinorFatLossNotice({ age, goal }: { age: number | null; goal: ProfileDraft['goal'] }) {
  const { t } = useI18n();
  if (age == null || age >= ADULT_AGE || goal !== 'fat_loss') return null;
  return (
    <Notice tone="info" icon="info" title={t('onboarding.notices.minorFatLossTitle')}>
      {t('onboarding.notices.minorFatLoss')}
    </Notice>
  );
}

export function GoalField({ values, onChange, errors, age }: FieldsProps<'goal'> & { age: number | null }) {
  const { t } = useI18n();
  return (
    <div className="stack">
      <FieldSlot name="goal" error={errors.goal}>
        <RadioCards
          label={t('onboarding.fields.goal')}
          value={values.goal}
          onChange={(v) => onChange({ goal: v })}
          error={errors.goal}
          options={GOALS.map((g) => ({ value: g, label: t(`enums.goal.${g}`), description: t(`enums.goalDescription.${g}`) }))}
        />
      </FieldSlot>
      <div aria-live="polite">
        <MinorFatLossNotice age={age} goal={values.goal} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Training setup

type TrainingKeys = 'trainingLocation' | 'equipment' | 'daysPerWeek' | 'sessionMinutes' | 'preferredDays' | 'weeklyWorkoutGoal';

export function TrainingFields({
  values,
  onChange,
  errors,
  weeklyGoalFollowsDays = false,
  onWeeklyGoalTouched,
}: FieldsProps<TrainingKeys> & { weeklyGoalFollowsDays?: boolean; onWeeklyGoalTouched?(): void }) {
  const { t } = useI18n();
  const weekdays = useWeekdayOptions('short');
  const [prefilled, setPrefilled] = useState(false);
  return (
    <div className="stack">
      <FieldSlot name="trainingLocation" error={errors.trainingLocation}>
        <RadioCards
          label={t('onboarding.fields.location')}
          columns={3}
          value={values.trainingLocation}
          onChange={(loc) => {
            if (loc === values.trainingLocation) return;
            const next = withLocation(values, loc);
            onChange({ trainingLocation: next.trainingLocation, equipment: next.equipment });
            setPrefilled(true);
          }}
          error={errors.trainingLocation}
          options={LOCATIONS.map((l) => ({ value: l, label: t(`enums.location.${l}`) }))}
        />
      </FieldSlot>
      <div aria-live="polite">{prefilled && <p className="field-hint">{t('onboarding.notices.locationPrefilled')}</p>}</div>
      <FieldSlot name="equipment" error={errors.equipment}>
        <ChipGroup
          label={t('onboarding.fields.equipment')}
          options={EQUIPMENT.map((e) => ({ value: e, label: t(`enums.equipment.${e}`) }))}
          value={values.equipment}
          onChange={(v) => onChange({ equipment: v })}
          hint={t('onboarding.fields.equipmentHint')}
          error={errors.equipment}
        />
        <div className="row profile-chip-tools">
          <span className="small muted" aria-live="polite">
            {t('onboarding.fields.equipmentCount', { count: values.equipment.length })}
          </span>
          <Button size="sm" variant="ghost" onClick={() => onChange({ equipment: [...EQUIPMENT] })} disabled={values.equipment.length === EQUIPMENT.length}>
            {t('onboarding.fields.selectAll')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onChange({ equipment: [] })} disabled={values.equipment.length === 0}>
            {t('onboarding.fields.clearAll')}
          </Button>
        </div>
      </FieldSlot>
      <div className="grid-2">
        <FieldSlot name="daysPerWeek" error={errors.daysPerWeek}>
          <Segmented
            label={t('onboarding.fields.daysPerWeek')}
            value={values.daysPerWeek}
            onChange={(d) => {
              const next = withDaysPerWeek(values, d, !weeklyGoalFollowsDays);
              onChange({ daysPerWeek: next.daysPerWeek, weeklyWorkoutGoal: next.weeklyWorkoutGoal });
            }}
            options={range(1, 7).map((n) => ({ value: n, label: String(n) }))}
          />
          <InlineError error={errors.daysPerWeek} />
        </FieldSlot>
        <FieldSlot name="sessionMinutes">
          <NumberField
            label={t('onboarding.fields.sessionMinutes')}
            value={values.sessionMinutes}
            onChange={(v) => onChange({ sessionMinutes: v })}
            unit={t('common.units.min')}
            min={LIMITS.sessionMinutesMin}
            max={LIMITS.sessionMinutesMax}
            step={5}
            error={errors.sessionMinutes}
            required
            name="sessionMinutes"
          />
        </FieldSlot>
      </div>
      <FieldSlot name="preferredDays" error={errors.preferredDays}>
        <ChipGroup
          label={t('onboarding.fields.preferredDays')}
          options={weekdays}
          value={values.preferredDays.map(String)}
          onChange={(v) => onChange({ preferredDays: v.map(Number).sort((a, b) => a - b) })}
          hint={t('onboarding.fields.preferredDaysHint')}
          error={errors.preferredDays}
        />
      </FieldSlot>
      <FieldSlot name="weeklyWorkoutGoal" error={errors.weeklyWorkoutGoal}>
        <Segmented
          label={t('onboarding.fields.weeklyGoal')}
          value={values.weeklyWorkoutGoal}
          onChange={(g) => {
            onChange({ weeklyWorkoutGoal: g });
            onWeeklyGoalTouched?.();
          }}
          options={range(1, 7).map((n) => ({ value: n, label: String(n) }))}
        />
        <p className="field-hint">{t('onboarding.fields.weeklyGoalHint')}</p>
        <InlineError error={errors.weeklyWorkoutGoal} />
      </FieldSlot>
    </div>
  );
}

// ---------------------------------------------------------------- Preferences & limitations

type PreferenceKeys = 'focusMuscleGroups' | 'exerciseLikes' | 'exerciseDislikes' | 'avoidExerciseIds' | 'injuries' | 'injuryNotes' | 'limitations';

export function PreferenceFields({ values, onChange, errors }: FieldsProps<PreferenceKeys>) {
  const { t } = useI18n();
  return (
    <div className="stack">
      <FieldSlot name="focusMuscleGroups" error={errors.focusMuscleGroups}>
        <ChipGroup
          label={t('onboarding.fields.focusGroups')}
          options={MUSCLE_GROUPS.map((g) => ({ value: g, label: t(`enums.muscleGroup.${g}`) }))}
          value={values.focusMuscleGroups}
          onChange={(v) => onChange({ focusMuscleGroups: v })}
          hint={t('onboarding.fields.focusGroupsHint')}
          error={errors.focusMuscleGroups}
        />
      </FieldSlot>
      <div className="grid-2">
        <FieldSlot name="exerciseLikes">
          <TextAreaField
            label={t('onboarding.fields.likes')}
            value={values.exerciseLikes}
            onChange={(e) => onChange({ exerciseLikes: e.target.value })}
            placeholder={t('onboarding.fields.likesPlaceholder')}
            maxLength={500}
            rows={2}
            error={errors.exerciseLikes}
            name="exerciseLikes"
          />
        </FieldSlot>
        <FieldSlot name="exerciseDislikes">
          <TextAreaField
            label={t('onboarding.fields.dislikes')}
            value={values.exerciseDislikes}
            onChange={(e) => onChange({ exerciseDislikes: e.target.value })}
            placeholder={t('onboarding.fields.dislikesPlaceholder')}
            maxLength={500}
            rows={2}
            error={errors.exerciseDislikes}
            name="exerciseDislikes"
          />
        </FieldSlot>
      </div>
      <FieldSlot name="avoidExerciseIds">
        <AvoidExercisesField value={values.avoidExerciseIds} onChange={(ids) => onChange({ avoidExerciseIds: ids })} error={errors.avoidExerciseIds} />
      </FieldSlot>
      <FieldSlot name="injuries" error={errors.injuries}>
        <ChipGroup
          label={t('onboarding.fields.injuries')}
          options={INJURY_AREAS.map((i) => ({ value: i, label: t(`enums.injury.${i}`) }))}
          value={values.injuries}
          onChange={(v) => onChange({ injuries: v })}
          hint={t('onboarding.fields.injuriesHint')}
          error={errors.injuries}
        />
      </FieldSlot>
      <div className="grid-2">
        <FieldSlot name="injuryNotes">
          <TextAreaField
            label={t('onboarding.fields.injuryNotes')}
            value={values.injuryNotes}
            onChange={(e) => onChange({ injuryNotes: e.target.value })}
            placeholder={t('onboarding.fields.injuryNotesPlaceholder')}
            maxLength={1000}
            rows={2}
            error={errors.injuryNotes}
            name="injuryNotes"
          />
        </FieldSlot>
        <FieldSlot name="limitations">
          <TextAreaField
            label={t('onboarding.fields.limitations')}
            value={values.limitations}
            onChange={(e) => onChange({ limitations: e.target.value })}
            placeholder={t('onboarding.fields.limitationsPlaceholder')}
            maxLength={1000}
            rows={2}
            error={errors.limitations}
            name="limitations"
          />
        </FieldSlot>
      </div>
      <Notice tone={values.injuries.length > 0 ? 'warning' : 'info'} icon="info" title={t('onboarding.notices.injuriesTitle')}>
        {t('onboarding.notices.injuries')}
      </Notice>
    </div>
  );
}

// ---------------------------------------------------------------- Nutrition

type NutritionKeys = 'dietType' | 'allergies' | 'dietaryRestrictions' | 'dislikedFoods' | 'mealsPerDay';

export function NutritionFields({ values, onChange, errors }: FieldsProps<NutritionKeys>) {
  const { t } = useI18n();
  return (
    <div className="stack">
      <FieldSlot name="dietType" error={errors.dietType}>
        <RadioCards
          label={t('onboarding.fields.dietType')}
          columns={2}
          value={values.dietType}
          onChange={(v) => onChange({ dietType: v })}
          error={errors.dietType}
          options={DIET_TYPES.map((d) => ({ value: d, label: t(`enums.diet.${d}`) }))}
        />
      </FieldSlot>
      <FieldSlot name="allergies" error={errors.allergies}>
        <ChipGroup
          label={t('onboarding.fields.allergies')}
          options={ALLERGENS.map((a) => ({ value: a, label: t(`enums.allergen.${a}`) }))}
          value={values.allergies}
          onChange={(v) => onChange({ allergies: v })}
          hint={t('onboarding.fields.allergiesHint')}
          error={errors.allergies}
        />
      </FieldSlot>
      <FieldSlot name="dietaryRestrictions" error={errors.dietaryRestrictions}>
        <ChipGroup
          label={t('onboarding.fields.restrictions')}
          options={DIETARY_RESTRICTIONS.map((r) => ({ value: r, label: t(`enums.restriction.${r}`) }))}
          value={values.dietaryRestrictions}
          onChange={(v) => onChange({ dietaryRestrictions: v })}
          error={errors.dietaryRestrictions}
        />
      </FieldSlot>
      <FieldSlot name="dislikedFoods">
        <TextAreaField
          label={t('onboarding.fields.dislikedFoods')}
          value={values.dislikedFoods}
          onChange={(e) => onChange({ dislikedFoods: e.target.value })}
          placeholder={t('onboarding.fields.dislikedFoodsPlaceholder')}
          maxLength={500}
          rows={2}
          error={errors.dislikedFoods}
          name="dislikedFoods"
        />
      </FieldSlot>
      <FieldSlot name="mealsPerDay" error={errors.mealsPerDay}>
        <Segmented
          label={t('onboarding.fields.mealsPerDay')}
          value={values.mealsPerDay}
          onChange={(v) => onChange({ mealsPerDay: v })}
          options={range(1, 8).map((n) => ({ value: n, label: String(n) }))}
        />
        <InlineError error={errors.mealsPerDay} />
      </FieldSlot>
    </div>
  );
}

// ---------------------------------------------------------------- Activity & lifestyle

type LifestyleKeys = 'activityLevel' | 'occupationActivity' | 'sleepHours' | 'stressLevel';

export function LifestyleFields({ values, onChange, errors }: FieldsProps<LifestyleKeys>) {
  const { t } = useI18n();
  return (
    <div className="stack">
      <FieldSlot name="activityLevel" error={errors.activityLevel}>
        <RadioCards
          label={t('onboarding.fields.activity')}
          value={values.activityLevel}
          onChange={(v) => onChange({ activityLevel: v })}
          error={errors.activityLevel}
          options={ACTIVITY_LEVELS.map((a) => ({ value: a, label: t(`enums.activity.${a}`), description: t(`enums.activityDescription.${a}`) }))}
        />
      </FieldSlot>
      <FieldSlot name="occupationActivity" error={errors.occupationActivity}>
        <RadioCards
          label={t('onboarding.fields.occupation')}
          columns={3}
          value={values.occupationActivity}
          onChange={(v) => onChange({ occupationActivity: v })}
          error={errors.occupationActivity}
          options={OCCUPATION_ACTIVITY.map((o) => ({ value: o, label: t(`enums.occupation.${o}`) }))}
        />
      </FieldSlot>
      <div className="grid-2">
        <FieldSlot name="sleepHours">
          <NumberField
            label={t('onboarding.fields.sleepHours')}
            value={values.sleepHours}
            onChange={(v) => onChange({ sleepHours: v })}
            unit={t('common.units.hours')}
            step={0.5}
            min={0}
            max={24}
            error={errors.sleepHours}
            name="sleepHours"
          />
        </FieldSlot>
        <FieldSlot name="stressLevel">
          <SelectField
            label={t('onboarding.fields.stress')}
            value={values.stressLevel ?? ''}
            onChange={(e) => onChange({ stressLevel: e.target.value === '' ? null : (e.target.value as StressLevel) })}
            error={errors.stressLevel}
            options={[{ value: '', label: t('onboarding.fields.stressUnset') }, ...STRESS_LEVELS.map((s) => ({ value: s, label: t(`enums.stress.${s}`) }))]}
          />
        </FieldSlot>
      </div>
    </div>
  );
}
