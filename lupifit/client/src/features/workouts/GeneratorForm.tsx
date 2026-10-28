import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { DEFAULT_EQUIPMENT_BY_LOCATION, EQUIPMENT, GOALS, LIMITS, LOCATIONS, MUSCLE_GROUPS, type Equipment, type Goal, type MuscleGroup, type TrainingLocation } from '@shared/constants';
import { generatePlanSchema } from '@shared/schemas/workouts';
import type { GeneratePlanInput, ProfileDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { qk } from '../../api/queryClient';
import {
  Button,
  Card,
  ChipGroup,
  Icon,
  Notice,
  NumberField,
  QueryState,
  RadioCards,
  Segmented,
  Spinner,
  Switch,
  TextAreaField,
  TextField,
  useToast,
} from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { activatePlan, fetchHealth, fetchPlans, fetchProfile, generatePlan, workoutKeys } from './api';
import { PlanPreview } from './PlanPreview';

interface FormState {
  goal: Goal;
  daysPerWeek: number;
  sessionMinutes: number | null;
  location: TrainingLocation;
  equipment: Equipment[];
  focusMuscleGroups: MuscleGroup[];
  notes: string;
  name: string;
}

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const MAX_FOCUS = 3;
const NOTES_MAX = 500;

function initialState(p: ProfileDTO): FormState {
  return {
    goal: p.goal ?? 'general_fitness',
    daysPerWeek: p.daysPerWeek ?? 3,
    sessionMinutes: p.sessionMinutes ?? 45,
    location: p.trainingLocation ?? 'gym',
    equipment: [...p.equipment],
    focusMuscleGroups: p.focusMuscleGroups.slice(0, MAX_FOCUS),
    notes: '',
    name: '',
  };
}

/** AI workout generator: profile-prefilled form → training engine → new draft plan. */
export function GeneratorForm() {
  const profile = useQuery({ queryKey: qk.profile, queryFn: ({ signal }) => fetchProfile(signal) });
  return (
    <div className="generator-layout">
      <QueryState query={profile}>{(p) => <GeneratorFormInner profile={p} />}</QueryState>
      <ExplanationCard />
    </div>
  );
}

function ExplanationCard() {
  const { t } = useI18n();
  const health = useQuery({ queryKey: workoutKeys.health, queryFn: ({ signal }) => fetchHealth(signal), staleTime: 5 * 60_000 });
  const configured = health.data?.ai.configured;
  return (
    <Card className="generator-explainer" title={t('workouts.generator.explanationTitle')}>
      <div className="stack-sm">
        <p>{t('workouts.generator.explanation')}</p>
        <p className="muted small">{t('workouts.generator.explanationRules')}</p>
        {configured != null && (
          <p className="inline-note small">
            <Icon name={configured ? 'sparkles' : 'info'} size={16} />
            <span>{configured ? t('workouts.generator.aiAvailable') : t('workouts.generator.aiUnavailable')}</span>
          </p>
        )}
      </div>
    </Card>
  );
}

function GeneratorFormInner({ profile }: { profile: ProfileDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initialState(profile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Quick path (profile defaults, one tap) until the user asks to customize. */
  const [customize, setCustomize] = useState(false);
  const plansQuery = useQuery({ queryKey: workoutKeys.plansList(false), queryFn: ({ signal }) => fetchPlans(false, signal) });
  const hasActive = plansQuery.data?.some((p) => p.status === 'active') ?? true;
  const [activateChoice, setActivateChoice] = useState<boolean | null>(null);
  // A first plan becomes the active one by default; an existing active plan is never replaced silently.
  const activateAfter = activateChoice ?? !hasActive;
  const onboarded = profile.onboardingCompletedAt != null;
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const generate = useIdempotentMutation(
    async (vars: { body: GeneratePlanInput; activate: boolean }, key) => {
      const plan = await generatePlan(vars.body, key);
      if (!vars.activate) return plan;
      try {
        return await activatePlan(plan.id);
      } catch {
        // The plan exists; activating it can be repeated from the plan page.
        return plan;
      }
    },
    {
    onSuccess: (plan) => {
      queryClient.setQueryData(qk.plan(plan.id), plan);
      void queryClient.invalidateQueries({ queryKey: ['plan'] });
      void queryClient.invalidateQueries({ queryKey: qk.plans });
      void queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success(plan.status === 'active' ? t('workouts.toasts.generatedActive') : t('workouts.toasts.generated'));
      navigate(`/workouts/plans/${plan.id}`);
    },
    onError: (err) => {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      // The form re-renders in place of the progress card: announce the failure as well.
      toast.error(errorMessage(err, i18n, 'workouts'));
    },
    },
  );

  const onLocation = (loc: TrainingLocation) => {
    setForm((f) => ({ ...f, location: loc, equipment: loc === profile.trainingLocation ? [...profile.equipment] : [...DEFAULT_EQUIPMENT_BY_LOCATION[loc]] }));
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (generate.isPending) return;
    const body: GeneratePlanInput = {
      goal: form.goal,
      daysPerWeek: form.daysPerWeek,
      sessionMinutes: form.sessionMinutes ?? undefined,
      location: form.location,
      equipment: form.equipment,
      focusMuscleGroups: form.focusMuscleGroups,
      ...(form.notes.trim() ? { notes: form.notes } : {}),
      ...(form.name.trim() ? { name: form.name } : {}),
    };
    const parsed = generatePlanSchema.safeParse({ ...body, sessionMinutes: form.sessionMinutes ?? Number.NaN });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= issue.code === 'too_small' ? 'too_small' : issue.code === 'too_big' ? 'too_big' : issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    generate.mutate({ body, activate: activateAfter });
  };

  if (generate.isPending) {
    return (
      <Card className="generator-pending">
        <div className="state" role="status" aria-live="polite">
          <Spinner size={36} />
          <strong>{t('workouts.generator.generating')}</strong>
          <span>{t('workouts.generator.generatingHint')}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" title={t('workouts.tabs.generate')} subtitle={t('workouts.generator.intro')}>
      <div className="stack-lg">
        {!onboarded && (
          <Notice tone="warning" title={t('workouts.quick.needProfileTitle')}>
            {t('workouts.quick.needProfileBody')}{' '}
            <Link to="/onboarding" className="link">
              {t('workouts.quick.completeProfile')}
            </Link>
          </Notice>
        )}
        <section className="ux-quick stack" aria-labelledby="quick-plan-title">
          <h3 className="section-title" id="quick-plan-title">
            {customize ? t('workouts.preview.title') : t('workouts.quick.title')}
          </h3>
          <PlanPreview input={form} experience={profile.experienceLevel} />
          <Switch
            label={t('workouts.quick.makeActive')}
            hint={hasActive ? t('workouts.quick.makeActiveReplace') : t('workouts.quick.makeActiveFirst')}
            checked={activateAfter}
            onChange={setActivateChoice}
          />
          {!customize && (
            <>
              {generate.isError && <Notice tone="danger">{errorMessage(generate.error, i18n, 'workouts')}</Notice>}
              <div className="ux-quick-actions">
                <Button variant="primary" size="lg" icon="sparkles" onClick={() => submit()} disabled={!onboarded} block>
                  {t('workouts.quick.submit')}
                </Button>
                <Button icon="edit" onClick={() => setCustomize(true)} aria-expanded={false} aria-controls="generator-custom-form">
                  {t('workouts.quick.customize')}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
      <form id="generator-custom-form" className="stack-lg ux-custom-form" onSubmit={submit} noValidate hidden={!customize}>
        <div className="row-between">
          <Notice tone="info">{t('workouts.generator.profileHint')}</Notice>
          <Button variant="ghost" size="sm" icon="chevronUp" onClick={() => setCustomize(false)} aria-expanded>
            {t('workouts.quick.hideCustomize')}
          </Button>
        </div>
        {generate.isError && customize && <Notice tone="danger">{errorMessage(generate.error, i18n, 'workouts')}</Notice>}
        <RadioCards<Goal>
          label={t('workouts.generator.goal')}
          value={form.goal}
          onChange={(g) => {
            set('goal', g);
          }}
          options={GOALS.map((g) => ({ value: g, label: t(`enums.goal.${g}`), description: t(`enums.goalDescription.${g}`) }))}
        />
        <div className="grid-2">
          <Segmented<number>
            label={t('workouts.generator.daysPerWeek')}
            value={form.daysPerWeek}
            onChange={(d) => {
                set('daysPerWeek', d);
            }}
            options={DAY_OPTIONS.map((d) => ({ value: d, label: i18n.formatNumber(d) }))}
          />
          <NumberField
            label={t('workouts.generator.minutes')}
            value={form.sessionMinutes}
            onChange={(v) => {
                set('sessionMinutes', v);
            }}
            min={LIMITS.sessionMinutesMin}
            max={LIMITS.sessionMinutesMax}
            step={5}
            unit={t('common.units.min')}
            error={fieldErrorMessage(errors.sessionMinutes, i18n)}
            name="sessionMinutes"
          />
        </div>
        <Segmented<TrainingLocation>
          label={t('workouts.generator.location')}
          value={form.location}
          onChange={onLocation}
          options={LOCATIONS.map((l) => ({ value: l, label: t(`enums.location.${l}`) }))}
        />
        <div className="stack-sm">
          <ChipGroup<Equipment>
            label={t('workouts.generator.equipment')}
            hint={t('workouts.generator.equipmentHint')}
            value={form.equipment}
            onChange={(v) => {
                set('equipment', v);
            }}
            options={EQUIPMENT.map((q) => ({ value: q, label: t(`enums.equipment.${q}`) }))}
          />
          <div className="row">
            <Button size="sm" variant="ghost" onClick={() => set('equipment', [...EQUIPMENT])}>
              {t('workouts.generator.selectAllEquipment')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => set('equipment', [])}>
              {t('workouts.generator.clearEquipment')}
            </Button>
          </div>
        </div>
        <ChipGroup<MuscleGroup>
          label={t('workouts.generator.focus')}
          hint={t('workouts.generator.focusHint')}
          value={form.focusMuscleGroups}
          max={MAX_FOCUS}
          onChange={(v) => {
            set('focusMuscleGroups', v);
          }}
          options={MUSCLE_GROUPS.map((g) => ({ value: g, label: t(`enums.muscleGroup.${g}`) }))}
        />
        <TextAreaField
          label={t('workouts.generator.notes')}
          hint={`${t('workouts.generator.notesHint')} (${form.notes.length}/${NOTES_MAX})`}
          placeholder={t('workouts.generator.notesPlaceholder')}
          value={form.notes}
          maxLength={NOTES_MAX}
          rows={3}
          onChange={(e) => set('notes', e.target.value)}
          error={fieldErrorMessage(errors.notes, i18n)}
          name="notes"
        />
        <TextField
          label={t('workouts.generator.name')}
          hint={t('workouts.generator.nameHint')}
          value={form.name}
          maxLength={LIMITS.textShortMax}
          onChange={(e) => set('name', e.target.value)}
          error={fieldErrorMessage(errors.name, i18n)}
          name="name"
        />
        <Button type="submit" variant="primary" size="lg" icon="sparkles" block>
          {t('workouts.generator.submit')}
        </Button>
      </form>
    </Card>
  );
}

