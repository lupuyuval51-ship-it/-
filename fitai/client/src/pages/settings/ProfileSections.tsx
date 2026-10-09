/** Body & goal, training setup and nutrition preference cards (PATCH /api/profile). */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { profileUpdateSchema, type ProfileUpdateInput } from '@shared/schemas/profile';
import type { ProfileDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { useToast } from '../../components/ui';
import { applyProfileChange, updateProfile } from '../../features/profile/api';
import { changedFields, draftFromProfile, firstInvalidField, toPayload, validate, type DraftField, type ProfileDraft } from '../../features/profile/draft';
import {
  AboutFields,
  AbilityFields,
  ExperienceField,
  GoalField,
  LifestyleFields,
  NutritionFields,
  PreferenceFields,
  TrainingFields,
} from '../../features/profile/fields';
import { focusField, localizeIssues, serverFieldErrors, type FieldErrors } from '../../features/profile/validation';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { SectionCard, useSectionForm } from './sectionForm';

function pick<K extends DraftField>(draft: ProfileDraft, keys: readonly K[]): Pick<ProfileDraft, K> {
  return Object.fromEntries(keys.map((k) => [k, draft[k]])) as Pick<ProfileDraft, K>;
}

interface SectionRenderProps<K extends DraftField> {
  values: Pick<ProfileDraft, K>;
  onChange(patch: Partial<Pick<ProfileDraft, K>>): void;
  errors: FieldErrors;
}

/** Shared logic of a profile card: local form, client validation, PATCH of changed fields only. */
function ProfileSection<K extends DraftField>({
  id,
  profile,
  keys,
  title,
  subtitle,
  render,
}: {
  id: string;
  profile: ProfileDTO;
  keys: readonly K[];
  title: string;
  subtitle: string;
  render(props: SectionRenderProps<K>): ReactNode;
}) {
  const i18n = useI18n();
  const { t } = i18n;
  const { imperial } = useUnits();
  const toast = useToast();
  const queryClient = useQueryClient();
  const source = useMemo(() => pick(draftFromProfile(profile), keys), [profile, keys]);
  const form = useSectionForm(id, source);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const schema = useMemo(() => profileUpdateSchema.pick(Object.fromEntries(keys.map((k) => [k, true])) as Parameters<typeof profileUpdateSchema.pick>[0]), [keys]);

  const mutation = useMutation({
    mutationFn: ({ changes }: { changes: ProfileUpdateInput; submitted: Pick<ProfileDraft, K> }) => updateProfile(changes),
    onSuccess: async (res, { submitted }) => {
      form.commit(pick(draftFromProfile(res.profile), keys), submitted);
      setErrors({});
      toast.success(t('settings.saved'));
      if (res.customTargetsReset) toast.info(t('settings.body.targetsReset'));
      await applyProfileChange(queryClient, res.profile);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'validation_error') {
        const fieldErrors = serverFieldErrors(err.details, i18n);
        setErrors(fieldErrors);
        focusField(firstInvalidField(keys, Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, { code: 'invalid', message: '' }]))), formRef.current ?? document);
      }
      setFormError(errorMessage(err, i18n, 'settings'));
    },
  });

  const onSubmit = () => {
    setFormError(null);
    const payload = toPayload(form.values);
    const result = validate(schema, payload);
    if (!result.ok) {
      setErrors(localizeIssues(result.issues, i18n, imperial));
      focusField(firstInvalidField(keys, result.issues), formRef.current ?? document);
      return;
    }
    setErrors({});
    const changes = changedFields(payload, toPayload(form.base)) as ProfileUpdateInput;
    if (Object.keys(changes).length === 0) {
      form.reset();
      return;
    }
    mutation.mutate({ changes, submitted: form.values });
  };

  const onChange = (patch: Partial<Pick<ProfileDraft, K>>) => {
    form.set(patch);
    const touched = Object.keys(patch);
    setErrors((errs) => Object.fromEntries(Object.entries(errs).filter(([path]) => !touched.includes(path.split('.')[0] ?? ''))));
  };

  return (
    <SectionCard
      id={id}
      title={title}
      subtitle={subtitle}
      dirty={form.dirty}
      saving={mutation.isPending}
      error={formError}
      formRef={formRef}
      onSubmit={onSubmit}
      onDiscard={() => {
        form.reset();
        setErrors({});
        setFormError(null);
      }}
    >
      {render({ values: form.values, onChange, errors })}
    </SectionCard>
  );
}

const BODY_KEYS = ['ageYears', 'sex', 'heightCm', 'weightKg', 'goal', 'experienceLevel', 'activityLevel', 'occupationActivity', 'sleepHours', 'stressLevel'] as const;
const TRAINING_KEYS = [
  'trainingLocation',
  'equipment',
  'daysPerWeek',
  'sessionMinutes',
  'preferredDays',
  'weeklyWorkoutGoal',
  'ability',
  'focusMuscleGroups',
  'exerciseLikes',
  'exerciseDislikes',
  'avoidExerciseIds',
  'injuries',
  'injuryNotes',
  'limitations',
] as const;
const NUTRITION_KEYS = ['dietType', 'allergies', 'dietaryRestrictions', 'dislikedFoods', 'mealsPerDay'] as const;

export function BodySection({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  return (
    <ProfileSection
      id="settings-body"
      profile={profile}
      keys={BODY_KEYS}
      title={t('settings.body.title')}
      subtitle={t('settings.body.subtitle')}
      render={({ values, onChange, errors }) => (
        <div className="stack-lg">
          <AboutFields values={values} onChange={onChange} errors={errors} />
          <GoalField values={values} onChange={onChange} errors={errors} age={values.ageYears} />
          <ExperienceField values={values} onChange={onChange} errors={errors} />
          <div className="stack">
            <h3 className="section-title">{t('settings.body.lifestyle')}</h3>
            <LifestyleFields values={values} onChange={onChange} errors={errors} />
          </div>
        </div>
      )}
    />
  );
}

export function TrainingSection({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  return (
    <ProfileSection
      id="settings-training"
      profile={profile}
      keys={TRAINING_KEYS}
      title={t('settings.training.title')}
      subtitle={t('settings.training.subtitle')}
      render={({ values, onChange, errors }) => (
        <div className="stack-lg">
          <TrainingFields values={values} onChange={onChange} errors={errors} />
          <AbilityFields values={values} onChange={onChange} errors={errors} />
          <div className="stack">
            <h3 className="section-title">{t('settings.training.preferencesTitle')}</h3>
            <PreferenceFields values={values} onChange={onChange} errors={errors} />
          </div>
        </div>
      )}
    />
  );
}

export function NutritionSection({ profile }: { profile: ProfileDTO }) {
  const { t } = useI18n();
  return (
    <ProfileSection
      id="settings-nutrition"
      profile={profile}
      keys={NUTRITION_KEYS}
      title={t('settings.nutrition.title')}
      subtitle={t('settings.nutrition.subtitle')}
      render={(props) => <NutritionFields {...props} />}
    />
  );
}
